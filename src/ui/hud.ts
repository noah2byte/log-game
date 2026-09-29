// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { H, MAXHP, PAL, W } from '../config';
import { $ } from '../core/state';
import { STAGES } from '../data/stages';
import { TIERS, WEAP, tierOf } from '../data/weapons';
import { frameIdx } from '../entities/player';
import { ctx } from '../render/canvas';
import { drawItem } from '../render/draw';

export function drawBossHud() {
  if ($.ARENA.title > 0) {
    const a = Math.min(1, $.ARENA.title, (2.4 - $.ARENA.title) * 3);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(18,12,24,.7)';
    ctx.fillRect(0, H / 2 - 70, W, 110);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6dfa0';
    ctx.font = '44px "Gowun Batang", serif';
    ctx.fillText($.ARENA.t, W / 2, H / 2 - 26);
    ctx.fillStyle = '#cdbff0';
    ctx.font = '20px "Gowun Dodum", sans-serif';
    ctx.fillText($.ARENA.sub, W / 2, H / 2 + 18);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
  const b = $.enemies.find((e) => e.k === $.ARENA.k);
  if (!$.ARENA.active || !b || (!b.alive && b.dying <= 0) || b.saved) return;
  const x = W / 2 - 220,
    y = H - 58;
  ctx.fillStyle = 'rgba(36,30,25,.85)';
  ctx.fillRect(x, y, 440, 42);
  ctx.fillStyle = '#f3e4c2';
  ctx.font = '17px "Gowun Batang", serif';
  ctx.textBaseline = 'middle';
  ctx.fillText($.ARENA.name, x + 12, y + 21);
  ctx.fillStyle = '#3a2e44';
  ctx.fillRect(x + 200, y + 14, 226, 14);
  if (b.k === 'rabbit') {
    ctx.textAlign = 'center';
    ctx.font = '17px "Gowun Dodum", sans-serif';
    ctx.fillStyle = b.lit ? '#bff5ec' : 'rgba(232,220,192,' + (0.6 + 0.4 * Math.sin($.t * 4)) + ')';
    ctx.fillText(
      b.lit ? '빛이 그녀에게 닿고 있다' : '칼은 통하지 않는다 · X를 눌러 랜턴 빛을 그녀에게 비춰라',
      W / 2,
      y - 14,
    );
    ctx.textAlign = 'left';
    if (b.lit) {
      ctx.fillStyle = 'rgba(191,245,236,.25)';
      ctx.fillRect(x + 200, y + 14, 226, 14);
    }
    ctx.fillStyle = PAL.teal;
    ctx.fillRect(x + 200, y + 14, (226 * b.purify) / 100, 14);
    ctx.fillStyle = '#bff5ec';
    ctx.font = '12px "Gowun Dodum", sans-serif';
    ctx.fillText('정화', x + 400, y + 36);
  } else {
    ctx.fillStyle = b.vuln ? '#f3c46b' : PAL.verm;
    ctx.fillRect(x + 200, y + 14, (226 * Math.max(0, b.hp)) / b.maxhp, 14);
  }
  ctx.strokeStyle = '#f3e4c2';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 200.5, y + 14.5, 225, 13);
}

// 스프라이트 기준 배율(원본 시트 픽셀 대비)과 판정 크기

export function hud() {
  drawBossHud();
  const got = $.clues.filter((c) => c.got).length;
  ctx.fillStyle = 'rgba(36,30,25,.82)';
  ctx.fillRect(16, 16, 360, 40);
  for (let i = 0; i < MAXHP; i++) {
    const hx = 182 + i * 34,
      hy = 24;
    ctx.fillStyle = i < $.hp ? PAL.verm : '#5a4d40';
    ctx.beginPath();
    ctx.moveTo(hx + 12, hy + 22);
    ctx.lineTo(hx, hy + 9);
    ctx.arc(hx + 6, hy + 7, 6, Math.PI, 0);
    ctx.arc(hx + 18, hy + 7, 6, Math.PI, 0);
    ctx.lineTo(hx + 24, hy + 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f3e4c2';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if ($.overT > 0) {
    ctx.fillStyle = 'rgba(36,30,25,.85)';
    ctx.fillRect(W / 2 - 200, H / 2 - 50, 400, 90);
    ctx.fillStyle = '#f3e4c2';
    ctx.textAlign = 'center';
    ctx.font = '28px "Gowun Batang", serif';
    ctx.fillText('추적 실패, 장승 앞에서 다시', W / 2, H / 2 - 5);
    ctx.textAlign = 'left';
  }
  ctx.fillStyle = '#f3e4c2';
  ctx.font = '20px "Gowun Dodum", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(`기억 ${got} / ${$.clues.length}`, 30, 37);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(243,228,194,.8)';
  ctx.font = '16px "Gowun Dodum", sans-serif';
  ctx.fillText(`제${$.STAGE + 1}문 · ${STAGES[$.STAGE].t}`, W - 20, 36);
  ctx.textAlign = 'left';
  ctx.font = '20px "Gowun Dodum", sans-serif';
  if ($.sword.has) {
    const tr = tierOf($.sword.souls),
      T = TIERS[tr],
      N = TIERS[tr + 1];
    ctx.fillStyle = 'rgba(36,30,25,.82)';
    ctx.fillRect(16, 60, 290, 40);
    drawItem(WEAP[$.sword.weps[$.sword.wi]].icon, 38, 80, 26);
    ctx.fillStyle = '#bff5ec';
    ctx.font = '18px "Gowun Dodum", sans-serif';
    ctx.fillText(
      `${$.sword.weps[$.sword.wi] === 'sword' ? T.n : WEAP[$.sword.weps[$.sword.wi]].n} · 넋 ${$.sword.souls}`,
      66,
      80,
    );
    const prog = N ? ($.sword.souls - T.min) / (N.min - T.min) : 1;
    ctx.fillStyle = '#3a2e44';
    ctx.fillRect(200, 74, 94, 12);
    ctx.fillStyle = PAL.teal;
    ctx.fillRect(200, 74, 94 * prog, 12);
    ctx.strokeStyle = '#f3e4c2';
    ctx.lineWidth = 1;
    ctx.strokeRect(200.5, 74.5, 93, 11);
  }
  if ($.debug) {
    ctx.fillStyle = 'rgba(36,30,25,.82)';
    ctx.fillRect(W - 250, 62, 234, 58);
    ctx.fillStyle = '#f3e4c2';
    ctx.font = '15px monospace';
    ctx.fillText(`state ${$.p.anim}  frame #${frameIdx()}`, W - 238, 80);
    ctx.fillText(`vx ${$.p.vx.toFixed(0)}  vy ${$.p.vy.toFixed(0)}  x ${$.p.x.toFixed(0)}`, W - 238, 102);
  }
  if ($.done) {
    ctx.fillStyle = 'rgba(36,30,25,.85)';
    ctx.fillRect(W / 2 - 230, H / 2 - 70, 460, 120);
    ctx.fillStyle = '#f3e4c2';
    ctx.textAlign = 'center';
    ctx.font = '30px "Gowun Batang", serif';
    ctx.fillText('그녀와 함께, 하늘의 궁으로', W / 2, H / 2 - 28);
    ctx.font = '18px "Gowun Dodum", sans-serif';
    ctx.fillText(`모은 기억 조각 ${$.memTotal}개 · R을 누르면 타이틀로`, W / 2, H / 2 + 14);
    ctx.textAlign = 'left';
  }
}
