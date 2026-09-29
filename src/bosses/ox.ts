// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { bossGo, shockwave } from './common';
import { burst, pop } from '../combat/damage';
import { $ } from '../core/state';
import { setAnim } from '../entities/enemies';
import { box, hurt, overlap } from '../entities/player';

export // ---- 축(丑) 철갑 소 ----
function oxUpdate(e, dt, dx, adx) {
  if (!$.ARENA.active || $.ARENA.k !== 'ox' || $.ARENA.title > 0.4) {
    setAnim(e, 'idle');
    e.face = -1;
    return;
  }
  const enr = e.hp < e.maxhp * 0.4;
  e.stT -= dt;
  e.cd -= dt;
  e.dashCd -= dt;
  e.iframe -= dt;
  switch (e.st) {
    case 'walk':
    case 'chase':
      e.st = 'chase';
      e.face = Math.sign(dx) || e.face;
      if (adx < 150 && e.cd <= 0) {
        bossGo(e, 'lift', 'lift', enr ? 0.4 : 0.6);
        break;
      }
      if (adx > 240 && e.dashCd <= 0) {
        bossGo(e, 'cwind', 'cwind', 0.7);
        break;
      }
      e.x += Math.sign(dx) * (enr ? 95 : 70) * dt;
      setAnim(e, 'move');
      break;
    case 'lift':
      if (e.stT <= 0) bossGo(e, 'swing', 'swing', 0.12);
      break;
    case 'swing':
      if (e.stT <= 0) {
        bossGo(e, 'slam', 'slam', 0.5);
        const hx = e.x + e.face * 70;
        burst(hx, e.y - 6, '#8b7a60', 14);
        shockwave(hx, e.y, 1, enr ? 420 : 360, 2.4);
        shockwave(hx, e.y, -1, enr ? 420 : 360, 2.4);
        const hb = {
          x: e.face > 0 ? e.x : e.x - 110,
          y: e.y - 70,
          w: 110,
          h: 70,
        };
        if (overlap(box(), hb) && $.p.inv <= 0) hurt(e.face);
      }
      break;
    case 'slam':
      if (e.stT <= 0) {
        e.st = 'chase';
        e.cd = enr ? 1 : 1.5;
      }
      break;
    case 'cwind':
      e.face = Math.sign(dx) || e.face;
      e.shake = Math.sin(e.t * 60) * 2;
      if (e.stT <= 0) {
        bossGo(e, 'charge', 'charge', 9);
        e.vx = e.face * (enr ? 580 : 480);
        e.shake = 0;
      }
      break;
    case 'charge':
      e.x += e.vx * dt;
      if (Math.random() < 0.6)
        $.fx.push({
          x: e.x - e.face * 50,
          y: e.y - 6,
          vx: -e.face * 80,
          vy: -60,
          life: 0.35,
          col: '#8b7a60',
          r: 5,
        });
      if (e.x <= $.ARENA.x0 + 70 || e.x >= $.ARENA.x1 - 70) {
        e.x = Math.max($.ARENA.x0 + 70, Math.min($.ARENA.x1 - 70, e.x));
        bossGo(e, 'dizzy', 'dizzy', 2.6);
        e.vuln = true;
        e.noContact = true;
        $.shake = 0.35;
        burst(e.x + e.face * 50, e.y - 60, '#9aa3ad', 22);
        pop(e.x, e.y - 150, '벽에 부딪혀 멈췄다! 두 배 피해');
      }
      break;
    case 'dizzy':
      if (e.stT <= 0) {
        e.vuln = false;
        e.noContact = false;
        e.st = 'chase';
        e.dashCd = enr ? 3 : 4.5;
      }
      break;
  }
  e.x = Math.max($.ARENA.x0 + 50, Math.min($.ARENA.x1 - 50, e.x));
}
// ---- 인(寅) 호랑이 장군 ----
