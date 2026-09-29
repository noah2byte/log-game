// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { pop } from '../combat/damage';
import { MAXHP } from '../config';
import { music, sfx } from '../core/audio';
import { saveGame } from '../core/save';
import { $ } from '../core/state';
import { mkEnemy, setAnim } from '../entities/enemies';
import { hurt } from '../entities/player';
import { ctx } from '../render/canvas';

export function arenaClear(a, msg) {
  saveGame(Math.min(11, $.STAGE + 1));
  setTimeout(() => {
    a.done = true;
    a.active = false;
    pop(a.x1 - 90, 300, msg);
    sfx('gate');
    music('stage');
  }, 1400);
}

export function respawnAt() {
  const a = $.ARENA;
  $.hp = MAXHP;
  $.overT = 0;
  $.eproj = [];
  $.strikes = [];
  $.parrows = [];
  a.active = false;
  a.title = 0;
  $.swaves = [];
  $.p = {
    x: a.x0 - 40,
    y: 460,
    vx: 0,
    vy: 0,
    face: 1,
    ground: true,
    coyote: 0,
    anim: 'idle',
    at: 0,
    hurtT: 0,
    inv: 1,
    lampR: 80,
  };
  $.lastSafe = {
    x: $.p.x,
    y: 460,
  };
  $.enemies = $.enemies.filter((e) => !(e.summoned || e.k === 'minirat' || e.k === a.k));
  $.enemies.push(mkEnemy(a.k, a.x0 + 700, 460));
}

export function shockwave(x, y, dir, sp, life) {
  $.swaves.push({
    x,
    y,
    dir,
    sp,
    life,
  });
  if (dir > 0) sfx('shock');
}

export function updateShock(dt) {
  for (const w of $.swaves) {
    w.x += w.dir * w.sp * dt;
    w.life -= dt;
    if (Math.random() < 0.5)
      $.fx.push({
        x: w.x,
        y: w.y - 4,
        vx: 0,
        vy: -120,
        life: 0.3,
        col: '#8b7a60',
        r: 4,
      });
    if ($.p.inv <= 0 && $.p.hurtT <= 0 && Math.abs($.p.x - w.x) < 20 && $.p.y > w.y - 26) hurt(w.dir);
  }
  $.swaves = $.swaves.filter((w) => w.life > 0 && w.x > $.ARENA.x0 && w.x < $.ARENA.x1);
}

export function drawShock() {
  for (const w of $.swaves) {
    const x = w.x - $.cam;
    ctx.fillStyle = 'rgba(232,178,74,.8)';
    ctx.beginPath();
    ctx.moveTo(x - 12, w.y);
    ctx.lineTo(x, w.y - 26);
    ctx.lineTo(x + 12, w.y);
    ctx.fill();
    ctx.fillStyle = 'rgba(246,223,160,.9)';
    ctx.fillRect(x - 2, w.y - 18, 4, 18);
  }
}

export function bossGo(e, st, a, time) {
  e.st = st;
  if (a) setAnim(e, a);
  e.stT = time || 0;
}
// ---- 축(丑) 철갑 소 ----
