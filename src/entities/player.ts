// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { respawnAt, updateShock } from '../bosses/common';
import { pop } from '../combat/damage';
import { updateArrows, updateEproj } from '../combat/projectiles';
import { updateSword } from '../combat/sword';
import { ACC, AIR, ANIM, AS, DEC, G, H, HB, JV, RUN, S, SW, W } from '../config';
import { EMETA, FR } from '../core/assets';
import { music, sfx } from '../core/audio';
import { keys } from '../core/input';
import { $ } from '../core/state';
import { updateEnemies } from './enemies';
import { updateFx } from '../render/sprites';
import { respawnCk, updateCks } from '../world/checkpoints';
import { restartStage, stageComplete } from '../world/stages';

export function reset() {
  restartStage();
}

export function hurt(dir, dmg = true) {
  if ($.p.inv > 0 || $.overT > 0) return;
  if (dmg) {
    $.hp--;
    sfx('hurt');
    if ($.hp <= 0) {
      $.overT = 1.8;
    }
  }
  $.p.hurtT = 0.4;
  $.p.inv = 1.7;
  $.p.vx = -dir * 240;
  $.p.vy = -420;
  $.p.ground = false;
}

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function box() {
  return {
    x: $.p.x - HB.w / 2,
    y: $.p.y - HB.h,
    w: HB.w,
    h: HB.h,
  };
}

export function step(dt) {
  $.t += dt;
  if ($.overT > 0) {
    $.overT -= dt;
    if ($.overT <= 0) {
      if ($.CKPT >= 0) respawnAt();
      else if ($.ckX > 0) respawnCk();
      else restartStage();
    }
    updateFx(dt);
    return;
  }
  if ($.freeze > 0) {
    $.freeze -= dt;
    return;
  }
  // 움직이는 발판: 위치를 갱신하고, 올라탄 로그를 함께 옮긴다
  for (const s of $.solids)
    if (s.move) {
      s.px = s.x;
      s.x = s.bx + Math.sin($.t * s.move.sp + s.move.ph) * s.move.ax;
    }
  if ($.p.ground && $.p.gs && $.p.gs.move) $.p.x += $.p.gs.x - $.p.gs.px;
  const prevY = $.p.y;
  const ctl = $.p.hurtT <= 0 && !$.done;
  let dir = ctl ? keys.right - keys.left : 0;
  if (dir) $.p.face = dir;
  const a = $.p.ground ? ACC : AIR;
  if (dir) $.p.vx += dir * a * dt;
  else if ($.p.hurtT <= 0) {
    const d = ($.p.ground ? DEC : AIR * 0.5) * dt;
    $.p.vx = Math.abs($.p.vx) <= d ? 0 : $.p.vx - Math.sign($.p.vx) * d;
  }
  $.p.slowT = ($.p.slowT || 0) - dt;
  const slw = $.p.slowT > 0 ? 0.5 : 1;
  $.p.vx = Math.max(-RUN * slw, Math.min(RUN * slw, $.p.vx));
  // jump: buffer + coyote
  if (ctl && $.jumpPressedAt >= 0 && $.t - $.jumpPressedAt < 0.12 && ($.p.ground || $.p.coyote > 0)) {
    $.p.vy = -JV;
    $.p.ground = false;
    $.p.coyote = 0;
    $.jumpPressedAt = -1;
    sfx('jump');
  }
  if (!keys.jump && $.p.vy < -260) $.p.vy = -260; // variable height
  $.p.vy += G * dt;
  if ($.p.vy > 1100) $.p.vy = 1100;
  // move x
  $.p.x += $.p.vx * dt;
  for (const s of $.solids) {
    if (s.gone) continue;
    const b = box();
    if (overlap(b, s)) {
      $.p.x = $.p.vx > 0 ? s.x - HB.w / 2 : s.x + s.w + HB.w / 2;
      $.p.vx = 0;
    }
  }
  $.p.x = Math.max(HB.w / 2, Math.min($.WORLD - HB.w / 2, $.p.x));
  // move y
  const was = $.p.ground;
  $.p.ground = false;
  $.p.gs = null;
  $.p.y += $.p.vy * dt;
  for (const s of $.solids) {
    if (s.gone) continue;
    const b = box();
    if (overlap(b, s)) {
      if ($.p.vy > 0) {
        $.p.y = s.y;
        $.p.vy = 0;
        $.p.ground = true;
        $.p.gs = s;
      } else {
        $.p.y = s.y + s.h + HB.h;
        $.p.vy = 0;
      }
    }
  }
  if ($.p.ground) {
    $.p.coyote = 0.1;
    if ($.p.hurtT <= 0)
      $.lastSafe = {
        x: $.p.x,
        y: $.p.y,
      };
  } else if (was) $.p.coyote = 0.1;
  else $.p.coyote -= dt;
  if ($.p.y > H + 200) {
    $.p.x = $.lastSafe.x - $.p.face * 40;
    $.p.y = $.lastSafe.y - 10;
    $.p.vx = 0;
    $.p.vy = 0;
    $.p.inv = 0;
    hurt($.p.face);
  }
  $.p.hurtT -= dt;
  $.p.inv -= dt;
  // lantern
  if (keys.lamp && !$.p.lampWas && !$.p.noLamp) sfx('lamp');
  $.p.lampWas = keys.lamp;
  const target = $.p.noLamp ? 0 : keys.lamp && ctl ? 230 : 80;
  $.p.lampR += (target - $.p.lampR) * Math.min(1, dt * 6);
  // clues
  const lp = lampPos();
  for (const c of $.clues) {
    if (c.got) continue;
    const d = Math.hypot(c.x - (lp ? lp.x : $.p.x), c.y - (lp ? lp.y : $.p.y - 40));
    c.seen = Math.max(0, Math.min(1, ($.p.lampR - d) / 40));
    if (c.seen > 0.6 && Math.abs(c.x - $.p.x) < 28 && c.y > $.p.y - HB.h - 14 && c.y < $.p.y + 10) {
      c.got = true;
      $.memTotal++;
      sfx('pickup');
      pop(c.x, c.y - 20, '기억 조각');
    }
  }
  updateEnemies(dt, prevY, lp);
  updateSword(dt);
  updateFx(dt);
  if (!$.ARENA.active && !$.ARENA.done && $.p.x > $.ARENA.x0 + 60) {
    $.ARENA.active = true;
    $.ARENA.title = 2.4;
    $.CKPT = 1;
    sfx('boss');
    music('boss');
  }
  updateShock(dt);
  updateEproj(dt);
  updateArrows(dt);
  $.shake -= dt;
  updateCks();
  if ($.ARENA.title > 0) $.ARENA.title -= dt;
  if ($.ARENA.active && !$.ARENA.done) $.p.x = Math.max($.ARENA.x0 + 16, Math.min($.ARENA.x1 - 16, $.p.x));
  if ($.ARENA.done && !$.done && $.p.x > $.ARENA.x1 - 70 && $.p.ground) stageComplete();
  // anim state
  let st =
    $.p.hurtT > 0
      ? 'hurt'
      : !$.p.ground
        ? $.p.vy < 0
          ? 'jump'
          : 'fall'
        : Math.abs($.p.vx) > 20
          ? 'walk'
          : 'idle';
  if (st !== $.p.anim) {
    $.p.anim = st;
    $.p.at = 0;
  } else $.p.at += dt;
  $.cam +=
    (($.ARENA.active ? $.ARENA.x0 : $.p.x - W * 0.4) - $.cam) * Math.min(1, dt * ($.ARENA.active ? 4 : 8));
  $.cam = Math.max(0, Math.min($.WORLD - W, $.cam));
}

