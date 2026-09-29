// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { ratDie } from '../bosses/rat';
import { sfx } from '../core/audio';
import { $ } from '../core/state';
import { BOSSK, NAMES } from '../data/enemies';
import { tierOf } from '../data/weapons';

export // ---- enemies ----
function eBox(e) {
  return {
    x: e.x - e.w / 2,
    y: e.y - e.h,
    w: e.w,
    h: e.h,
  };
}

export function burst(x, y, col, n = 14) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28,
      s = 80 + Math.random() * 220;
    $.fx.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 120,
      life: 0.5 + Math.random() * 0.4,
      col,
      r: 2 + Math.random() * 3,
    });
  }
}

export function pop(x, y, text) {
  $.pops.push({
    x,
    y,
    text,
    life: 1,
  });
}

export function kill(e) {
  sfx('kill');
  e.alive = false;
  e.dying = 0.8;
  e.anim = 'dead';
  e.at = 0;
  const col =
    {
      wisp: '#6fe0d0',
      ghost: '#8f80b0',
      jangsan: '#e8dcc0',
      bulga: '#9aa3ad',
      eodug: '#2a1f33',
      changgwi: '#c9c2a8',
    }[e.k] || '#9b8fc8';
  burst(e.x, e.y - e.h / 2, col);
  pop(e.x, e.y - e.h - 6, NAMES[e.k]);
  const n = e.k === 'bulga' || e.k === 'dueok' ? 3 : e.k === 'yangban' || e.k === 'jangsan' ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    $.orbs.push({
      x: e.x,
      y: e.y - e.h / 2,
      vx: Math.cos(a) * 260,
      vy: Math.sin(a) * 260,
      t: -i * 0.08,
      free: !$.sword.has,
    });
  }
}

export function canCut(e) {
  return e.k !== 'ghost' || e.stun > 0 || tierOf($.sword.souls) >= 3;
}

export function damage(e, dmg, dir, stomp) {
  if (!e.alive || (!stomp && !canCut(e))) return false;
  if (e.k === 'rabbit') {
    if (!(e.msgCd > $.t)) {
      e.msgCd = $.t + 2;
      pop(e.x, e.y - 130, '칼날이 그녀를 비껴간다 · 랜턴(X)으로 비춰라');
    }
    return false;
  }
  if (BOSSK.includes(e.k)) {
    if (e.hidden || e.iframe > 0) return false;
    dmg *= e.vuln ? 2 : 1;
    e.iframe = 0.22;
  }
  sfx('hit');
  if (e.k === 'eodug') {
    e.dmg += dmg;
    e.hp = [1, 2, 4][e.stage || 0] - e.dmg;
  } else e.hp -= dmg;
  e.flash = 0.12;
  e.kx = dir * 260;
  $.freeze = 0.05;
  burst(e.x, e.y - e.h / 2, '#dffcf6', 6);
  if (e.k === 'monkey' && $.p.noLamp && ++e.lampHits >= 3) {
    $.p.noLamp = false;
    pop($.p.x, $.p.y - 120, '랜턴을 되찾았다');
  }
  if (BOSSK.includes(e.k)) {
    e.kx = dir * (['ox', 'pig', 'dragon'].includes(e.k) ? 20 : 80);
    if (e.hp <= 0) ratDie(e);
    return true;
  }
  if (e.hp <= 0) kill(e);
  return true;
}
