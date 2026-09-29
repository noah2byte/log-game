// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { burst, pop } from '../combat/damage';
import { MAXHP, PAL, W } from '../config';
import { $ } from '../core/state';
import { ctx } from '../render/canvas';
import { glow } from '../render/draw';

export function respawnCk() {
  $.hp = MAXHP;
  $.overT = 0;
  $.p = {
    x: $.ckX,
    y: $.ckY || 460,
    vx: 0,
    vy: 0,
    face: 1,
    ground: true,
    coyote: 0,
    anim: 'idle',
    at: 0,
    hurtT: 0,
    inv: 2,
    lampR: 80,
  };
  $.lastSafe = {
    x: $.ckX,
    y: $.ckY || 460,
  };
}

export function updateCks() {
  for (const c of $.CKS) {
    if (!c.on && $.p.x > c.x && $.p.ground) {
      c.on = true;
      $.ckX = c.x;
      $.ckY = c.y;
      $.hp = MAXHP;
      pop(c.x, c.y - 80, '장승이 길을 기억했다 · 체력 회복');
      burst(c.x, c.y - 60, '#5fc9b9', 16);
    }
  }
}

export function drawCks() {
  for (const c of $.CKS) {
    const x = c.x - $.cam;
    if (x < -40 || x > W + 40) continue;
    ctx.fillStyle = '#2a1f33';
    const by = c.y - 60;
    ctx.fillRect(x - 8, by, 16, 60);
    ctx.fillRect(x - 10, by - 6, 20, 8);
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 8, by, 16, 60);
    ctx.fillStyle = c.on ? '#5fc9b9' : '#4a3d55';
    ctx.fillRect(x - 5, by + 10, 4, 4);
    ctx.fillRect(x + 2, by + 10, 4, 4);
    ctx.fillStyle = PAL.verm;
    ctx.fillRect(x - 4, by + 22, 8, 2);
    if (c.on) glow(x, by + 12, 30, '95,201,185', 0.35);
  }
}
