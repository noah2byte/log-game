// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { DS } from '../config';
import { FR } from '../core/assets';
import { $ } from '../core/state';
import { FSC } from '../data/enemies';
import { ctx } from './canvas';

export function drawItem(i, x, y, size) {
  const S = $.ESPR.items;
  if (!S) return;
  const f = S.fr[i];
  const k = size / Math.max(f.w, f.h);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(S.img, f.x, 0, f.w, f.h, x - (f.w * k) / 2, y - (f.h * k) / 2, f.w * k, f.h * k);
}
// ---- 무기: 넋칼 / 넋창 / 넋활 ----

export function drawLogAt(x, y, sc, fi, face) {
  const f = FR[fi];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face || 1, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage($.SPR, f.x, 0, f.w, f.h, -f.ax * sc, -f.ay * sc, f.w * sc, f.h * sc);
  ctx.restore();
}

// 방사형 그라데이션을 매 프레임 새로 만들면 느린 기기에서 프레임이 튄다.
// 반지름·색·세기별로 한 번 그려 둔 원을 재사용한다(세기는 0.05 단위로 반올림).
const GLOW_CACHE = new Map();
export function glow(x, y, r, c, a) {
  if (r <= 0 || a <= 0) return;
  const R = Math.max(4, Math.round(r / 4) * 4),
    A = Math.round(Math.min(1, a) * 20) / 20;
  if (A <= 0) return;
  const key = R + '|' + c + '|' + A;
  let cv = GLOW_CACHE.get(key);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = cv.height = R * 2;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(R, R, 2, R, R, R);
    gr.addColorStop(0, `rgba(${c},${A})`);
    gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, R * 2, R * 2);
    if (GLOW_CACHE.size > 400) GLOW_CACHE.clear();
    GLOW_CACHE.set(key, cv);
  }
  ctx.drawImage(cv, x - R, y - R);
}

export // ---- 엔딩 ----
function drawSprAt(k, fi, x, y, scale, face) {
  const S = $.ESPR[k];
  if (!S) return;
  const f = S.fr[fi];
  const sc = (scale / DS) * ((FSC[k] && FSC[k][fi]) || 1);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face || 1, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(S.img, f.x, 0, f.w, f.h, -f.ax * sc, -f.ay * sc, f.w * sc, f.h * sc);
  ctx.restore();
}
