// 에셋 로더: 스프라이트 PNG와 프레임 메타데이터(JSON), 엔딩 일러스트를 불러온다.
// import.meta.glob을 쓰는 이유: 파일을 추가하면 코드 수정 없이 자동으로 포함되고,
// 일반 빌드에서는 해시가 붙은 개별 파일로, 단일 파일 빌드에서는 data URI로 인라인되기 때문이다.
import spriteMeta from '../assets/sprites.json';
import endingUrl from '../assets/cg/ending.webp';

export interface PlayerFrame {
  i: number;
  x?: number;
  w: number;
  h: number;
  ax: number;
  ay: number;
  lamp: [number, number, number] | null;
}

// WebP를 쓰는 이유: 같은 화질에서 PNG보다 3분의 1 크기라(5.7MB → 2.0MB) 첫 로딩이 빨라진다.
const pngs = import.meta.glob('../assets/sprites/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** 적·보스·아이템 스프라이트 프레임: [x, w, h, anchorX, anchorY, ...추가값] */
export const EMETA: Record<string, number[][]> = spriteMeta.frames as Record<string, number[][]>;
/** 로그(주인공) 프레임. buildPlayerSprite에서 여백만큼 좌표가 보정된다. */
export const FR: PlayerFrame[] = spriteMeta.player as PlayerFrame[];
/** 스프라이트 키 → 이미지 URL (주인공 아틀라스 log.png는 제외) */
export const SPRITE_URLS: Record<string, string> = {};
for (const [path, url] of Object.entries(pngs)) {
  const key = path.split('/').pop()!.replace('.webp', '');
  if (key !== 'log') SPRITE_URLS[key] = url;
}
export const CGIMG = new Image();

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = url;
  });
}

export async function loadAssets(): Promise<{ atlas: HTMLImageElement }> {
  CGIMG.src = endingUrl;
  const atlas = await loadImage(pngs['../assets/sprites/log.webp']);
  return { atlas };
}

// ---- 스테이지 배경 이미지(선택) ----
// src/assets/bg/stageNN/back.webp(불투명, 하늘+먼 풍경), front.webp(투명, 중간+가까운 풍경)이 있으면
// 코드로 그린 배경 대신 그 이미지를 쓴다. 없으면 기존 코드 배경으로 자동 대체된다.
const bgUrls = import.meta.glob('../assets/bg/*/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const bgCache = new Map<string, HTMLImageElement>();
export function bgImage(stage: number, layer: 'back' | 'front'): HTMLImageElement | null {
  const key = `../assets/bg/stage${String(stage + 1).padStart(2, '0')}/${layer}.webp`;
  const url = bgUrls[key];
  if (!url) return null;
  let im = bgCache.get(key);
  if (!im) {
    im = new Image();
    im.src = url;
    bgCache.set(key, im);
  }
  return im.complete && im.naturalWidth ? im : null;
}
/** 이미지 레이어를 화면 높이에 맞춰 가로로 반복해 그린다(패럴랙스). */
export function drawImageLayer(
  ctx: CanvasRenderingContext2D,
  im: HTMLImageElement,
  factor: number,
  cam: number,
  W: number,
  H: number,
) {
  const sc = H / im.naturalHeight,
    tw = im.naturalWidth * sc;
  let x = -((cam * factor) % tw);
  if (x > 0) x -= tw;
  for (; x < W; x += tw) ctx.drawImage(im, Math.floor(x), 0, Math.ceil(tw) + 1, H);
}
