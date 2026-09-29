// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { burst, damage, eBox, pop } from './damage';
import { HB, PAL, SW, W } from '../config';
import { sfx } from '../core/audio';
import { keys } from '../core/input';
import { $ } from '../core/state';
import { ALTAR } from '../data/stages';
import { TIERS, tierOf } from '../data/weapons';
import { bladeGeom, overlap } from '../entities/player';
import { ctx } from '../render/canvas';
import { drawItem, glow } from '../render/draw';

export function updateSword(dt) {
  // 제단의 칼자루
  if (!$.sword.has && Math.abs($.p.x - ALTAR.x) < 30 && $.p.y > ALTAR.y - 90 && $.p.y <= ALTAR.y + 2) {
    $.sword.has = true;
    sfx('pickup');
    pop(ALTAR.x, ALTAR.y - 120, '그녀가 남긴 칼자루');
    setTimeout(() => pop($.p.x, $.p.y - 110, '요괴의 넋이 모이면 칼날이 선다'), 900);
  }
  const pressed = keys.slash && !$.prevSlash;
  $.prevSlash = keys.slash;
  $.sword.cd -= dt;
  const tier = tierOf($.sword.souls),
    T = TIERS[tier];
  if (pressed && $.sword.has && $.sword.cd <= 0 && $.p.hurtT <= 0) {
    const wp = $.sword.weps[$.sword.wi];
    $.sword.mode = wp;
    if (wp === 'bow') {
      if ($.sword.souls < 1) {
        pop($.p.x, $.p.y - 100, '넋이 없어 화살이 서지 않는다');
        $.sword.cd = 0.4;
      } else {
        $.sword.swing = 0.18;
        $.sword.rec = 0;
        $.sword.cd = 0.42;
        $.sword.face = $.p.face;
        $.sword.hit.clear();
        sfx('arrow');
        $.parrows.push({
          x: $.p.x + $.p.face * 50,
          y: $.p.y - 52,
          vx: $.p.face * 820,
          life: 0.9,
          dmg: Math.max(1, T.dmg),
          hit: new Set(),
        });
      }
    } else if (wp === 'spear') {
      sfx('slash');
      $.sword.swing = SW * 0.8;
      $.sword.rec = 0;
      $.sword.cd = 0.38;
      $.sword.hit.clear();
      $.sword.face = $.p.face;
      $.sword.trail = [];
    } else if (tier === 0) {
      pop($.p.x, $.p.y - 100, '칼날이 없다');
      $.sword.cd = 0.4;
    } else {
      sfx('slash');
      $.sword.swing = SW;
      $.sword.rec = 0;
      $.sword.cd = 0.34;
      $.sword.hit.clear();
      $.sword.face = $.p.face;
      $.sword.trail = [];
      if (T.wave)
        $.waves.push({
          x: $.p.x + $.p.face * 30,
          y: $.p.y - 42,
          vx: $.p.face * 560,
          life: 0.6,
          hit: new Set(),
        });
    }
  }
  $.sword.rec = ($.sword.rec || 0) - dt;
  if ($.sword.swing > 0) {
    $.sword.swing -= dt;
    if ($.sword.swing <= 0) $.sword.rec = 0.14;
    const f = $.sword.face,
      sp_ = $.sword.mode === 'spear',
      reach = sp_ ? Math.max(T.len, 24) + 122 : T.len + 62,
      x0 = f > 0 ? $.p.x : $.p.x - reach,
      hb = sp_
        ? {
            x: x0,
            y: $.p.y - 78,
            w: reach,
            h: 40,
          }
        : {
            x: x0,
            y: $.p.y - HB.h - 24,
            w: reach,
            h: HB.h + 28,
          };
    if ($.sword.mode !== 'bow' && $.sword.swing < SW * (sp_ ? 0.55 : 0.75))
      for (const e of $.enemies) {
        if (!e.alive || $.sword.hit.has(e)) continue;
        if (overlap(hb, eBox(e))) {
          $.sword.hit.add(e);
          damage(e, Math.max(1, T.dmg), f);
        }
      }
  }
  for (const w of $.waves) {
    w.x += w.vx * dt;
    w.life -= dt;
    const wb = {
      x: w.x - 16,
      y: w.y - 26,
      w: 32,
      h: 52,
    };
    for (const e of $.enemies) {
      if (!e.alive || w.hit.has(e)) continue;
      if (overlap(wb, eBox(e))) {
        w.hit.add(e);
        damage(e, 2, Math.sign(w.vx));
      }
    }
  }
  $.waves = $.waves.filter((w) => w.life > 0);
  // 넋 구슬: 칼자루가 있으면 로그에게 빨려 들어간다
  for (const o of $.orbs) {
    o.t += dt;
    if (o.free) {
      o.vy -= 40 * dt;
      o.x += o.vx * dt * 0.3;
      o.y += o.vy * dt * 0.3;
      continue;
    }
    const tx = $.p.x,
      ty = $.p.y - 45,
      dx = tx - o.x,
      dy = ty - o.y,
      d = Math.hypot(dx, dy) || 1;
    const pull = o.t < 0.25 ? 0 : 1400;
    o.vx += (dx / d) * pull * dt;
    o.vy += (dy / d) * pull * dt;
    o.vx *= Math.pow(0.2, dt);
    o.vy *= Math.pow(0.2, dt);
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    if (o.t > 0.25 && d < 18) {
      o.done = true;
      sfx('soul');
      const before = tierOf($.sword.souls);
      $.sword.souls++;
      const after = tierOf($.sword.souls);
      if (after > before) {
        pop($.p.x, $.p.y - 115, `넋날이 자랐다 · ${TIERS[after].n}`);
        burst($.p.x, $.p.y - 45, '#bff5ec', 18);
      } else pop($.p.x, $.p.y - 100, '+넋');
    }
  }
  $.orbs = $.orbs.filter((o) => !o.done && !(o.free && o.t > 1.6));
}

