// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { H, PAL, W } from '../config';
import { $ } from '../core/state';
import { ctx } from '../render/canvas';
import { drawLogAt, glow } from '../render/draw';
import { drawBackdrop } from './cutscene';
import { drawRabbitSpr } from './intro';
import { sky } from '../world/background';

export // ---- 토끼를 되찾은 뒤 컷신 ----
function drawDragonShadow(s, cx0) {
  const n = 30;
  for (let i = n - 1; i >= 0; i--) {
    const x = cx0 + i * 30,
      y = 215 + Math.sin(i * 0.45 - s * 3) * 38,
      r = 30 - i * 0.7;
    ctx.fillStyle = 'rgba(11,7,18,.94)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.moveTo(x - 6, y - r + 2);
      ctx.lineTo(x, y - r - 12);
      ctx.lineTo(x + 6, y - r + 2);
      ctx.fill();
    }
    if (i % 4 === 1) {
      ctx.fillStyle = 'rgba(79,209,193,.35)';
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  }
  const hx = cx0 - 20,
    hy = 215 + Math.sin(-0.45 - s * 3) * 38;
  ctx.fillStyle = '#0b0712';
  ctx.beginPath();
  ctx.ellipse(hx, hy, 46, 30, 0, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx - 40, hy + 6);
  ctx.lineTo(hx - 78, hy + 14);
  ctx.lineTo(hx - 40, hy + 22);
  ctx.fill();
  ctx.fillStyle = PAL.gold;
  for (const dx of [-10, 4, 18]) {
    ctx.beginPath();
    ctx.moveTo(hx + dx - 5, hy - 26);
    ctx.lineTo(hx + dx, hy - 46);
    ctx.lineTo(hx + dx + 5, hy - 26);
    ctx.fill();
  }
  ctx.fillStyle = PAL.teal;
  ctx.fillRect(hx - 24, hy - 6, 10, 4);
  ctx.fillRect(hx - 6, hy - 6, 10, 4);
  glow(hx - 10, hy - 4, 40, '79,209,193', 0.35);
}

export function tears(x, y, s) {
  ctx.fillStyle = '#bff5ec';
  for (let k = 0; k < 2; k++) {
    const yy = (s * 55 + k * 22) % 44;
    ctx.globalAlpha = 1 - yy / 44;
    ctx.fillRect(x + k * 14, y + yy, 3, 5);
  }
  ctx.globalAlpha = 1;
}

export const RABBIT_CUT = [
  {
    lines: [
      ['토끼', '로그… 정말 너구나.'],
      ['로그', '늦어서 미안해. 이제 괜찮아.'],
    ],
    draw(s) {
      drawBackdrop(6620 * 0.3, 0.35);
      glow(480, 420, 190, '246,223,160', 0.25);
      drawLogAt(410, 462, 0.62, 0, 1);
      drawRabbitSpr(545, 462, 1, 13, -1);
      for (let i = 0; i < 16; i++) {
        const x = (i * 67 + s * 14) % W,
          y = H - ((s * 26 + i * 47) % H);
        ctx.fillStyle = '#f6dfa0';
        ctx.globalAlpha = 0.55;
        ctx.fillRect(x, y, 3, 3);
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    lines: [
      ['토끼', '기억이… 전부 돌아왔어.'],
      ['토끼', '네가 올 줄 알았어. 꼭 올 줄 알았어…'],
      ['토끼', '고마워. 정말… 고마워.'],
    ],
    draw(s) {
      drawBackdrop(6620 * 0.3 + 40, 0.55);
      glow(W / 2 + 60, 330, 230, '246,223,160', 0.2);
      drawLogAt(300, 540, 1.5, 0, 1);
      drawRabbitSpr(640, 520, 2.2, $.IN.li >= 1 ? 12 : 13, -1);
      tears(624, 348, s);
    },
  },
  {
    lines: [
      ['', '그때, 검은 해가 일렁였다.'],
      ['???', '배신자는 제자리로 돌아와야지.'],
    ],
    draw(s) {
      drawBackdrop(6620 * 0.3 + 80, 0.55 + Math.min(0.3, s * 0.1));
      ctx.fillStyle = `rgba(79,209,193,${0.06 + 0.05 * Math.sin(s * 9)})`;
      ctx.fillRect(0, 0, W, H);
      drawDragonShadow(s, W + 60 - s * 260);
      drawLogAt(410, 462, 0.62, 0, 1);
      drawRabbitSpr(545, 462, 1, $.IN.li >= 1 ? 12 : 13, -1);
    },
  },
  {
    lines: [
      ['토끼', '로그!!'],
      ['', '용의 그림자가 그녀를 다시 삼켰다.'],
    ],
    draw(s) {
      drawBackdrop(6620 * 0.3 + 80, 0.75);
      const up = Math.max(0, s - 0.3) * 150,
        ry = 462 - up;
      ctx.strokeStyle = 'rgba(79,209,193,.7)';
      ctx.lineWidth = 3;
      for (const dx of [-30, 0, 30]) {
        ctx.beginPath();
        ctx.moveTo(545 + dx * 3, 0);
        ctx.lineTo(545 + dx * 0.3, ry - 80);
        ctx.stroke();
      }
      glow(545, ry - 60, 110, '79,209,193', 0.35);
      drawRabbitSpr(545, ry, 1, s > 1.4 ? 0 : 13, -1);
      drawDragonShadow(s + 3, 380 - s * 60);
      drawLogAt(410, 462, 0.62, s > 0.6 ? 9 : 0, 1);
    },
  },
  {
    lines: [
      ['로그', '안 돼애애애——!'],
      ['로그', '…반드시 되찾는다. 이번엔 끝까지.'],
    ],
    draw(s) {
      const sh = $.IN.li === 0 ? Math.max(0, 1.2 - s) * 12 : 0;
      ctx.save();
      ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
      drawBackdrop(6620 * 0.3 + 80, 0.6);
      if ($.IN.li === 0 && s < 1) {
        ctx.fillStyle = `rgba(192,69,47,${0.3 * (1 - s)})`;
        ctx.fillRect(0, 0, W, H);
      }
      glow(W / 2 + 40, 350, 180, '111,214,198', 0.25);
      drawLogAt(W / 2, 540, 1.9, $.IN.li === 0 ? 9 : 0, 1);
      ctx.restore();
    },
  },
  {
    title: true,
    draw(s) {
      ctx.fillStyle = '#0d0915';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(sky, 0, 0, W, H);
      ctx.fillStyle = 'rgba(13,9,21,.65)';
      ctx.fillRect(0, 0, W, H);
      const a = Math.min(1, s * 0.7);
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f6dfa0';
      ctx.font = '52px "Gowun Batang", serif';
      ctx.fillText('남은 여덟 개의 문', W / 2, H / 2 - 30);
      ctx.fillStyle = '#cdbff0';
      ctx.font = '22px "Gowun Batang", serif';
      ctx.fillText('그 끝에서, 용이 기다린다', W / 2, H / 2 + 14);
      if (s > 1.2) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(s * 3);
        ctx.fillStyle = '#e8dcc0';
        ctx.font = '18px "Gowun Dodum", sans-serif';
        ctx.fillText('Space 또는 화면을 눌러 계속', W / 2, H / 2 + 90);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    },
  },
];
// ---- 엔딩 ----
