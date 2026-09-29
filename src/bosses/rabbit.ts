// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { bossGo, shockwave } from './common';
import { burst, pop } from '../combat/damage';
import { G } from '../config';
import { music } from '../core/audio';
import { $ } from '../core/state';
import { setAnim } from '../entities/enemies';
import { hurt } from '../entities/player';
import { afterRabbitCut, startCut } from '../story/cutscene';
import { RABBIT_CUT } from '../story/rabbitCut';

export // ---- 묘(卯) 달토끼: 칼이 통하지 않는다. 랜턴으로 오염을 걷어낸다 ----
function rabbitUpdate(e, dt, dx, adx, lp) {
  if (e.saved) {
    setAnim(e, 'restored');
    e.face = Math.sign(dx) || e.face;
    return;
  }
  if (!$.ARENA.active || $.ARENA.k !== 'rabbit' || $.ARENA.title > 0.4) {
    setAnim(e, 'idle');
    e.face = -1;
    return;
  }
  if (!e.hinted) {
    e.hinted = true;
    pop($.p.x, $.p.y - 120, '칼은 그녀를 베지 못한다. 랜턴(X)을 비춰라');
  }
  const src = lp || {
    x: $.p.x,
    y: $.p.y - 40,
  };
  const lit = $.p.lampR > 120 && Math.hypot(e.x - src.x, e.y - 55 - src.y) < $.p.lampR;
  e.lit = lit;
  if (lit && Math.random() < dt * 14)
    $.fx.push({
      x: e.x + (Math.random() - 0.5) * 40,
      y: e.y - 20 - Math.random() * 80,
      vx: 0,
      vy: -60,
      life: 0.6,
      col: '#bff5ec',
      r: 3,
    });
  const before = e.purify;
  e.purify = Math.max(0, Math.min(100, e.purify + (lit ? 12 : -0.8) * dt));
  for (const [th, msg] of [
    [25, '로…그…?'],
    [50, '빛이… 따뜻해'],
    [75, '기억나… 내 절구공이…'],
  ])
    if (before < th && e.purify >= th) pop(e.x, e.y - 140, msg);
  if (e.purify >= 100) {
    e.saved = true;
    e.noContact = true;
    $.swaves = [];
    bossGo(e, 'saved', 'restored');
    burst(e.x, e.y - 60, '#bff5ec', 30);
    burst(e.x, e.y - 60, '#f6dfa0', 20);
    pop(e.x, e.y - 150, '로그… 기다렸어.');
    setTimeout(() => {
      music('cut');
      startCut(RABBIT_CUT, afterRabbitCut);
    }, 2200);
    return;
  }
  const slow = lit ? 1.6 : 1;
  e.stT -= dt / slow;
  e.cd -= dt;
  e.dashCd -= dt;
  switch (e.st) {
    case 'walk':
    case 'chase':
      e.st = 'chase';
      e.face = Math.sign(dx) || e.face;
      if (lit && Math.random() < dt * 0.8) {
        bossGo(e, 'waver', 'sad', 0.7);
        break;
      }
      if (adx < 170 && e.cd <= 0) {
        bossGo(e, 'lift', 'lift', 0.55);
        break;
      }
      if (adx > 180 && e.dashCd <= 0) {
        bossGo(e, 'crouch', 'crouch', 0.45);
        break;
      }
      e.x += ((Math.sign(dx) * 120) / slow) * dt;
      setAnim(e, 'move');
      break;
    case 'waver':
      if (e.stT <= 0) e.st = 'chase';
      break;
    case 'lift':
      if (e.stT <= 0) {
        bossGo(e, 'slam', 'slam', 0.45);
        const hx = e.x + e.face * 40;
        shockwave(hx, e.y, 1, 300, 1.8);
        shockwave(hx, e.y, -1, 300, 1.8);
        burst(hx, e.y - 6, '#f3c46b', 10);
      }
      break;
    case 'slam':
      if (e.stT <= 0) {
        bossGo(e, 'hold', 'hold', 0.3);
        e.cd = 1.8;
      }
      break;
    case 'hold':
      if (e.stT <= 0) e.st = 'chase';
      break;
    case 'crouch':
      e.face = Math.sign(dx) || e.face;
      if (e.stT <= 0) {
        bossGo(e, 'leap', 'leap', 9);
        e.vx = Math.max(-560, Math.min(560, dx / 0.7));
        e.vy = -700;
      }
      break;
    case 'leap':
      e.x += e.vx * dt;
      e.vy += G * dt;
      e.y += e.vy * dt;
      if (e.y >= 460 && e.vy > 0) {
        e.y = 460;
        e.vy = 0;
        bossGo(e, 'land', 'land', 0.4);
        e.dashCd = 3;
        if ($.p.ground && Math.abs($.p.x - e.x) < 70 && $.p.inv <= 0) hurt(Math.sign($.p.x - e.x) || 1);
        burst(e.x, e.y - 4, '#f3c46b', 10);
      }
      break;
    case 'land':
      if (e.stT <= 0) e.st = 'chase';
      break;
  }
  e.x = Math.max($.ARENA.x0 + 50, Math.min($.ARENA.x1 - 50, e.x));
}

// ---- 사·오·미·신·유·술·해·진: 데이터 기반 보스 ----