export function drawSword() {
  // 제단
  const ax = ALTAR.x - $.cam;
  if (ax > -60 && ax < W + 60) {
    ctx.fillStyle = '#4a3a55';
    ctx.fillRect(ax - 24, ALTAR.y - 26, 48, 26);
    ctx.fillStyle = '#6d5877';
    ctx.fillRect(ax - 28, ALTAR.y - 30, 56, 6);
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(ax - 24, ALTAR.y - 26, 48, 26);
    ctx.fillStyle = PAL.teal;
    ctx.fillRect(ax - 10, ALTAR.y - 16, 20, 2);
    if (!$.sword.has) {
      const by = ALTAR.y - 66 + Math.sin($.t * 2.4) * 5;
      const g = ctx.createRadialGradient(ax, by, 2, ax, by, 36);
      g.addColorStop(0, 'rgba(191,245,236,.5)');
      g.addColorStop(1, 'rgba(191,245,236,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ax, by, 36, 0, 7);
      ctx.fill();
      drawHilt(ax, by, -Math.PI / 2, 1);
    }
  }
  // 넋 구슬
  for (const o of $.orbs) {
    const x = o.x - $.cam,
      a = o.free ? Math.max(0, 1 - o.t / 1.6) : 1;
    ctx.globalAlpha = a * 0.35;
    ctx.fillStyle = '#8ff0de';
    ctx.beginPath();
    ctx.arc(x, o.y, 9, 0, 7);
    ctx.fill();
    ctx.globalAlpha = a;
    drawItem(3, x, o.y, 13);
    ctx.globalAlpha = 1;
  }
  // 검기
  for (const w of $.waves) {
    const x = w.x - $.cam,
      f = Math.sign(w.vx);
    ctx.globalAlpha = Math.min(1, w.life * 3);
    ctx.strokeStyle = 'rgba(143,240,222,.5)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(x - f * 14, w.y, 26, f > 0 ? -1.1 : Math.PI - 1.1 + 2.2 - 2.2, f > 0 ? 1.1 : Math.PI + 1.1);
    ctx.stroke();
    ctx.strokeStyle = '#e8fffb';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // 베기: 절구공이 끝에서 넋날이 뻗어 나간다
  const bg = bladeGeom();
  if (bg) {
    const T0 = TIERS[tierOf($.sword.souls)];
    const T = {
      len: $.sword.mode === 'spear' ? Math.max(T0.len, 24) + 60 : $.sword.mode === 'bow' ? 0 : T0.len,
    };
    if (T.len > 0) {
      const x1 = bg.tx - $.cam,
        y1 = bg.ty,
        x2 = x1 + bg.dx * T.len,
        y2 = y1 + bg.dy * T.len;
      if ($.sword.swing > 0) {
        $.sword.trail = $.sword.trail || [];
        $.sword.trail.push({
          x1: bg.tx,
          y1,
          x2: bg.tx + bg.dx * T.len,
          y2,
          life: 0.12,
        });
      }
      for (const q of $.sword.trail || []) {
        ctx.globalAlpha = Math.max(0, q.life / 0.12) * 0.28;
        ctx.strokeStyle = '#8ff0de';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(q.x1 - $.cam, q.y1);
        ctx.lineTo(q.x2 - $.cam, q.y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(111,230,210,.55)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = '#e8fffb';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.lineCap = 'butt';
      glow(x2, y2, 14, '191,245,236', 0.5);
    }
  }
  if ($.sword.trail) {
    for (const q of $.sword.trail) q.life -= 1 / 60;
    $.sword.trail = $.sword.trail.filter((q) => q.life > 0);
  }
}

export function drawHilt(x, y, dir, sc) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);
  ctx.scale(sc, sc);
  ctx.fillStyle = '#2a1f33';
  ctx.fillRect(0, -3, 18, 6);
  ctx.fillStyle = PAL.gold;
  for (let i = 3; i < 18; i += 5) ctx.fillRect(i, -3, 2, 6);
  ctx.fillStyle = PAL.gold;
  ctx.fillRect(-3, -8, 4, 16);
  ctx.fillStyle = PAL.verm;
  ctx.fillRect(17, -2, 5, 4);
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(0, -3, 18, 6);
  ctx.restore();
}
