// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { STAGES } from '../data/stages';
import { eBox } from '../combat/damage';
import { DS, PAL, W } from '../config';
import { EMETA, FR, SPRITE_URLS } from '../core/assets';
import { $ } from '../core/state';
import { ET, FA, FPS, FSC } from '../data/enemies';
import { ctx } from './canvas';
import { glow } from './draw';

export function updateFx(dt) {
  for (const q of $.fx) {
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vy += 900 * dt;
    q.life -= dt;
  }
  $.fx = $.fx.filter((q) => q.life > 0);
  for (const q of $.pops) {
    q.y -= 40 * dt;
    q.life -= dt * 0.8;
  }
  $.pops = $.pops.filter((q) => q.life > 0);
}

export function buildOutlined(img, frames, rim) {
  const pad = 3,
    tw = frames.reduce((s, f) => s + f[1] + pad * 2 + 2, 0),
    th = Math.max(...frames.map((f) => f[2])) + pad * 2;
  const base = document.createElement('canvas');
  base.width = tw;
  base.height = th;
  const bg = base.getContext('2d');
  let nx = 0;
  const out = [];
  for (const [x, w, h, ax, ay] of frames) {
    bg.drawImage(img, x, 0, w, h, nx + pad, pad, w, h);
    out.push({
      x: nx,
      w: w + pad * 2,
      h: h + pad * 2,
      ax: ax + pad,
      ay: ay + pad,
    });
    nx += w + pad * 2 + 2;
  }
  const sil = document.createElement('canvas');
  sil.width = tw;
  sil.height = th;
  const sg = sil.getContext('2d');
  sg.drawImage(base, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = rim;
  sg.fillRect(0, 0, tw, th);
  const c = document.createElement('canvas');
  c.width = tw;
  c.height = th;
  const og = c.getContext('2d');
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ])
    og.drawImage(sil, dx, dy);
  og.drawImage(base, 0, 0);
  return {
    img: c,
    fr: out,
  };
}

// 스프라이트를 스테이지에 필요한 것만 먼저 불러온다.
// 열두 보스를 처음에 전부 받으면 첫 화면이 늦게 뜨기 때문에, 나머지는 플레이하는 동안 뒤에서 받는다.
const SPRITE_LOADING = {};
function loadSprite(k) {
  if (SPRITE_LOADING[k]) return SPRITE_LOADING[k];
  if (!SPRITE_URLS[k] || !EMETA[k]) return Promise.resolve();
  SPRITE_LOADING[k] = new Promise((res) => {
    const im = new Image();
    im.onload = () => {
      $.ESPR[k] = buildOutlined(
        im,
        EMETA[k].map((a) => a.slice(0, 5)),
        k === 'logatk' ? 'rgba(246,214,170,.8)' : 'rgba(240,160,140,.55)',
      );
      res();
    };
    im.onerror = () => res();
    im.src = SPRITE_URLS[k];
  });
  return SPRITE_LOADING[k];
}
export function ensureSprites(keys, onProgress) {
  let done = 0;
  return Promise.all(
    keys.map((k) =>
      loadSprite(k).then(() => {
        done++;
        if (onProgress) onProgress(done, keys.length);
      }),
    ),
  );
}
/** 한 스테이지를 그리는 데 필요한 스프라이트 목록 */
export function spritesForStage(i) {
  const D = STAGES[i];
  const ks = new Set(['items', 'logatk', D.k]);
  (D.pool || ['changgwi', 'choraeng', 'yangban', 'eodug', 'dueok', 'imae', 'jangsan', 'bulga']).forEach((k) =>
    ks.add(k),
  );
  if (D.k === 'rat') ks.add('minirat');
  if (D.k === 'rooster') ['choraeng', 'yangban'].forEach((k) => ks.add(k));
  if (D.k === 'tiger') ks.add('changgwi');
  if (D.k === 'dragon') ks.add('pair');
  if (D.k === 'rabbit') ks.add('dragon');
  return [...ks];
}
/** 남은 스프라이트를 하나씩 천천히 받아 둔다(게임 흐름을 방해하지 않게) */
export function preloadRest() {
  const rest = Object.keys(EMETA).filter((k) => SPRITE_URLS[k] && !SPRITE_LOADING[k]);
  const next = () => {
    const k = rest.shift();
    if (k) loadSprite(k).then(() => setTimeout(next, 120));
  };
  setTimeout(next, 500);
}

