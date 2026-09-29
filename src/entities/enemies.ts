// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { gbossUpdate } from '../bosses/generic';
import { oxUpdate } from '../bosses/ox';
import { rabbitUpdate } from '../bosses/rabbit';
import { miniratUpdate, ratUpdate } from '../bosses/rat';
import { tigerUpdate } from '../bosses/tiger';
import { burst, damage, eBox, kill, pop } from '../combat/damage';
import { G, H } from '../config';
import { sfx } from '../core/audio';
import { keys } from '../core/input';
import { $ } from '../core/state';
import { BOSSK, EODUG_SC, ET, GB } from '../data/enemies';
import { box, hurt, overlap } from './player';

export function spawnEnemies() {
  return $.ENEMY_DEF.map(([k, x, y, a, b]) => mkEnemy(k, x, y, a, b));
}

export function mkEnemy(k, x, y, a, b) {
  {
    const T = ET[k];
    return {
      maxhp: T.hp,
      purify: 0,
      iframe: 0,
      stT: 0,
      dashCd: 1.5,
      splitCd: 6,
      hidden: false,
      vuln: false,
      noContact: false,
      k,
      x,
      y,
      x0: x,
      y0: y,
      min: a ?? x - 60,
      max: b ?? x + 60,
      vx: -(T.sp || 0),
      vy: 0,
      face: -1,
      alive: true,
      dying: 0,
      w: T.w,
      h: T.h,
      hp: T.hp,
      t: Math.random() * 9,
      flash: 0,
      kx: 0,
      anim: 'move',
      at: 0,
      st: k === 'dueok' ? 'lurk' : 'walk',
      cd: 0,
      lit: 0,
      stun: 0,
      size: 0,
      dmg: 0,
      tx: x,
      ground: true,
    };
  }
}

export function setAnim(e, a) {
  if (e.anim !== a) {
    e.anim = a;
    e.at = 0;
  }
}

export function onSolidBelow(e) {
  // 적 전용 낙하/착지
  e.vy += G * e._dt;
  if (e.vy > 1000) e.vy = 1000;
  const ny = e.y + e.vy * e._dt;
  e.ground = false;
  for (const s of $.solids) {
    if (s.gone) continue;
    if (e.x > s.x && e.x < s.x + s.w && e.y <= s.y + 1 && ny >= s.y && e.vy >= 0) {
      e.y = s.y;
      e.vy = 0;
      e.ground = true;
      return;
    }
  }
  e.y = ny;
}

export function patrol(e, sp) {
  e.x += e.vx * (sp / Math.abs(e.vx || sp)) * e._dt;
  if (e.x < e.min) {
    e.x = e.min;
    e.vx = Math.abs(e.vx);
  }
  if (e.x > e.max) {
    e.x = e.max;
    e.vx = -Math.abs(e.vx);
  }
  e.face = Math.sign(e.vx) || e.face;
}

