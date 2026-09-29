#!/usr/bin/env python3
"""마젠타 배경 스프라이트 시트를 게임용 아틀라스로 바꾸는 도구.

제미나이 등으로 받은 시트(단색 마젠타 배경)를 넣으면
  1) 배경을 반투명 경계까지 고려해 제거하고(분홍 테두리 방지),
  2) 캐릭터 덩어리를 찾아 프레임으로 자르고,
  3) 행 → 열 순서로 정렬해
  4) src/assets/sprites/<name>.webp 와 src/assets/sprites.json 의 frames[<name>] 을 갱신한다.

프레임 형식은 [x, w, h, anchorX, anchorY] 이다. anchorY는 발끝(가장 아래 불투명 픽셀),
anchorX는 불투명 픽셀의 무게중심이다. 프레임마다 폭이 달라도 캐릭터가 좌우로 떨리지 않게 하려는 것이다.

사용 예:
  python3 tools/sprite_pipeline.py sheets/ox.png --name ox
  python3 tools/sprite_pipeline.py sheets/horse.png --name horse --split 6:y:569 --split 7:y:569
    (--split i:axis:v  → i번째로 검출된 덩어리가 이웃 프레임과 붙어 있을 때 축 기준으로 둘로 나눈다)
필요 패키지: pillow numpy scipy
"""
import argparse, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'src', 'assets')

def key_magenta(src):
    border = np.concatenate([src[0], src[-1], src[:, 0], src[:, -1]])
    bg = np.median(border, 0)
    r, g, b = src[..., 0], src[..., 1], src[..., 2]
    m = np.minimum(r, b) - g                     # "마젠타다움"
    mb = min(bg[0], bg[2]) - bg[1]
    alpha = np.clip((mb - 15 - m) / 140, 0, 1)   # 배경에 가까울수록 투명
    h, w = alpha.shape                           # 오른쪽 아래 워터마크는 강한 전경만 남긴다
    alpha[h - 150:, w - 150:] *= (m[h - 150:, w - 150:] < mb - 120)
    alpha[alpha < .1] = 0
    fg = np.clip(bg + (src - bg) / np.maximum(alpha[..., None], 1e-3), 0, 255)  # 마젠타 번짐 제거
    return np.dstack([fg, alpha * 255]).astype(np.uint8), alpha

def find_frames(alpha, splits):
    mask = alpha > .35
    lab, _ = ndimage.label(ndimage.binary_dilation(mask, iterations=2))
    objs = ndimage.find_objects(lab)
    sizes = ndimage.sum(mask, lab, range(1, len(objs) + 1))
    comps = [dict(ids=[i + 1], b=[s[1].start, s[0].start, s[1].stop, s[0].stop], n=int(sizes[i]))
             for i, s in enumerate(objs) if sizes[i] >= 25]
    big = [c for c in comps if c['n'] > 2500]
    def gap(a, b):
        return max(max(0, max(a[0], b[0]) - min(a[2], b[2])), max(0, max(a[1], b[1]) - min(a[3], b[3])))
    for s in comps:                              # 떨어져 나온 조각(탈, 모자, 파편)은 가까운 프레임에 붙인다
        if s['n'] > 2500 or not big: continue
        best = min(big, key=lambda c: gap(c['b'], s['b']))
        if gap(best['b'], s['b']) < 45:
            best['ids'] += s['ids']; b = best['b']; sb = s['b']
            best['b'] = [min(b[0], sb[0]), min(b[1], sb[1]), max(b[2], sb[2]), max(b[3], sb[3])]
    big.sort(key=lambda c: (c['b'][1], c['b'][0]))
    masks = []
    yy, xx = np.mgrid[0:lab.shape[0], 0:lab.shape[1]]
    for i, c in enumerate(big):
        base = np.isin(lab, c['ids'])
        if i in splits:
            axis, v = splits[i]; coord = yy if axis == 'y' else xx
            masks += [base & (coord < v), base & (coord >= v)]
        else:
            masks.append(base)
    return masks

def order_rows(items):
    items.sort(key=lambda f: (f['y0'] + f['y1']) / 2)
    hs = sorted(f['y1'] - f['y0'] for f in items); med = hs[len(hs) // 2]
    rows, cur = [], [items[0]]
    for f in items[1:]:
        prev = (cur[-1]['y0'] + cur[-1]['y1']) / 2
        if (f['y0'] + f['y1']) / 2 - prev > med * .45: rows.append(cur); cur = [f]
        else: cur.append(f)
    rows.append(cur)
    return [f for r in rows for f in sorted(r, key=lambda f: f['x0'])]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sheet'); ap.add_argument('--name', required=True)
    ap.add_argument('--scale', type=float, default=.6, help='저장 배율(기본 0.6, 게임은 이 값을 DS로 보정한다)')
    ap.add_argument('--split', action='append', default=[], help='i:axis:value')
    a = ap.parse_args()
    splits = {int(i): (ax, int(v)) for i, ax, v in (s.split(':') for s in a.split)}
    src = np.asarray(Image.open(a.sheet).convert('RGB')).astype(float)
    rgba, alpha = key_magenta(src)
    items = []
    for m in find_frames(alpha, splits):
        img = rgba.copy(); img[~m] = 0
        ys, xs = np.nonzero(img[..., 3] > 40)
        sub = img[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        sy, sx = np.nonzero(sub[..., 3] > 200)
        items.append(dict(sub=sub, foot=sy.max(), cx=sx.mean(), y0=ys.min(), y1=ys.max(), x0=xs.min()))
    items = order_rows(items)
    ims, frames, x = [], [], 0
    for f in items:
        im = Image.fromarray(f['sub'])
        im = im.resize((max(1, round(im.width * a.scale)), max(1, round(im.height * a.scale))), Image.LANCZOS)
        frames.append([x, im.width, im.height, round(float(f['cx']) * a.scale, 1), round(float(f['foot']) * a.scale, 1)])
        ims.append(im); x += im.width + 2
    atlas = Image.new('RGBA', (x, max(i.height for i in ims)))
    for im, fr in zip(ims, frames): atlas.paste(im, (fr[0], 0))
    atlas.save(os.path.join(ASSETS, 'sprites', a.name + '.webp'), 'WEBP', quality=92, alpha_quality=100, method=6)
    meta_path = os.path.join(ASSETS, 'sprites.json')
    meta = json.load(open(meta_path, encoding='utf-8'))
    meta['frames'][a.name] = frames
    json.dump(meta, open(meta_path, 'w', encoding='utf-8'), separators=(',', ':'))
    print(f'{a.name}: {len(frames)} frames')
    for i, fr in enumerate(frames): print(f'  #{i:2d} w={fr[1]} h={fr[2]}')

if __name__ == '__main__':
    main()
