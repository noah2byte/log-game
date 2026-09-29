// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { bossGo } from './common';
import { burst, pop } from '../combat/damage';
import { G } from '../config';
import { $ } from '../core/state';
import { mkEnemy, setAnim } from '../entities/enemies';
import { box, hurt, overlap } from '../entities/player';

export // ---- 인(寅) 호랑이 장군 ----
function tigerUpdate(e, dt, dx, adx) {
  if (!$.ARENA.active || $.ARENA.k !== 'tiger' || $.ARENA.title > 0.4) {
    setAnim(e, 'idle');
    e.face = -1;
    return;
  }
  const enr = e.hp < e.maxhp * 0.4;
  e.stT -= dt;
  e.cd -= dt;
  e.dashCd -= dt;
  e.splitCd -= dt;
  e.iframe -= dt;
  switch (e.st) {
    case 'walk':
    case 'chase':
      e.st = 'chase';
      e.face = Math.sign(dx) || e.face;
      if (e.hp < e.maxhp * 0.6 && e.splitCd <= 0) {
        bossGo(e, 'roar', 'roar', 1);
        e.splitCd = 12;
        for (const sx of [$.ARENA.x0 + 60, $.ARENA.x1 - 60])
          $.enemies.push(
            Object.assign(mkEnemy('changgwi', sx, 460, $.ARENA.x0 + 40, $.ARENA.x1 - 40), {
              summoned: true,
              cd: 1.5,
            }),
          );
        pop(e.x, e.y - 150, '호랑이가 창귀를 부른다');
        break;
      }
      if (adx < 140 && e.cd <= 0) {
        bossGo(e, 'raise', 'raise', enr ? 0.2 : 0.32);
        break;
      }
      if (adx > 200 && e.dashCd <= 0) {
        bossGo(e, 'crouch', 'crouch', enr ? 0.3 : 0.45);
        break;
      }
      e.x += Math.sign(dx) * (enr ? 170 : 130) * dt;
      setAnim(e, 'move');
      break;
    case 'roar':
      if (e.stT <= 0) e.st = 'chase';
      break;
    case 'raise':
      if (e.stT <= 0) bossGo(e, 'slash', 'slash', 0.16);
      break;
    case 'slash': {
      const hb = {
        x: e.face > 0 ? e.x : e.x - 125,
        y: e.y - 95,
        w: 125,
        h: 95,
      };
      if (overlap(box(), hb) && $.p.inv <= 0 && $.p.hurtT <= 0) hurt(e.face);
      if (e.stT <= 0) {
        bossGo(e, 'follow', 'follow', 0.3);
        e.cd = enr ? 0.7 : 1.1;
      }
      break;
    }
    case 'follow':
      if (e.stT <= 0) e.st = 'chase';
      break;
    case 'crouch':
      e.face = Math.sign(dx) || e.face;
      if (e.stT <= 0) {
        bossGo(e, 'leap', 'leap', 9);
        e.vx = Math.max(-620, Math.min(620, dx / 0.72));
        e.vy = -640;
      }
      break;
    case 'leap':
      e.x += e.vx * dt;
      e.vy += G * dt;
      e.y += e.vy * dt;
      if (e.y >= 460 && e.vy > 0) {
        e.y = 460;
        e.vy = 0;
        bossGo(e, 'stance', 'stance', 0.4);
        e.dashCd = enr ? 2 : 3.2;
        burst(e.x, e.y - 4, '#8b7a60', 10);
      }
      break;
    case 'stance':
      if (e.stT <= 0) e.st = 'chase';
      break;
  }
  e.x = Math.max($.ARENA.x0 + 50, Math.min($.ARENA.x1 - 50, e.x));
}
// ---- 묘(卯) 달토끼: 칼이 통하지 않는다. 랜턴으로 오염을 걷어낸다 ----