export function updateEnemies(dt, prevY, lp) {
  const pb = box();
  $.alarmT -= dt;
  $.pHist.push({
    d: keys.right - keys.left,
    j: $.p.vy < -500 && !$.p.ground,
    vx: $.p.vx,
  });
  if ($.pHist.length > 70) $.pHist.shift();
  for (const e of $.enemies) {
    if (!e.alive) {
      if (e.dying > 0) {
        e.dying -= dt;
        e.at += dt;
      }
      continue;
    }
    e.t += dt;
    e.at += dt;
    e._dt = dt;
    e.cd -= dt;
    const dx = $.p.x - e.x,
      adx = Math.abs(dx),
      near = adx < 600;
    const boost = $.alarmT > 0 && near ? 1.3 : 1,
      sp = (ET[e.k].sp || 0) * boost * (GB[e.k] ? 1 : $.DIFF);
    switch (e.k) {
      case 'yangban':
        if (e.anim === 'atk') {
          if (e.at > 0.6) setAnim(e, 'move');
        } else if (adx < 90 && Math.abs($.p.y - e.y) < 60 && e.cd <= 0) {
          e.face = Math.sign(dx);
          setAnim(e, 'atk');
          e.cd = 1.6;
        } else {
          setAnim(e, 'move');
          patrol(e, sp);
        }
        break;
      case 'choraeng':
        patrol(e, sp);
        setAnim(e, 'move');
        e.hop = Math.abs(Math.sin(e.t * 7)) * 14;
        break;
      case 'imae':
        if (Math.abs(e.tx - e.x) < 4 || e.cd <= 0) {
          e.tx = e.min + Math.random() * (e.max - e.min);
          e.cd = 1.5 + Math.random() * 2;
          e.pause = Math.random() < 0.4 ? 1 : 0;
        }
        if (e.pause > 0) {
          e.pause -= dt;
          setAnim(e, 'idle');
        } else {
          const d = Math.sign(e.tx - e.x);
          e.x += d * sp * (0.6 + 0.4 * Math.sin(e.t * 3)) * dt;
          e.face = d || e.face;
          setAnim(e, adx < 70 ? 'atk' : 'move');
        }
        break;
      case 'eodug': {
        const src = lp || {
          x: $.p.x,
          y: $.p.y - 40,
        };
        const lit = $.p.lampR > 120 && Math.hypot(e.x - src.x, e.y - 30 - src.y) < $.p.lampR;
        e.size = Math.max(0, Math.min(2, e.size + (lit ? 0.9 : -0.45) * dt));
        const st = e.size < 0.67 ? 0 : e.size < 1.34 ? 1 : 2;
        if (st !== e.stage && e.stage !== undefined && st > e.stage)
          pop(e.x, e.y - e.h - 10, '쳐다볼수록 커진다');
        e.stage = st;
        setAnim(e, 's' + st);
        const scl = EODUG_SC[0] + (EODUG_SC[2] - EODUG_SC[0]) * (e.size / 2);
        e.dsc = scl;
        e.w = 150 * scl * 0.7;
        e.h = 165 * scl * 0.85;
        if (adx < 320) {
          e.face = Math.sign(dx);
          e.x += Math.sign(dx) * sp * dt;
          e.x = Math.max(e.min, Math.min(e.max, e.x));
        }
        break;
      }
      case 'jangsan': {
        if (adx > 520) {
          setAnim(e, 'idle');
          break;
        }
        const h = $.pHist[Math.max(0, $.pHist.length - 60)];
        if (h) {
          e.x += h.vx * 0.85 * dt;
          if (h.j && e.ground) {
            e.vy = -700;
            e.ground = false;
          }
          if (Math.abs(h.vx) > 10) e.face = Math.sign(h.vx);
        }
        onSolidBelow(e);
        setAnim(e, !e.ground ? 'jump' : Math.abs(h ? h.vx : 0) > 20 ? 'move' : 'idle');
        if (e.y > H + 100) {
          e.alive = false;
          burst(e.x, H, '#e8dcc0');
        }
        break;
      }
      case 'bulga': {
        if (e.anim === 'eat') {
          const s = e.eating;
          if (!s || s.gone) {
            setAnim(e, 'move');
            e.eating = null;
          } else {
            s.eat = Math.min(1, s.eat + dt / 2.6);
            s.w = s.w0 * (1 - s.eat);
            s.x = s.x0 + (s.w0 * s.eat) / 2;
            if (Math.random() < 0.3) burst(s.x + s.w / 2, s.y + s.h, '#9aa3ad', 1);
            if (s.eat >= 1) {
              s.gone = true;
              pop(s.x0 + s.w0 / 2, s.y - 10, '발판을 먹어치웠다');
            }
          }
          break;
        }
        if (adx > 520) {
          setAnim(e, 'idle');
          break;
        }
        const tgt = $.solids.find(
          (s) => s.metal && !s.gone && e.x > s.x + 10 && e.x < s.x + s.w - 10 && s.y < e.y && s.y > e.y - 220,
        );
        if (tgt) {
          e.eating = tgt;
          setAnim(e, 'eat');
          break;
        }
        setAnim(e, 'move');
        patrol(e, sp);
        break;
      }
      case 'dueok':
        if (e.st === 'lurk') {
          setAnim(e, 'lurk');
          e.face = Math.sign(dx) || e.face;
          if (adx < 70 && $.p.y > e.y + 30) {
            e.st = 'fall';
            e.vy = 0;
            setAnim(e, 'fall');
            e.y += 2;
          }
        } else if (e.st === 'fall') {
          e.y += 1;
          onSolidBelow(e);
          if (e.ground) {
            e.st = 'slam';
            setAnim(e, 'slam');
            shock(e);
          }
          if (e.y > H + 100) e.alive = false;
        } else if (e.st === 'slam') {
          if (e.at > 0.5) {
            e.st = 'walk';
            setAnim(e, 'rec');
          }
        } else {
          onSolidBelow(e);
          e.face = Math.sign(dx) || e.face;
          if (e.anim === 'rec' && e.at < 0.5) break;
          if (adx < 80 && e.cd <= 0) {
            e.st = 'slam';
            setAnim(e, 'slam');
            shock(e);
            e.cd = 1.8;
          } else {
            setAnim(e, 'move');
            const nx = e.x + Math.sign(dx) * sp * dt;
            if ($.solids.some((s) => !s.gone && nx > s.x && nx < s.x + s.w && Math.abs(s.y - e.y) < 2))
              e.x = nx;
          }
        }
        break;
      case 'changgwi':
        if (e.anim === 'call') {
          if (e.at > 1.2) setAnim(e, 'move');
        } else if (adx < 260 && e.cd <= 0) {
          setAnim(e, 'call');
          e.cd = 7;
          $.alarmT = 4;
          e.face = Math.sign(dx);
          pop(e.x, e.y - e.h - 12, '창귀가 요괴를 부른다');
        } else {
          setAnim(e, 'move');
          patrol(e, sp);
        }
        break;
      case 'rat':
        ratUpdate(e, dt, dx, adx);
        break;
      case 'ox':
        oxUpdate(e, dt, dx, adx);
        break;
      case 'tiger':
        tigerUpdate(e, dt, dx, adx);
        break;
      case 'rabbit':
        rabbitUpdate(e, dt, dx, adx, lp);
        break;
      default:
        if (GB[e.k]) gbossUpdate(e, dt, dx, adx);
        break;
      case 'minirat':
        miniratUpdate(e, dt, dx);
        break;
      case 'wisp':
        e.x = e.x0 + Math.sin(e.t * 1.1) * 70;
        e.y = e.y0 + Math.sin(e.t * 2.3) * 38;
        break;
      case 'ghost': {
        const src = lp || {
          x: $.p.x,
          y: $.p.y - 40,
        };
        const d = Math.hypot(e.x - src.x, e.y - e.h / 2 - src.y);
        e.lit = Math.max(0, Math.min(1, ($.p.lampR - d + 20) / 40));
        if (e.lit > 0.5) e.stun = 1.4;
        e.stun -= dt;
        if (e.stun <= 0) {
          const dir = Math.sign($.p.x - e.x);
          e.vx += (dir * 95 * boost - e.vx) * Math.min(1, dt * 2);
          e.x += e.vx * dt;
          e.y = e.y0 + Math.sin(e.t * 3) * 8;
        } else e.vx = 0;
        break;
      }
    }
    e.flash -= dt;
    if (e.kx) {
      e.x += e.kx * dt;
      e.kx *= Math.pow(0.02, dt);
      if (Math.abs(e.kx) < 5) e.kx = 0;
      e.x = Math.max(e.min - 40, Math.min(e.max + 40, e.x));
    }
    if ((e.k === 'dueok' && e.st === 'lurk') || e.hidden) continue;
    const eb = eBox(e);
    // 양반탈 부채 공격 판정
    if (e.k === 'yangban' && e.anim === 'atk' && e.at > 0.2 && e.at < 0.45) {
      const fb = {
        x: e.face > 0 ? e.x : e.x - 70,
        y: e.y - e.h,
        w: 70,
        h: e.h,
      };
      if (overlap(pb, fb) && $.p.inv <= 0 && $.p.hurtT <= 0) hurt(e.face);
    }
    if (!overlap(pb, eb) || $.p.hurtT > 0) continue;
    const stompable = e.k === 'ghost' ? e.stun > 0 : e.k === 'eodug' ? e.stage < 2 : true;
    const fromAbove = $.p.vy > 0 && prevY <= eb.y + 12;
    if (fromAbove && stompable) {
      $.p.vy = keys.jump ? -720 : -480;
      $.p.ground = false;
      sfx('stomp');
      if (e.k === 'rabbit') {
      } else if (e.k === 'bulga' || e.k === 'dueok' || BOSSK.includes(e.k)) {
        damage(e, 2, Math.sign(e.x - $.p.x) || 1, true);
        if (e.k === 'pig' && e.vuln) $.p.vy = -1050;
      } else kill(e);
    } else if ($.p.inv <= 0 && !e.noContact) {
      hurt(Math.sign(e.x - $.p.x) || $.p.face);
    }
  }
}

export function shock(e) {
  burst(e.x - 30, e.y - 4, '#8b7a60', 8);
  burst(e.x + 30, e.y - 4, '#8b7a60', 8);
  if ($.p.ground && Math.abs($.p.x - e.x) < 95 && Math.abs($.p.y - e.y) < 10 && $.p.inv <= 0)
    hurt(Math.sign($.p.x - e.x) * -1 || 1);
}

// ---- background: 연옥(명계와 이승 사이) × 삼국 × 현대 ----
