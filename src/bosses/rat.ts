// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { arenaClear } from './common';
import { burst, pop } from '../combat/damage';
import { grantWeapon } from '../combat/projectiles';
import { music } from '../core/audio';
import { $ } from '../core/state';
import { RAT_HP } from '../data/enemies';
import { REWARD } from '../data/weapons';
import { mkEnemy, onSolidBelow, setAnim } from '../entities/enemies';
import { box, hurt, overlap } from '../entities/player';
import { afterEnding, startCut } from '../story/cutscene';
import { ENDING_CUT } from '../story/ending';

export function ratUpdate(e, dt, dx, adx) {
  if (!$.ARENA.active || $.ARENA.k !== 'rat' || $.ARENA.title > 0.4) {
    setAnim(e, 'idle');
    e.face = -1;
    return;
  }
  const enr = e.hp < RAT_HP * 0.4,
    sp = enr ? 210 : 150;
  e.iframe -= dt;
  e.stT -= dt;
  e.dashCd -= dt;
  e.splitCd -= dt;
  e.cd -= dt;
  const go = (st, a, time) => {
    e.st = st;
    if (a) setAnim(e, a);
    e.stT = time || 0;
  };
  switch (e.st) {
    case 'walk':
    case 'idle':
      go('chase', 'move');
      break;
    case 'chase':
      e.face = Math.sign(dx) || e.face;
      if (e.hp < RAT_HP * 0.85 && e.splitCd <= 0) {
        go('split', 'split', 0.66);
        e.noContact = true;
        break;
      }
      if (adx < 125 && e.cd <= 0) {
        go('wind', 'wind', enr ? 0.18 : 0.3);
        break;
      }
      if (adx > 300 && e.dashCd <= 0) {
        go('dwind', 'dwind', 0.4);
        break;
      }
      e.x += Math.sign(dx) * sp * dt;
      setAnim(e, 'move');
      break;
    case 'wind':
      if (e.stT <= 0) {
        go('slash', 'slash', 0.16);
        burst(e.x + e.face * 60, e.y - 50, '#8ff0de', 6);
      }
      break;
    case 'slash': {
      const hb = {
        x: e.face > 0 ? e.x : e.x - 105,
        y: e.y - 90,
        w: 105,
        h: 90,
      };
      if (overlap(box(), hb) && $.p.inv <= 0 && $.p.hurtT <= 0) hurt(e.face);
      if (e.stT <= 0) {
        go('rec', 'rec', 0.32);
        e.cd = enr ? 0.6 : 1;
      }
      break;
    }
    case 'rec':
      if (e.stT <= 0) go('chase', 'move');
      break;
    case 'dwind':
      e.face = Math.sign(dx) || e.face;
      if (e.stT <= 0) {
        go('dash', 'dash', 0.62);
        e.vx = e.face * 560;
      }
      break;
    case 'dash':
      e.x += e.vx * dt;
      if (Math.random() < 0.5)
        $.fx.push({
          x: e.x - e.face * 30,
          y: e.y - 20 - Math.random() * 40,
          vx: -e.face * 60,
          vy: -20,
          life: 0.3,
          col: '#2a1f33',
          r: 5,
        });
      if (e.x < $.ARENA.x0 + 50 || e.x > $.ARENA.x1 - 50 || e.stT <= 0) {
        e.x = Math.max($.ARENA.x0 + 50, Math.min($.ARENA.x1 - 50, e.x));
        go('rec', 'rec', 0.4);
        e.dashCd = enr ? 2.2 : 3.4;
      }
      break;
    case 'split':
      if (e.stT <= 0) {
        e.hidden = true;
        e.st = 'hidden';
        e.stT = 6.5;
        for (let i = 0; i < 3; i++)
          $.enemies.push(
            Object.assign(mkEnemy('minirat', e.x + (i - 1) * 20, e.y), {
              vx: (i - 1) * 160,
              vy: -300 - i * 60,
              ground: false,
              rat: e,
            }),
          );
        pop(e.x, e.y - 110, '쥐 떼로 흩어졌다');
      }
      break;
    case 'hidden': {
      const rats = $.enemies.filter((r) => r.k === 'minirat' && r.rat === e && r.alive);
      if (rats.length === 0) {
        e.hidden = false;
        e.x = Math.max($.ARENA.x0 + 60, Math.min($.ARENA.x1 - 60, e.lastRatX ?? e.x));
        go('stun', 'hurt', 2.4);
        e.vuln = true;
        e.noContact = true;
        pop(e.x, e.y - 120, '틈이 생겼다! 두 배 피해');
        burst(e.x, e.y - 40, '#8ff0de', 20);
      } else {
        e.lastRatX = rats[0].x;
        if (e.stT <= 0) {
          e.hidden = false;
          e.x = rats[0].x;
          rats.forEach((r) => {
            r.alive = false;
            r.dying = 0;
            burst(r.x, r.y - 10, '#2a1f33', 6);
          });
          go('merge', 'merge', 0.66);
        }
      }
      break;
    }
    case 'merge':
      if (e.stT <= 0) {
        go('chase', 'move');
        e.noContact = false;
        e.splitCd = enr ? 6 : 9;
      }
      break;
    case 'stun':
      if (e.stT <= 0) {
        e.vuln = false;
        e.noContact = false;
        go('chase', 'move');
        e.splitCd = enr ? 6 : 9;
      }
      break;
  }
  e.x = Math.max($.ARENA.x0 + 40, Math.min($.ARENA.x1 - 40, e.x));
}

