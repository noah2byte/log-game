// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { THEMES, buildBackdrop } from './themes';
import { ensureSprites, spritesForStage } from '../render/sprites';
import { far, mid, near } from './background';
import { pop } from '../combat/damage';
import { H, MAXHP, W } from '../config';
import { music } from '../core/audio';
import { saveGame } from '../core/save';
import { $ } from '../core/state';
import { ALTAR, GB_PLAT, STAGE0, STAGES } from '../data/stages';
import { spawnEnemies } from '../entities/enemies';
import { ctx } from '../render/canvas';
import { startCut } from '../story/cutscene';
import { rng, sky } from './background';

export function warpStage(i) {
  $.sword.has = true;
  $.sword.souls = Math.max($.sword.souls, Math.min(16, 2 + i * 3));
  if (i > 2 && !$.sword.weps.includes('bow')) $.sword.weps.push('bow');
  if (i > 5 && !$.sword.weps.includes('spear')) $.sword.weps.push('spear');
  loadStageWhenReady(i);
}

// ---- 동선 규칙 ----
// 로그의 키는 78px, 점프 최고 높이는 약 125px다. 발판은 이 두 숫자에서 역산한 규칙으로만 놓는다.
const WALK_CLEAR = 84; // 발판 밑을 걸어서 지나가려면 발판 아랫면이 땅에서 이만큼 떨어져 있어야 한다
const REACH_UP = 118; // 제자리에서 뛰어 올라설 수 있는 최대 높이(여유 포함)
const STEP_Y = 110; // 층층 발판 사이 간격: 아래 층을 걸을 수 있고(84), 위 층에 뛰어오를 수 있는(118) 값
const PLAT_H = 24;
function jumpReach(up) {
  // up만큼 높은 곳으로 건너뛸 수 있는 최대 수평 거리(몸통 폭 여유 포함)
  const JV_ = 760,
    G_ = 2300,
    RUN_ = 270;
  if (up > REACH_UP) return 0;
  const td = (JV_ + Math.sqrt(Math.max(0, JV_ * JV_ - 2 * G_ * Math.max(0, up)))) / G_;
  return RUN_ * td * 0.9 + 30;
}
export function genStage(i) {
  // 테마마다 다른 규칙(땅 높이, 구덩이 폭, 발판 밀도, 징검돌·움직이는 발판·줄타기·장애물·계단)으로 지형을 만들되,
  // 모든 구덩이는 건너뛸 수 있고 모든 발판은 밑으로 걷거나 위로 올라설 수 있게 배치한다.
  const GP = THEMES[i].gen,
    R = rng(7919 + i * 104729),
    D = STAGES[i],
    L = 2900 + i * 110;
  const pick = (a) => a[Math.floor(R() * a.length)];
  const sol = [],
    segs = [],
    plats = [],
    en = [],
    cl = [],
    used = [],
    hurd = [];
  let x = 0,
    prevY = 460;
  const gapHelpers = [];
  while (x < L) {
    const w = Math.round(GP.seg[0] + R() * (GP.seg[1] - GP.seg[0]));
    let y = segs.length === 0 ? 460 : pick(GP.heights);
    if (Math.abs(y - prevY) > 60) y = prevY + Math.sign(y - prevY) * 60;
    if (segs.length) {
      // 앞 조각과의 구덩이 폭을 이번 조각 높이에 맞춰 건널 수 있는 만큼으로 줄인다
      const last = segs[segs.length - 1],
        gapStart = last[0] + last[2];
      const want = Math.round(GP.gap[0] + R() * (GP.gap[1] - GP.gap[0]) + Math.min(15, i * 1.5));
      const gap = Math.min(want, Math.floor(jumpReach(prevY - y) - 16));
      x = gapStart + gap;
      gapHelpers.push({ gx: gapStart, gap, aY: prevY, bY: y });
    }
    const seg = [x, y, w, 580 - y];
    sol.push(seg);
    segs.push(seg);
    prevY = y;
    x += w;
    if (x >= L) break;
  }
  const x0 = Math.max(L, x) + 140;
  const last = segs[segs.length - 1];
  if (last[1] !== 460) {
    const ns = [last[0] + last[2], 460, x0 + 960 - (last[0] + last[2]), 120];
    sol.push(ns);
    segs.push(ns);
  } else last[2] = x0 + 960 - last[0];
  // 구덩이 보조물: 징검돌 / 움직이는 발판 / 줄타기 — 전부 구덩이 안에서만 움직이거나 충분히 높게 둔다
  for (const { gx, gap, aY, bY } of gapHelpers) {
    const hi = Math.min(aY, bY),
      lo = Math.max(aY, bY);
    if (GP.stepping && gap > 120) {
      const n = gap > 170 ? 2 : 1;
      for (let k = 0; k < n; k++)
        sol.push([
          Math.round(gx + (gap / (n + 1)) * (k + 1) - 26),
          Math.round((hi + lo) / 2) + 4,
          52,
          PLAT_H,
          0,
        ]);
    } else if (gap >= 140 && R() < GP.moving) {
      const w = 84,
        ax = Math.max(8, gap / 2 - w / 2 - 12);
      sol.push([
        Math.round(gx + gap / 2 - w / 2),
        hi,
        w,
        PLAT_H,
        0,
        { move: { ax, sp: 0.9 + R() * 0.5, ph: R() * 6 } },
      ]);
    } else if (GP.ropes && R() < GP.ropes) {
      sol.push([gx - 30, hi - 112, gap + 60, 8, 0, { rope: true }]);
    }
  }
  const segAt = (px) => segs.find((s) => px > s[0] + 40 && px < s[0] + s[2] - 40 && s[0] < x0 - 40);
  // 발판 아래(구간 전체)에서 가장 높은 땅. 구덩이 위면 null
  const groundUnder = (px, w) => {
    let top = null;
    for (const s of segs)
      if (s[0] < px + w && s[0] + s[2] > px) top = top === null ? s[1] : Math.min(top, s[1]);
    return top;
  };
  const nearHurdle = (px, w, m = 50) => hurd.some(([hx, , hw]) => hx < px + w + m && hx + hw > px - m);
  // 장애물: 달리다 넘어야 하는 낮은 블록
  for (const s of segs) {
    if (s[0] < 500 || s[0] > x0 - 400) continue;
    const n = Math.floor((s[2] / 1000) * GP.hurdles + R() * 0.8);
    for (let k = 0; k < n; k++) {
      const hx = Math.round(s[0] + 120 + R() * Math.max(10, s[2] - 260));
      if (nearHurdle(hx, 36, 110)) continue;
      sol.push([hx, s[1] - 44, 36, 44, 0]);
      hurd.push([hx, s, 36]);
    }
  }
  // 금화 더미: 40px씩 올라갔다 다시 내려오는 언덕 모양의 계단.
  // 한쪽으로만 오르는 계단은 꼭대기에서 160px 절벽이 생기고 여러 개면 기둥이 늘어선 '바'처럼 보여서 이렇게 바꿨다.
  if (GP.stairs) {
    let made = 0;
    for (const s of segs) {
      if (made >= 3 || s[0] < 600 || s[0] > x0 - 500 || s[2] < 460 || R() > GP.stairs) continue;
      const px = Math.round(s[0] + 90 + R() * (s[2] - 460));
      if (nearHurdle(px, 280, 60)) continue;
      [40, 80, 120, 80, 40].forEach((h, k) => sol.push([px + k * 56, s[1] - h, 56, h, 0]));
      hurd.push([px, s, 280]);
      made++;
    }
  }
  // 발판: 땅에서 108~118px(밑으로 걷고 위로 오를 수 있는 높이), 층층 발판은 110px 간격
  const overlapsPlat = (px, y, w) =>
    plats.some((q) => q[0] < px + w + 30 && q[0] + q[2] > px - 30 && Math.abs(q[1] - y) < STEP_Y - 4);
  for (let px = 340; px < x0 - 380; px += Math.round(200 + R() * 150)) {
    if (R() > GP.plat) continue;
    const w = Math.round(110 + R() * 60);
    const gy = groundUnder(px, w);
    if (gy === null || nearHurdle(px, w)) continue;
    const y = gy - (WALK_CLEAR + PLAT_H) - Math.round(R() * (REACH_UP - WALK_CLEAR - PLAT_H));
    if (overlapsPlat(px, y, w)) continue;
    const metal = GP.metal && D.pool.includes('bulga') && R() < GP.metal ? 1 : 0;
    const pl = [px, y, w, PLAT_H, metal];
    sol.push(pl);
    plats.push(pl);
    if (GP.towers && R() < GP.towers) {
      const ux = px + (R() < 0.5 ? -70 : 70),
        up = [ux, y - STEP_Y, w - 20, PLAT_H, 0];
      if (!overlapsPlat(ux, up[1], up[2])) {
        sol.push(up);
        plats.push(up);
      }
      if (R() < 0.45) {
        const up2 = [px, y - STEP_Y * 2, w - 30, PLAT_H, 0];
        if (!overlapsPlat(px, up2[1], up2[2])) {
          sol.push(up2);
          plats.push(up2);
        }
      }
    }
  }
  // 요괴 배치: 장애물 사이 구간 안에서만 순찰하게 한다
  const free = (px) =>
    px > 620 &&
    px < x0 - 200 &&
    used.every((u) => Math.abs(u - px) > 150) &&
    hurd.every(([hx, , hw]) => px < hx - 40 || px > hx + hw + 40);
  const range = (s, px) => {
    let lo = s[0] + 30,
      hi = s[0] + s[2] - 30;
    for (const [hx, hs, hw] of hurd)
      if (hs === s) {
        if (hx + hw < px) lo = Math.max(lo, hx + hw + 14);
        else if (hx > px) hi = Math.min(hi, hx - 14);
      }
    return hi - lo > 90 ? [lo, hi] : null;
  };
  const n = 9 + i,
    order = [];
  for (let k = 0; k < n; k++) order.push(D.pool[k % D.pool.length]);
  for (const k of order) {
    for (let tries = 0; tries < 40; tries++) {
      if (k === 'dueok') {
        const pl = plats[Math.floor(R() * plats.length)];
        if (!pl || pl[4]) continue;
        const cx = pl[0] + pl[2] / 2,
          s = segAt(cx);
        if (!free(cx) || !s || s[1] - pl[1] < 90) continue;
        en.push([k, cx, pl[1]]);
        used.push(cx);
        break;
      }
      if (k === 'bulga') {
        const mp = plats.filter((q) => q[4]);
        const pl = mp[Math.floor(R() * mp.length)];
        const cx = pl ? pl[0] + pl[2] / 2 : 620 + R() * (x0 - 900);
        const s = segAt(cx);
        if (!s || !free(cx)) continue;
        const rg = range(s, cx);
        if (!rg) continue;
        en.push([k, Math.max(rg[0], Math.min(rg[1], cx - 60)), s[1], rg[0], rg[1]]);
        used.push(cx);
        break;
      }
      const cx = 620 + R() * (x0 - 900);
      const s = segAt(cx);
      if (k === 'wisp') {
        if (!free(cx)) continue;
        en.push([k, cx, (s ? s[1] : 460) - 130 - R() * 70]);
        used.push(cx);
        break;
      }
      if (!s || !free(cx)) continue;
      if (k === 'ghost') {
        en.push([k, cx, s[1] - 30]);
        used.push(cx);
        break;
      }
      if (k === 'jangsan') {
        en.push([k, cx, s[1]]);
        used.push(cx);
        break;
      }
      const rg = range(s, cx);
      if (!rg) continue;
      en.push([k, Math.max(rg[0], Math.min(rg[1], cx)), s[1], rg[0], rg[1]]);
      used.push(cx);
      break;
    }
  }
  const cks = [0.3, 0.58, 0.84].map((f) => {
    const cx = L * f;
    for (let d = 0; d < 800; d += 20) {
      const s = segAt(cx + d);
      if (s && hurd.every(([hx, , hw]) => cx + d < hx - 60 || cx + d > hx + hw + 60))
        return { x: Math.round(cx + d), y: s[1] };
    }
    return { x: Math.round(cx), y: 460 };
  });
  const pls = plats
    .slice()
    .sort(() => R() - 0.5)
    .slice(0, 5);
  for (const pl of pls) cl.push([pl[0] + pl[2] / 2, pl[1] - 40]);
  while (cl.length < 5) cl.push([700 + R() * (x0 - 1000), 300 + R() * 80]);
  return { solids: sol, enemies: en, clues: cl, cks, x0 };
}

