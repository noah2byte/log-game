// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { pop } from '../combat/damage';
import { H, W } from '../config';
import { music } from '../core/audio';
import { keys } from '../core/input';
import { markCleared, saveGame } from '../core/save';
import { $ } from '../core/state';
import { reset } from '../entities/player';
import { ctx } from '../render/canvas';
import { SCENES } from './intro';
import { drawLayer, far, mid, near, sky } from '../world/background';

export const TXT = {
  narr: '#e8dcc0',
  hw: '#f6dfa0',
  rb: '#f4efe3',
  log: '#bff5ec',
  spy: '#8ff0de',
};

export function drawBackdrop(pan, dim) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sky, 0, 0, W, H);
  drawLayer(far, 0.07, pan, 4);
  drawLayer(mid, 0.22, pan, -30);
  drawLayer(near, 0.5, pan, -4);
  ctx.fillStyle = '#2a2130';
  ctx.fillRect(0, 460, W, 80);
  ctx.fillStyle = '#6d5877';
  ctx.fillRect(0, 460, W, 6);
  if (dim > 0) {
    ctx.fillStyle = `rgba(10,6,18,${dim})`;
    ctx.fillRect(0, 0, W, H);
  }
}

export function afterEnding() {
  $.mode = 'game';
  $.IN = null;
  $.done = true;
  markCleared();
  music('cut');
  keys.jump = keys.lamp = keys.slash = false;
}

export function startCut(list, onEnd) {
  $.mode = 'intro';
  $.IN = {
    list,
    onEnd,
    sc: 0,
    li: 0,
    ch: 0,
    st: 0,
    wait: 0,
  };
}

export function afterRabbitCut() {
  $.mode = 'game';
  $.IN = null;
  const r = $.enemies.find((e) => e.k === 'rabbit');
  if (r) {
    r.alive = false;
    r.dying = 0;
  }
  const a = $.ARENA;
  a.done = true;
  a.active = false;
  keys.jump = keys.lamp = keys.slash = false;
  saveGame($.STAGE + 1);
  music('stage');
  pop(a.x1 - 90, 300, '사시의 문으로 가는 길이 열렸다');
}

export function startIntro() {
  startCut(SCENES, () => {
    $.mode = 'game';
    $.IN = null;
    reset();
  });
}

export function endIntro() {
  const f = $.IN.onEnd;
  f();
}

export function introNext() {
  const S = $.IN.list[$.IN.sc];
  if (S.title) {
    if ($.IN.st > 0.8) endIntro();
    return;
  }
  const L = S.lines[$.IN.li][1];
  if ($.IN.ch < L.length) {
    $.IN.ch = L.length;
    return;
  }
  $.IN.li++;
  $.IN.ch = 0;
  $.IN.wait = 0;
  if ($.IN.li >= S.lines.length) {
    $.IN.sc++;
    $.IN.li = 0;
    $.IN.st = 0;
  }
}

export function updateIntro(dt) {
  $.IN.st += dt;
  const S = $.IN.list[$.IN.sc];
  if (S.title) {
    if (S.auto && $.IN.st > S.auto) endIntro();
    return;
  }
  const L = S.lines[$.IN.li][1];
  if ($.IN.ch < L.length) $.IN.ch = Math.min(L.length, $.IN.ch + dt * 16);
  else {
    $.IN.wait += dt;
    if ($.IN.wait > 2.6) introNext();
  }
}

export function renderIntro() {
  const S = $.IN.list[$.IN.sc];
  if (S.title || S.full) S.draw($.IN.st);
  else {
    ctx.save();
    ctx.translate(0, -72);
    S.draw($.IN.st);
    ctx.restore();
  }
  if (!S.title) {
    if (S.full) {
      const g = ctx.createLinearGradient(0, H - 150, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.8)');
      ctx.fillStyle = g;
      ctx.fillRect(0, H - 150, W, 150);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, 36);
      ctx.fillRect(0, H - 124, W, 124);
    }
    ctx.fillStyle = 'rgba(232,178,74,.35)';
    ctx.fillRect(0, H - 124, W, 1);
    const [who, txt, style] = S.lines[$.IN.li];
    const bx = 90,
      by = H - 118,
      bw = W - 180,
      bh = 86;
    ctx.textBaseline = 'alphabetic';
    if (who) {
      ctx.fillStyle = who === '환웅' ? TXT.hw : who === '토끼' ? '#f3c46b' : TXT.log;
      ctx.font = '17px "Gowun Batang", serif';
      ctx.fillText(who, bx + 20, by + 28);
    }
    ctx.fillStyle =
      style === 'spy'
        ? TXT.spy
        : who === '환웅'
          ? TXT.hw
          : who === '로그'
            ? TXT.log
            : who === '토끼'
              ? TXT.rb
              : TXT.narr;
    ctx.font = (who ? '21px' : '22px') + ' "Gowun Batang", serif';
    ctx.fillText(txt.slice(0, Math.floor($.IN.ch)), bx + 20, by + (who ? 62 : 52));
    if ($.IN.ch >= txt.length && Math.floor($.t * 2) % 2) {
      ctx.fillStyle = '#e8b24a';
      ctx.fillRect(bx + bw - 26, by + bh - 18, 8, 6);
    }
    ctx.fillStyle = 'rgba(232,220,192,.6)';
    ctx.font = '14px "Gowun Dodum", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('건너뛰기 (Esc)', W - 24, H - 18);
    ctx.textAlign = 'left';
  }
  const fade = Math.max(0, 1 - $.IN.st * 1.8);
  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ---- 스테이지: 요괴 구간 → 보스 방 ----
