// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { drawShock } from '../bosses/common';
import { drawArrows, drawEproj } from '../combat/projectiles';
import { drawSword } from '../combat/sword';
import { AS, H, PAL, S, W } from '../config';
import { FR, bgImage, drawImageLayer } from '../core/assets';
import { $ } from '../core/state';
import { STAGES } from '../data/stages';
import { THEMES, buildBackdrop, drawParticles, drawOverlay, drawPitMist, drawSolid } from '../world/themes';
import { atkFrame, box, frameIdx, lampPos } from '../entities/player';
import { ctx } from './canvas';
import { drawItem, glow } from './draw';
import { drawEnemies, drawFx } from './sprites';
import { hud } from '../ui/hud';
import {
  drawEmbers,
  drawLayer,
  drawMist,
  drawSouls,
  far,
  mid,
  near,
  sky,
  vignette,
} from '../world/background';
import { drawCks } from '../world/checkpoints';

export // ---- render ----
function drawGround() {
  const DC = ['#2f8f7f', '#c0452f', '#e8b24a', '#2f8f7f', '#3a5fa0'];
  for (const s of $.solids) {
    const x = Math.round(s.x - $.cam),
      y = s.y;
    if (x > W || x + s.w < 0) continue;
    const thin = s.h < 40;
    if (thin && s.metal) {
      ctx.fillStyle = '#5c6570';
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = '#8d97a3';
      ctx.fillRect(x, y, s.w, 3);
      ctx.fillStyle = '#39414a';
      for (let xx = x + 6; xx < x + s.w - 4; xx += 16) {
        ctx.fillRect(xx, y + (s.h >= 20 ? 8 : 5), 3, 3);
        if (s.h >= 20) ctx.fillRect(xx, y + 16, 3, 3);
      }
      ctx.fillStyle = '#c0452f';
      ctx.fillRect(x + s.w / 2 - 10, y + s.h - 6, 20, 4);
      if (s.eat > 0) {
        ctx.fillStyle = '#140d1f';
        for (const ex of [x, x + s.w]) {
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.arc(ex, y + 4 + k * 8, 5, 0, 7);
            ctx.fill();
          }
        }
      }
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, s.w - 3, s.h - 3);
      continue;
    }
    drawSolid(ctx, s, x, THEMES[$.STAGE], $.t);
  }
  // 홍살문: 연옥의 출구
  for (const gw of [$.GOAL + 40].concat($.ARENA.done ? [$.ARENA.x1 - 90] : [])) {
    const gx = gw - $.cam;
    if (gx > -160 && gx < W + 160) {
      const gr = ctx.createLinearGradient(0, 300, 0, 460);
      gr.addColorStop(0, 'rgba(246,223,160,0)');
      gr.addColorStop(1, 'rgba(246,223,160,.55)');
      ctx.fillStyle = gr;
      ctx.fillRect(gx - 46, 300, 92, 160);
      ctx.fillStyle = '#c0452f';
      ctx.fillRect(gx - 58, 290, 12, 170);
      ctx.fillRect(gx + 46, 290, 12, 170);
      ctx.fillRect(gx - 66, 292, 132, 8);
      ctx.fillRect(gx - 66, 322, 132, 6);
      for (let xx = gx - 54; xx <= gx + 50; xx += 8) {
        ctx.fillRect(xx, 270, 3, 24);
        ctx.beginPath();
        ctx.moveTo(xx - 2, 272);
        ctx.lineTo(xx + 1.5, 262);
        ctx.lineTo(xx + 5, 272);
        ctx.fill();
      }
      ctx.fillStyle = '#c0452f';
      ctx.beginPath();
      ctx.arc(gx, 311, 9, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#3a5fa0';
      ctx.beginPath();
      ctx.arc(gx, 311, 9, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(gx - 58, 290, 12, 170);
      ctx.strokeRect(gx + 46, 290, 12, 170);
    }
  }
}

export function drawClues() {
  for (const c of $.clues) {
    if (c.got || c.seen <= 0) continue;
    const x = c.x - $.cam,
      y = c.y + Math.sin($.t * 3 + c.x) * 3;
    ctx.globalAlpha = c.seen;
    glow(x, y, 20, '191,245,236', 0.35);
    drawItem(4, x, y, 24);
    ctx.globalAlpha = 1;
  }
}

export function drawPlayer() {
  const fi = frameIdx(),
    f = FR[fi];
  if ($.p.inv > 0 && $.p.hurtT <= 0 && Math.floor($.t * 16) % 2) return;
  const lp = lampPos();
  if (lp) {
    const r = $.p.lampR * (1 + Math.sin($.t * 9) * 0.03);
    const g = ctx.createRadialGradient(lp.x - $.cam, lp.y, 4, lp.x - $.cam, lp.y, r);
    g.addColorStop(0, 'rgba(120,235,215,.42)');
    g.addColorStop(0.5, 'rgba(90,210,195,.12)');
    g.addColorStop(1, 'rgba(90,210,195,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lp.x - $.cam, lp.y, r, 0, 7);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    if ($.p.lampR > 110) {
      ctx.globalAlpha = Math.min(1, ($.p.lampR - 110) / 80) * 0.5;
      ctx.strokeStyle = '#bff5ec';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.lineDashOffset = -$.t * 30;
      ctx.beginPath();
      ctx.arc(lp.x - $.cam, lp.y, r * 0.92, 0, 7);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }
  ctx.save();
  ctx.translate(Math.round($.p.x - $.cam), Math.round($.p.y));
  ctx.scale(atkFrame() !== null ? $.sword.face || $.p.face : $.p.face, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'low';
  const af = atkFrame();
  if (af !== null && $.ESPR.logatk) {
    const A = $.ESPR.logatk.fr[af];
    ctx.drawImage($.ESPR.logatk.img, A.x, 0, A.w, A.h, -A.ax * AS, -A.ay * AS, A.w * AS, A.h * AS);
  } else ctx.drawImage($.SPR, f.x, 0, f.w, f.h, -f.ax * S, -f.ay * S, f.w * S, f.h * S);
  ctx.restore();
  if ($.debug) {
    const b = box();
    ctx.strokeStyle = '#e0302a';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x - $.cam + 0.5, b.y + 0.5, b.w, b.h);
    ctx.fillStyle = '#e0302a';
    ctx.fillRect($.p.x - $.cam - 2, $.p.y - 2, 4, 4);
    if (lp) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(lp.x - $.cam - 2, lp.y - 2, 4, 4);
    }
  }
}

export function render() {
  ctx.save();
  if ($.shake > 0) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8);
  const now = performance.now(),
    rdt = Math.min(0.05, (now - $.lastR) / 1000);
  $.lastR = now;
  ctx.imageSmoothingEnabled = false;
  // 스테이지마다 다른 배경 테마(첫 스테이지는 원래 배경)
  const T = THEMES[$.STAGE],
    B = buildBackdrop($.STAGE, { sky, far, mid, near });
  const IB = bgImage($.STAGE, 'back'),
    IF = bgImage($.STAGE, 'front');
  if (IB) {
    // 그림으로 받은 배경: 뒤(하늘·먼 풍경)는 거의 고정, 앞(중간·가까운 풍경)은 더 빠르게 흘러 깊이감을 낸다
    ctx.imageSmoothingEnabled = true;
    drawImageLayer(ctx, IB, 0.06, $.cam, W, H);
    if ($.STAGE === 0) drawSouls(rdt);
    if (IF) drawImageLayer(ctx, IF, 0.3, $.cam, W, H);
    // 그림 배경은 디테일이 많아 캐릭터가 묻히기 쉬워서 살짝 눌러 준다
    ctx.fillStyle = 'rgba(13,9,21,.28)';
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
  } else {
    ctx.drawImage(B.sky, 0, 0, W, H);
    drawLayer(B.far, 0.07, $.cam, 4);
    drawLayer(B.mid, 0.22, $.cam, -30);
    if ($.STAGE === 0) drawSouls(rdt);
    drawLayer(B.near, 0.5, $.cam, -4);
  }
  if ($.STAGE === 0 && !IB) {
    ctx.fillStyle = STAGES[0].tint;
    ctx.fillRect(0, 0, W, H);
  }
  drawPitMist(ctx, T, $.t, W, H);
  drawGround();
  drawCks();
  drawClues();
  drawEnemies();
  drawShock();
  drawEproj();
  drawArrows();
  drawPlayer();
  drawSword();
  drawFx();
  if ($.STAGE === 0) drawEmbers(rdt);
  else drawParticles(ctx, T.particle, rdt, $.t, W, H);
  drawOverlay(ctx, T.overlay, $.t, W, H);
  ctx.restore();
  ctx.drawImage(vignette, 0, 0, W, H);
  if ($.p.noLamp && $.mode === 'game') {
    const g = ctx.createRadialGradient($.p.x - $.cam, $.p.y - 40, 60, $.p.x - $.cam, $.p.y - 40, 300);
    g.addColorStop(0, 'rgba(8,5,14,0)');
    g.addColorStop(1, 'rgba(8,5,14,.82)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  hud();
}