export function frameIdx() {
  const seq = ANIM[$.p.anim];
  const fps =
    $.p.anim === 'idle' ? 2.5 : $.p.anim === 'walk' ? Math.max(6, (12 * Math.abs($.p.vx)) / RUN) : 1;
  return seq[Math.floor($.p.at * fps) % seq.length];
}

export function atkFrame() {
  if (!$.sword || !$.sword.has) return null;
  if ($.sword.swing > 0) {
    if ($.sword.mode === 'bow') return 1;
    if (!$.p.ground) return 4;
    const k = 1 - $.sword.swing / ($.sword.mode === 'spear' ? SW * 0.8 : SW);
    if ($.sword.mode === 'spear') return k < 0.35 ? 3 : 1;
    return k < 0.25 ? 0 : k < 0.6 ? 1 : 2;
  }
  if ($.sword.rec > 0) return $.p.ground ? 3 : 4;
  return null;
}

export function bladeGeom() {
  const af = atkFrame();
  if (af === null || !$.ESPR.logatk) return null;
  const F = $.ESPR.logatk.fr[af],
    m = EMETA.logatk[af],
    pad = 3,
    fc = $.sword.face || $.p.face;
  const tx = $.p.x + fc * (m[5] + pad - F.ax) * AS,
    ty = $.p.y + (m[6] + pad - F.ay) * AS,
    hx = $.p.x + fc * (m[7] + pad - F.ax) * AS,
    hy = $.p.y + (m[8] + pad - F.ay) * AS;
  const L = Math.hypot(tx - hx, ty - hy) || 1;
  return {
    tx,
    ty,
    dx: (tx - hx) / L,
    dy: (ty - hy) / L,
  };
}

export function lampPos() {
  if (atkFrame() !== null || $.p.noLamp) return null;
  const f = FR[frameIdx()];
  if (!f.lamp) return null;
  return {
    x: $.p.x + $.p.face * (f.lamp[0] - f.ax) * S,
    y: $.p.y + (f.lamp[1] - f.ay) * S,
  };
}

// ---- enemies ----
