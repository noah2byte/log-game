// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { burst, damage, eBox, pop } from './damage';
import { H } from '../config';
import { sfx } from '../core/audio';
import { $ } from '../core/state';
import { WEAP } from '../data/weapons';
import { hurt, overlap } from '../entities/player';
import { ctx } from '../render/canvas';
import { drawItem, glow } from '../render/draw';

export function updateEproj(dt) {
  for (const q of $.eproj) {
    q.t = (q.t || 0) - dt;
    if (q.t > 0) continue;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.life -= dt;
    if (q.kind === 'cloud') {
      q.y += Math.sin(q.life * 4) * 0.6;
      q.vx *= Math.pow(0.6, dt);
    }
    const r = q.kind === 'cloud' ? 26 : q.kind === 'wave' ? 18 : 10;
    if (
      $.p.inv <= 0 &&
      $.p.hurtT <= 0 &&
      Math.abs($.p.x - q.x) < r + 14 &&
      Math.abs($.p.y - 40 - q.y) < r + 34
    ) {
      if (q.kind === 'cloud') {
        $.p.slowT = 2.6;
        q.life = 0;
        pop($.p.x, $.p.y - 110, '양털 구름에 휘감겼다');
      } else {
        hurt(Math.sign(q.vx) || 1);
        q.life = 0;
      }
    }
  }
  $.eproj = $.eproj.filter(
    (q) => q.life > 0 && q.x > $.ARENA.x0 - 40 && q.x < $.ARENA.x1 + 40 && q.y > -60 && q.y < H + 60,
  );
  for (const s of $.strikes) {
    s.t -= dt;
    if (s.t <= 0 && !s.done) {
      s.done = true;
      $.shake = 0.15;
      burst(s.x, 440, '#bff5ec', 12);
      if (Math.abs($.p.x - s.x) < 34 && $.p.inv <= 0) hurt(Math.sign($.p.x - s.x) || 1);
    }
  }
  $.strikes = $.strikes.filter((s) => s.t > -0.35);
}

export function drawEproj() {
  for (const q of $.eproj) {
    if ((q.t || 0) > 0) continue;
    const x = q.x - $.cam;
    if (q.kind === 'orb') {
      glow(x, q.y, 22, '79,209,193', 0.45);
      drawItem(3, x, q.y, 20);
    } else if (q.kind === 'cloud') {
      ctx.fillStyle = 'rgba(246,240,228,.92)';
      for (const [dx, dy, r] of [
        [-14, 4, 14],
        [0, -6, 17],
        [15, 3, 13],
        [4, 8, 12],
      ]) {
        ctx.beginPath();
        ctx.arc(x + dx, q.y + dy, r, 0, 7);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(79,209,193,.5)';
      ctx.fillRect(x - 12, q.y + 10, 24, 3);
    } else {
      ctx.strokeStyle = 'rgba(243,196,107,.9)';
      ctx.lineWidth = 3;
      const f = Math.sign(q.vx);
      for (const r of [8, 14, 20]) {
        ctx.beginPath();
        ctx.arc(x - f * 10, q.y, r, f > 0 ? -0.9 : Math.PI - 0.9, f > 0 ? 0.9 : Math.PI + 0.9);
        ctx.stroke();
      }
    }
  }
  for (const s of $.strikes) {
    const x = s.x - $.cam;
    if (!s.done) {
      ctx.strokeStyle = `rgba(191,245,236,${0.4 + 0.4 * Math.sin($.t * 20)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, 458, 34, 8, 0, 0, 7);
      ctx.stroke();
    } else {
      const a = Math.max(0, 1 + s.t / 0.35);
      ctx.fillStyle = `rgba(191,245,236,${0.7 * a})`;
      ctx.fillRect(x - 14, 0, 28, 460);
      glow(x, 440, 60, '191,245,236', 0.6 * a);
    }
  }
}

export function grantWeapon(w) {
  if (!$.sword.weps.includes(w)) {
    sfx('pickup');
    $.sword.weps.push(w);
    $.sword.wi = $.sword.weps.length - 1;
    pop($.p.x, $.p.y - 130, `${WEAP[w].n}을 얻었다 · C로 무기 전환`);
    burst($.p.x, $.p.y - 50, '#f6dfa0', 20);
  }
}

export function updateArrows(dt) {
  for (const a of $.parrows) {
    a.x += a.vx * dt;
    a.life -= dt;
    for (const e of $.enemies) {
      if (!e.alive || a.hit.has(e)) continue;
      if (
        overlap(
          {
            x: a.x - 10,
            y: a.y - 6,
            w: 20,
            h: 12,
          },
          eBox(e),
        )
      ) {
        a.hit.add(e);
        if (damage(e, a.dmg, Math.sign(a.vx))) a.life = 0;
      }
    }
  }
  $.parrows = $.parrows.filter((a) => a.life > 0);
}

export function drawArrows() {
  for (const a of $.parrows) {
    const x = a.x - $.cam,
      f = Math.sign(a.vx);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(111,230,210,.5)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x - f * 30, a.y);
    ctx.lineTo(x, a.y);
    ctx.stroke();
    ctx.strokeStyle = '#e8fffb';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineCap = 'butt';
    glow(x, a.y, 12, '191,245,236', 0.6);
  }
}