export function miniratUpdate(e, dt, dx) {
  e.face = Math.sign(dx) || e.face;
  if (e.ground) {
    e.vx += (Math.sign(dx) * 210 - e.vx) * Math.min(1, dt * 4);
    if ($.p.y < e.y - 40 && Math.random() < dt * 1.2) {
      e.vy = -620;
      e.ground = false;
    }
  }
  e.x += e.vx * dt;
  e.x = Math.max($.ARENA.x0 + 20, Math.min($.ARENA.x1 - 20, e.x));
  onSolidBelow(e);
  e.hop = e.ground ? Math.abs(Math.sin(e.t * 16)) * 3 : 0;
  setAnim(e, 'move');
}

export function ratDie(e) {
  e.alive = false;
  e.dying = 4;
  e.anim = 'dead';
  e.at = 0;
  e.hidden = false;
  $.enemies.forEach((r) => {
    if ((r.k === 'minirat' || r.summoned) && r.alive) {
      r.alive = false;
      r.dying = 0.4;
    }
  });
  $.swaves = [];
  for (let i = 0; i < 4; i++)
    setTimeout(
      () =>
        burst(
          e.x + (Math.random() - 0.5) * 80,
          e.y - 40 - Math.random() * 40,
          i % 2 ? '#8ff0de' : '#2a1f33',
          16,
        ),
      i * 160,
    );
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2;
    $.orbs.push({
      x: e.x,
      y: e.y - 50,
      vx: Math.cos(a) * 300,
      vy: Math.sin(a) * 300,
      t: -i * 0.06,
      free: !$.sword.has,
    });
  }
  pop(e.x, e.y - 130, '오류가 걷혔다');
  $.eproj = [];
  $.strikes = [];
  if (REWARD[e.k]) setTimeout(() => grantWeapon(REWARD[e.k]), 900);
  if (e.k === 'monkey') $.p.noLamp = false;
  if (e.k === 'dragon') {
    $.ARENA.done = true;
    $.ARENA.active = false;
    setTimeout(() => {
      music('cut');
      startCut(ENDING_CUT, afterEnding);
    }, 2600);
  } else arenaClear($.ARENA, $.ARENA.t.slice(0, 2) + '의 문이 열렸다');
}
// ---- 보스 공통 ----