export function loadStage(i) {
  $.STAGE = i;
  $.DIFF = 1 + i * 0.045;
  const D = STAGES[i],
    lv = i === 0 ? STAGE0 : genStage(i);
  const plat = (D.plat || GB_PLAT).map(([dx, y, w]) => [lv.x0 + dx, y, w, 24]);
  const raw = lv.solids.concat(i === 0 ? [[3750, 460, 950, 80]] : []).concat(plat);
  $.solids = raw.map(([x, y, w, h, m, o]) => ({
    ...(o || {}),
    bx: x,
    x,
    y,
    w,
    h,
    x0: x,
    w0: w,
    metal: !!m,
    eat: 0,
    gone: false,
  }));
  $.WORLD = lv.x0 + 960;
  $.GOAL = lv.x0 - 140;
  $.clueSpots = lv.clues;
  $.ENEMY_DEF = lv.enemies.concat([[D.k, lv.x0 + 700, 460]]);
  $.CKS = lv.cks.map((c) => (typeof c === 'number' ? { x: c, y: 460, on: false } : { ...c, on: false }));
  ALTAR.x = i === 0 ? 390 : -9999;
  $.ARENA = {
    k: D.k,
    x0: lv.x0,
    x1: lv.x0 + 960,
    t: D.t,
    sub: D.sub,
    name: D.name,
    active: false,
    done: false,
    title: 0,
  };
  $.p = {
    x: 120,
    y: 460,
    vx: 0,
    vy: 0,
    face: 1,
    ground: true,
    coyote: 0,
    anim: 'idle',
    at: 0,
    hurtT: 0,
    inv: 0,
    lampR: 80,
  };
  $.clues = $.clueSpots.map(([x, y]) => ({
    x,
    y,
    got: false,
    seen: 0,
  }));
  $.lastSafe = {
    x: 120,
    y: 460,
  };
  $.done = false;
  $.cam = 0;
  $.CKPT = -1;
  $.swaves = [];
  $.alarmT = 0;
  $.pHist = [];
  $.enemies = spawnEnemies();
  $.fx = [];
  $.pops = [];
  $.hp = MAXHP;
  $.overT = 0;
  $.ckX = -1;
  $.ckY = 460;
  $.eproj = [];
  $.strikes = [];
  $.parrows = [];
  $.orbs = [];
  $.waves = [];
  $.freeze = 0;
  $.sword.swing = 0;
  $.sword.rec = 0;
  $.sword.cd = 0;
  $.stageSnap = {
    souls: $.sword.souls,
    weps: $.sword.weps.slice(),
    has: $.sword.has,
  };
  saveGame(i);
  music('stage');
  pop($.p.x + 80, 360, `제${i + 1}문 · ${D.t}`);
}

