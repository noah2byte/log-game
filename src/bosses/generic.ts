// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { shockwave } from './common';
import { burst, pop } from '../combat/damage';
import { G } from '../config';
import { sfx } from '../core/audio';
import { $ } from '../core/state';
import { ET, FA, GB } from '../data/enemies';
import { mkEnemy, setAnim } from '../entities/enemies';
import { box, hurt, overlap } from '../entities/player';

export function gbossUpdate(e, dt, dx, adx) {
  const C = GB[e.k];
  if (!$.ARENA.active || $.ARENA.k !== e.k || $.ARENA.title > 0.4) {
    setAnim(e, 'idle');
    e.face = -1;
    if (C.hover) e.y = 400 + Math.sin(e.t * 2) * 10;
    return;
  }
  const enr = e.hp < e.maxhp * 0.5,
    tm = enr ? 0.7 : 1;
  if (enr && !e.enraged) {
    e.enraged = true;
    pop(e.x, e.y - 160, '분노한다');
    sfx('boss');
    $.shake = 0.3;
  }
  e.stT -= dt;
  e.cd -= dt;
  e.iframe -= dt;
  if (C.hover && e.st !== 'leap') e.y = 400 + Math.sin(e.t * 2) * 10;
  const mv = e.mv;
  const setSeq = (n, arr) => {
    FA[e.k][n] = arr;
    setAnim(e, 'x');
    setAnim(e, n);
  };
  switch (e.st) {
    case 'walk':
    case 'chase': {
      e.st = 'chase';
      e.face = Math.sign(dx) || e.face;
      if (e.cd <= 0) {
        const ok = C.moves.filter(
          (m) =>
            adx >= m.rng[0] &&
            adx <= m.rng[1] &&
            (!m.hpBelow || (e.hp < e.maxhp * m.hpBelow && (e.sumT || 0) <= 0)),
        );
        if (ok.length) {
          const m = ok[Math.floor(Math.random() * ok.length)];
          e.mv = m;
          e.st = 'w';
          e.stT = m.tw * tm;
          setSeq('gw', m.w);
          if (m.type === 'summon') e.sumT = m.every;
          break;
        }
      }
      e.sumT = (e.sumT || 0) - dt;
      if (adx > 70) {
        e.x += Math.sign(dx) * (ET[e.k].sp * (enr ? 1.3 : 1)) * dt;
        setAnim(e, 'move');
      } else setAnim(e, 'idle');
      break;
    }
    case 'w':
      e.shake = mv.type === 'dash' ? Math.sin(e.t * 60) * 1.5 : 0;
      if (e.stT <= 0) {
        e.shake = 0;
        e.st = 'a';
        setSeq('ga', mv.a);
        e.hit = false;
        if (mv.type === 'dash') {
          e.vx = e.face * mv.speed * (enr ? 1.15 : 1);
          e.stT = mv.dur;
          e.second = false;
          e.bounced = false;
          if (e.k === 'dragon') {
            e.face = e.x < ($.ARENA.x0 + $.ARENA.x1) / 2 ? 1 : -1;
            e.vx = e.face * mv.speed;
          }
        } else if (mv.type === 'leap') {
          e.vx = Math.max(-560, Math.min(560, dx / 0.75));
          e.vy = mv.vy;
          e.st = 'leap';
        } else {
          e.stT = mv.ta * tm;
          gAct(e, mv);
        }
      }
      break;
    case 'a':
      if (mv.type === 'dash') {
        e.x += e.vx * dt;
        if (Math.random() < 0.5)
          $.fx.push({
            x: e.x - e.face * 40,
            y: e.y - 10 - Math.random() * 50,
            vx: -e.face * 60,
            vy: -30,
            life: 0.3,
            col: '#2a1f33',
            r: 5,
          });
        const wall = e.x <= $.ARENA.x0 + 70 || e.x >= $.ARENA.x1 - 70;
        if (wall || e.stT <= 0) {
          e.x = Math.max($.ARENA.x0 + 70, Math.min($.ARENA.x1 - 70, e.x));
          if (wall && mv.bounce && !e.bounced) {
            e.bounced = true;
            e.vx = -e.vx;
            e.face = -e.face;
            e.stT = mv.dur;
            sfx('stomp');
            break;
          }
          if (wall && mv.twice && !e.second) {
            e.second = true;
            e.vx = -e.vx;
            e.face = -e.face;
            e.stT = mv.dur;
            break;
          }
          if (wall && mv.wall === 'stun') {
            e.st = 'stun';
            e.stT = mv.stunT;
            setSeq('gs', mv.stunFr);
            e.vuln = true;
            e.noContact = true;
            $.shake = 0.35;
            burst(e.x + e.face * 50, e.y - 60, '#9aa3ad', 22);
            pop(e.x, e.y - 150, '벽에 부딪혀 나동그라졌다! 밟으면 크게 튀어 오른다');
          } else {
            e.st = 'r';
            e.stT = (mv.tr || 0.4) * tm;
            setSeq('gr', mv.r);
          }
        }
        break;
      }
      if (mv.type === 'melee' && !e.hit) {
        const [f0, f1, y0, y1] = mv.hb;
        const hb = {
          x: e.face > 0 ? e.x + f0 : e.x - f1,
          y: e.y - y1,
          w: f1 - f0,
          h: y1 - y0,
        };
        if (overlap(box(), hb) && $.p.inv <= 0 && $.p.hurtT <= 0) {
          hurt(e.face);
          e.hit = true;
          if (mv.steal && !$.p.noLamp) {
            sfx('steal');
            $.p.noLamp = true;
            e.lampHits = 0;
            pop($.p.x, $.p.y - 120, '랜턴을 빼앗겼다! 원숭이를 세 번 때려 되찾아라');
          }
        }
      }
      if (e.stT <= 0) {
        e.st = 'r';
        e.stT = (mv.tr || 0.35) * tm;
        setSeq('gr', mv.r);
      }
      break;
    case 'leap':
      e.x += e.vx * dt;
      e.vy += G * dt;
      e.y += e.vy * dt;
      if (e.y >= 460 && e.vy > 0) {
        e.y = 460;
        e.vy = 0;
        e.st = 'r';
        e.stT = 0.4 * tm;
        setSeq('gr', mv.r);
        burst(e.x, e.y - 4, '#8b7a60', 10);
        if (mv.shock) {
          shockwave(e.x, e.y, 1, 380, 2.2);
          shockwave(e.x, e.y, -1, 380, 2.2);
          $.shake = 0.2;
        }
        if ($.p.ground && Math.abs($.p.x - e.x) < 75 && $.p.inv <= 0) hurt(Math.sign($.p.x - e.x) || 1);
      }
      break;
    case 'r':
      if (e.stT <= 0) {
        e.st = 'chase';
        e.cd = enr && Math.random() < 0.45 ? 0 : mv.cd * tm;
      }
      break;
    case 'stun':
      if (e.stT <= 0) {
        e.vuln = false;
        e.noContact = false;
        e.st = 'chase';
        e.cd = mv.cd;
      }
      break;
  }
  e.x = Math.max($.ARENA.x0 + 50, Math.min($.ARENA.x1 - 50, e.x));
}

