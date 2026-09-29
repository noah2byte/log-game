#!/usr/bin/env python3
"""그림으로 받은 스테이지 배경을 게임용 레이어로 바꾸는 도구.

  back  : 하늘과 먼 풍경. 불투명 그대로 쓴다.
  front : 중간·가까운 풍경. 마젠타(#FF00FF) 배경을 투명하게 뺀다.

두 레이어 모두 좌우 끝을 서로 겹쳐 섞어서(crossfade) 가로로 반복해도 이음매가 보이지 않게 만들고,
높이 540px로 맞춰 src/assets/bg/stageNN/<layer>.webp 로 저장한다.
AI가 그린 파노라마는 좌우 끝이 정확히 이어지지 않는 경우가 대부분이라, 도구 쪽에서 이음매를 만들어 주는 것이다.

사용 예:
  python3 tools/bg_pipeline.py back.png  --stage 2 --layer back
  python3 tools/bg_pipeline.py front.png --stage 2 --layer front
필요 패키지: pillow numpy
"""
import argparse, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def key_magenta(src):
    border = np.concatenate([src[0], src[:, 0], src[:, -1]])
    mag = border[(border[:, 0] > 180) & (border[:, 2] > 180) & (border[:, 1] < 90)]
    bg = np.median(mag, 0) if len(mag) else np.array([255., 0., 255.])
    r, g, b = src[..., 0], src[..., 1], src[..., 2]
    m = np.minimum(r, b) - g
    mb = min(bg[0], bg[2]) - bg[1]
    alpha = np.clip((mb - 15 - m) / 140, 0, 1)
    alpha[alpha < .1] = 0
    fg = np.clip(bg + (src - bg) / np.maximum(alpha[..., None], 1e-3), 0, 255)
    return np.dstack([fg, alpha * 255])

def seamless(a, frac=.08):
    w = a.shape[1]; o = max(16, int(w * frac))
    out = a[:, :w - o].copy()
    ramp = np.linspace(0, 1, o)[None, :, None]
    out[:, :o] = a[:, w - o:] * (1 - ramp) + a[:, :o] * ramp
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image'); ap.add_argument('--stage', type=int, required=True, help='1~12')
    ap.add_argument('--layer', choices=['back', 'front'], required=True)
    ap.add_argument('--height', type=int, default=540)
    a = ap.parse_args()
    src = np.asarray(Image.open(a.image).convert('RGB')).astype(float)
    arr = key_magenta(src) if a.layer == 'front' else np.dstack([src, np.full(src.shape[:2], 255.)])
    arr = seamless(arr)
    im = Image.fromarray(arr.clip(0, 255).astype(np.uint8), 'RGBA')
    im = im.resize((round(im.width * a.height / im.height), a.height), Image.LANCZOS)
    if a.layer == 'back': im = im.convert('RGB')
    d = os.path.join(ROOT, 'src', 'assets', 'bg', f'stage{a.stage:02d}'); os.makedirs(d, exist_ok=True)
    fp = os.path.join(d, a.layer + '.webp'); im.save(fp, 'WEBP', quality=88, alpha_quality=100, method=6)
    print('저장:', fp, im.size)

if __name__ == '__main__':
    main()