export function newGame() {
  $.sword = {
    has: false,
    souls: 0,
    swing: 0,
    cd: 0,
    hit: new Set(),
    weps: ['sword'],
    wi: 0,
  };
  $.memTotal = 0;
  loadStage(0);
}

export function restartStage() {
  if ($.stageSnap) {
    $.sword.souls = $.stageSnap.souls;
    $.sword.weps = $.stageSnap.weps.slice();
    $.sword.has = $.stageSnap.has;
    $.sword.wi = 0;
  }
  loadStage($.STAGE);
}

export function stageCard(i) {
  const D = STAGES[i];
  return [
    {
      title: true,
      auto: 2.4,
      draw(s) {
        ctx.fillStyle = '#0d0915';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(buildBackdrop(i, { sky, far, mid, near }).sky, 0, 0, W, H);
        ctx.fillStyle = D.tint;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(13,9,21,.55)';
        ctx.fillRect(0, 0, W, H);
        const a = Math.min(1, s * 1.5, (2.4 - s) * 2);
        ctx.globalAlpha = Math.max(0, a);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#cdbff0';
        ctx.font = '20px "Gowun Dodum", sans-serif';
        ctx.fillText(`제${i + 1}문`, W / 2, H / 2 - 54);
        ctx.fillStyle = '#f6dfa0';
        ctx.font = '52px "Gowun Batang", serif';
        ctx.fillText(D.t, W / 2, H / 2 + 4);
        ctx.fillStyle = '#e8dcc0';
        ctx.font = '20px "Gowun Batang", serif';
        ctx.fillText(D.sub, W / 2, H / 2 + 46);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
      },
    },
  ];
}

/** 스테이지에 필요한 스프라이트가 준비될 때까지 로딩 화면을 보여준 뒤 스테이지를 연다. */
export function loadStageWhenReady(i) {
  const keys = spritesForStage(i);
  if (keys.every((k) => $.ESPR[k])) {
    $.mode = 'game';
    loadStage(i);
    return;
  }
  $.mode = 'loading';
  $.loading = { n: 0, m: keys.length };
  ensureSprites(keys, (n, m) => ($.loading = { n, m })).then(() => {
    $.loading = null;
    $.mode = 'game';
    loadStage(i);
  });
}
export function stageComplete() {
  if ($.STAGE >= 11) return;
  const n = $.STAGE + 1;
  $.done = true;
  startCut(stageCard(n), () => {
    $.IN = null;
    loadStageWhenReady(n);
  });
}
// ---- 저장 ----