export function gAct(e, m) {
  const cx = e.x + e.face * 40,
    cy = e.y - (GB[e.k].hover ? 90 : 70);
  if (m.type === 'proj') {
    const base = Math.atan2($.p.y - 45 - cy, $.p.x - cx);
    const N = e.hp < e.maxhp * 0.5 && m.nE ? m.nE : m.n;
    for (let i = 0; i < N; i++) {
      const a =
        m.kind === 'wave'
          ? e.face > 0
            ? 0
            : Math.PI
          : base + ((i - (N - 1) / 2) * m.spread) / (N > 1 ? (N - 1) / 2 : 1);
      $.eproj.push({
        x: cx,
        y: m.kind === 'wave' ? e.y - 30 - i * 28 : cy,
        vx: Math.cos(a) * m.speed,
        vy: m.kind === 'wave' ? 0 : Math.sin(a) * m.speed,
        kind: m.kind,
        life: m.kind === 'cloud' ? 4.5 : 3,
        t: i * 0.3,
      });
    }
  } else if (m.type === 'strike') {
    const NS = e.hp < e.maxhp * 0.5 && m.nE ? m.nE : m.n;
    for (let i = 0; i < NS; i++)
      $.strikes.push({
        x: Math.max($.ARENA.x0 + 30, Math.min($.ARENA.x1 - 30, $.p.x + (i - (NS - 1) / 2) * 105)),
        t: 0.8 + i * 0.15,
        done: false,
      });
    pop($.p.x, $.p.y - 120, '발밑을 조심하라');
  } else if (m.type === 'summon') {
    for (let i = 0; i < (m.n || 2); i++) {
      const sx = [$.ARENA.x0 + 70, $.ARENA.x1 - 70, $.ARENA.x0 + 480][i % 3];
      $.enemies.push(
        Object.assign(mkEnemy(i === 2 ? 'yangban' : 'choraeng', sx, 460, $.ARENA.x0 + 40, $.ARENA.x1 - 40), {
          summoned: true,
        }),
      );
    }
    pop(e.x, e.y - 150, '닭이 울자 요괴들이 깨어난다');
  }
}