export function drawEnemySprite(e, x, y) {
  const S = $.ESPR[e.k];
  if (!S) return;
  const seq = FA[e.k][e.anim] || FA[e.k].move || FA[e.k].idle;
  const fi =
    e.anim === 'dead'
      ? seq[0]
      : seq[Math.floor(e.at * (FPS[e.anim] || 6) * (e.k === 'choraeng' ? 1.4 : 1)) % seq.length];
  const f = S.fr[fi];
  const sc = ((e.k === 'eodug' ? e.dsc : ET[e.k].sc) / DS) * ((FSC[e.k] && FSC[e.k][fi]) || 1);
  ctx.save();
  ctx.translate(Math.round(x + (e.shake || 0)), Math.round(y - (e.hop || 0)));
  ctx.scale(e.face >= 0 ? 1 : -1, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'low';
  ctx.drawImage(S.img, f.x, 0, f.w, f.h, -f.ax * sc, -f.ay * sc, f.w * sc, f.h * sc);
  ctx.restore();
}

export function drawEnemies() {
  for (const e of $.enemies) {
    if (!e.alive && e.dying <= 0) continue;
    const x = e.x - $.cam,
      y = e.y;
    if (x < -160 || x > W + 160) continue;
    if (!e.alive) {
      if ($.ESPR[e.k]) {
        ctx.globalAlpha = Math.min(1, e.dying * 2);
        drawEnemySprite(e, x, y);
        ctx.globalAlpha = 1;
      }
      continue;
    }
    if (e.hidden) continue;
    if (e.flash > 0 && Math.floor($.t * 40) % 2) continue;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = PAL.ink;
    if ($.ESPR[e.k]) {
      if (e.enraged && e.alive)
        glow(x, y - e.h * 0.55, e.h * 0.9, '79,209,193', 0.18 + 0.08 * Math.sin($.t * 8));
      if (e.k === 'changgwi' && e.anim === 'call') {
        const g = ctx.createRadialGradient(x, y - 60, 2, x, y - 60, 70);
        g.addColorStop(0, 'rgba(243,196,107,.35)');
        g.addColorStop(1, 'rgba(243,196,107,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y - 60, 70, 0, 7);
        ctx.fill();
      }
      if ($.alarmT > 0 && e.k !== 'changgwi' && Math.abs($.p.x - e.x) < 600) {
        ctx.fillStyle = '#e0703f';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', x, y - e.h - 14);
        ctx.textAlign = 'left';
      }
      drawEnemySprite(e, x, y);
    } else if (e.k === 'wisp') {
      const fl = Math.sin(e.t * 14) * 2;
      const g = ctx.createRadialGradient(x, y - 16, 2, x, y - 16, 34);
      g.addColorStop(0, 'rgba(110,230,215,.45)');
      g.addColorStop(1, 'rgba(110,230,215,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y - 16, 34, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#3fb3a8';
      ctx.beginPath();
      ctx.moveTo(x, y - 40 - fl);
      ctx.quadraticCurveTo(x + 17, y - 18, x + 11, y - 6);
      ctx.quadraticCurveTo(x, y + 2, x - 11, y - 6);
      ctx.quadraticCurveTo(x - 17, y - 18, x, y - 40 - fl);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#bff5ec';
      ctx.beginPath();
      ctx.ellipse(x, y - 12, 6, 8, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(x - 5, y - 16, 3, 4);
      ctx.fillRect(x + 2, y - 16, 3, 4);
    } else if (e.k === 'ghost') {
      const vis = Math.max(0.14, e.lit),
        shake = e.stun > 0 ? Math.sin(e.t * 60) * 1.5 : 0;
      ctx.globalAlpha = vis;
      const bx = x + shake,
        by = y;
      ctx.fillStyle = e.stun > 0 ? '#7d6aa3' : '#4a3d5c';
      ctx.strokeStyle = e.stun > 0 ? '#e6dcff' : '#8f80b0';
      ctx.beginPath();
      ctx.moveTo(bx - 20, by);
      ctx.lineTo(bx - 20, by - 26);
      ctx.quadraticCurveTo(bx - 20, by - 44, bx, by - 44);
      ctx.quadraticCurveTo(bx + 20, by - 44, bx + 20, by - 26);
      ctx.lineTo(bx + 20, by);
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(bx + 20 - i * 10 - 5, by - (i % 2 ? 0 : 6) - 5);
        ctx.lineTo(bx + 20 - (i + 1) * 10, by);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PAL.gold;
      ctx.beginPath();
      ctx.moveTo(bx - 12, by - 40);
      ctx.lineTo(bx - 8, by - 52);
      ctx.lineTo(bx - 4, by - 42);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx + 4, by - 42);
      ctx.lineTo(bx + 8, by - 52);
      ctx.lineTo(bx + 12, by - 40);
      ctx.fill();
      ctx.fillStyle = '#f3e4c2';
      if (e.stun > 0) {
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('@ @', bx, by - 22);
        ctx.textAlign = 'left';
      } else {
        ctx.fillRect(bx - 10, by - 30, 6, 6);
        ctx.fillRect(bx + 4, by - 30, 6, 6);
        ctx.fillStyle = PAL.verm;
        ctx.fillRect(bx - 8, by - 28, 2, 2);
        ctx.fillRect(bx + 6, by - 28, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    if ($.debug) {
      const b = eBox(e);
      ctx.strokeStyle = '#e0302a';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x - $.cam + 0.5, b.y + 0.5, b.w, b.h);
      ctx.fillStyle = '#fff';
      ctx.font = '11px monospace';
      ctx.fillText(`${e.k} ${e.anim} hp${e.hp}`, b.x - $.cam, b.y - 4);
    }
  }
}

export function drawFx() {
  for (const q of $.fx) {
    ctx.globalAlpha = Math.min(1, q.life * 2);
    ctx.fillStyle = q.col;
    ctx.fillRect(q.x - $.cam - q.r / 2, q.y - q.r / 2, q.r, q.r);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.font = '18px "Gowun Dodum", sans-serif';
  for (const q of $.pops) {
    ctx.globalAlpha = Math.min(1, q.life * 1.5);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(36,30,25,.9)';
    ctx.strokeText(q.text, q.x - $.cam, q.y);
    ctx.fillStyle = '#f6e6c2';
    ctx.fillText(q.text, q.x - $.cam, q.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}
// ---- render ----

export function buildPlayerSprite(atlas) {
  const pad = 4,
    tw = FR.reduce((s, f) => s + f.w + pad * 2 + 2, 0),
    th = Math.max(...FR.map((f) => f.h)) + pad * 2;
  const base = document.createElement('canvas');
  base.width = tw;
  base.height = th;
  const bg = base.getContext('2d');
  let nx = 0;
  for (const f of FR) {
    bg.drawImage(atlas, f.x, 0, f.w, f.h, nx + pad, pad, f.w, f.h);
    f.x = nx;
    f.w += pad * 2;
    f.h += pad * 2;
    f.ax += pad;
    f.ay += pad;
    if (f.lamp) {
      f.lamp[0] += pad;
      f.lamp[1] += pad;
    }
    nx += f.w + 2;
  }
  const sil = document.createElement('canvas');
  sil.width = tw;
  sil.height = th;
  const sg = sil.getContext('2d');
  sg.drawImage(base, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = 'rgba(246,214,170,.8)';
  sg.fillRect(0, 0, tw, th);
  $.SPR = document.createElement('canvas');
  $.SPR.width = tw;
  $.SPR.height = th;
  const og = $.SPR.getContext('2d');
  for (const [dx, dy] of [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ])
    og.drawImage(sil, dx, dy);
  og.drawImage(base, 0, 0);
}
