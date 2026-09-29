// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { H, PAL, W } from '../config';
import { CGIMG } from '../core/assets';
import { ctx } from '../render/canvas';
import { drawLogAt, drawSprAt, glow } from '../render/draw';
import { drawBackdrop } from './cutscene';
import { sky } from '../world/background';

export function sunReturn(k) {
  // 검은 해에 빛이 돌아온다
  const sx = 500,
    sy = 124;
  glow(sx, sy, 260 * k + 40, '246,223,160', 0.55 * k);
  ctx.globalAlpha = k;
  ctx.fillStyle = '#f6dfa0';
  ctx.beginPath();
  ctx.arc(sx, sy, 56, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath();
  ctx.arc(sx, sy, 40, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgba(246,200,140,${0.18 * k})`;
  ctx.fillRect(0, 0, W, H);
}

export function drawPalace(x, y, s, tt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  glow(0, -60, 260, '246,223,160', 0.45);
  ctx.strokeStyle = 'rgba(246,223,160,.35)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI / 2 + (i - 6.5) * 0.18 + Math.sin(tt * 0.5) * 0.02;
    ctx.beginPath();
    ctx.moveTo(0, -80);
    ctx.lineTo(Math.cos(a) * 420, -80 + Math.sin(a) * 420);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a2e44';
  ctx.beginPath();
  ctx.moveTo(-170, 0);
  ctx.lineTo(170, 0);
  ctx.lineTo(70, 60);
  ctx.lineTo(10, 110);
  ctx.lineTo(-60, 70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8b24a';
  ctx.fillRect(-170, -6, 340, 8);
  const tier = (w, yb, h) => {
    ctx.fillStyle = '#f4efe3';
    ctx.fillRect(-w / 2, yb - h, w, h);
    ctx.fillStyle = PAL.verm;
    for (let px = -w / 2 + 6; px < w / 2; px += Math.max(14, w / 7)) ctx.fillRect(px, yb - h, 5, h);
    ctx.fillStyle = '#b8862f';
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 26, yb - h + 4);
    ctx.quadraticCurveTo(0, yb - h - 8, w / 2 + 26, yb - h + 4);
    ctx.lineTo(w / 2 + 34, yb - h - 8);
    ctx.quadraticCurveTo(w / 4, yb - h - 16, w / 4 - 6, yb - h - 30);
    ctx.lineTo(-w / 4 + 6, yb - h - 30);
    ctx.quadraticCurveTo(-w / 4, yb - h - 16, -w / 2 - 34, yb - h - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f6dfa0';
    ctx.fillRect(-w / 2 - 26, yb - h + 2, w + 52, 3);
  };
  tier(220, -6, 50);
  tier(160, -86, 42);
  tier(100, -158, 36);
  ctx.fillStyle = '#f6dfa0';
  ctx.fillRect(-3, -240, 6, 40);
  ctx.beginPath();
  ctx.arc(0, -244, 8, 0, 7);
  ctx.fill();
  ctx.restore();
}

export const ENDING_CUT = [
  {
    lines: [
      ['', '용의 금관이 부서지자, 연옥을 묶고 있던 오류가 걷히기 시작했다.'],
      ['', '그리고 사슬 끝에서, 그녀가 내려왔다.'],
    ],
    draw(s) {
      drawBackdrop(15000 * 0.3, 0.55);
      drawSprAt('dragon', 16, 760, 470, 0.85, -1);
      const down = Math.min(1, s / 3),
        ry = 200 + down * 262;
      if (down < 1) {
        ctx.strokeStyle = 'rgba(79,209,193,.7)';
        ctx.lineWidth = 3;
        for (const dx of [-30, 0, 30]) {
          ctx.beginPath();
          ctx.moveTo(480 + dx * 3, 0);
          ctx.lineTo(480 + dx * 0.3, ry - 80);
          ctx.stroke();
        }
      }
      glow(480, ry - 60, 110, '191,245,236', 0.4);
      drawSprAt('rabbit', s < 1.5 ? 0 : 13, 480, ry, 0.52, -1);
      drawLogAt(300, 462, 0.62, 0, 1);
    },
  },
  {
    lines: [
      ['토끼', '로그…!'],
      ['로그', '이번엔 놓치지 않아.'],
    ],
    draw(s) {
      drawBackdrop(15000 * 0.3, 0.45);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * 6.28,
          r = 40 + s * 160;
        ctx.fillStyle = `rgba(79,209,193,${Math.max(0, 0.8 - s * 0.4)})`;
        ctx.fillRect(480 + Math.cos(a) * r, 380 + Math.sin(a) * r * 0.6, 6, 3);
      }
      glow(430, 420, 170, '246,223,160', 0.25);
      const lx = Math.min(390, 300 + s * 60);
      drawLogAt(lx, 462, 0.62, s < 1.5 ? 2 + (Math.floor(s * 8) % 5) : 0, 1);
      drawSprAt('rabbit', 13, 480, 462, 0.52, -1);
    },
  },
  {
    lines: [
      ['토끼', '기다렸어. 정말… 오래.'],
      ['로그', '이제 다 끝났어.'],
      ['로그', '같이 가자.'],
    ],
    draw(s) {
      drawBackdrop(15000 * 0.3 + 40, 0.5);
      glow(W / 2, 330, 260, '246,223,160', 0.3);
      drawSprAt('pair', Math.floor(s * 1.2) % 2, W / 2, 540, 1.3, 1);
      for (let i = 0; i < 22; i++) {
        const x = (i * 71 + s * 20) % W,
          y = (s * 40 + i * 57) % H;
        ctx.fillStyle = i % 3 ? '#f6dfa0' : PAL.verm;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x, y, 4, 3);
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    lines: [
      ['', '검은 해에 빛이 돌아왔다.'],
      ['', '열두 시진의 문이 다시 돌고, 멈췄던 시간이 흐르기 시작했다.'],
    ],
    draw(s) {
      drawBackdrop(15000 * 0.3 + 80, 0.2);
      sunReturn(Math.min(1, s / 3));
      drawSprAt('pair', 6, 480, 462, 0.6, 1);
    },
  },
  {
    lines: [
      ['', '두 사람은 환웅이 기다리는 하늘의 궁으로 향했다.'],
      ['환웅', '잘 돌아왔다, 로그. 그리고… 달의 아이여.'],
    ],
    draw(s) {
      drawBackdrop(15000 * 0.3 + 120 + s * 12, 0.15);
      sunReturn(1);
      drawPalace(720, 330, 0.72, s);
      ctx.fillStyle = 'rgba(246,223,160,.45)';
      for (let i = 0; i < 8; i++) {
        const x = 260 + i * 44,
          y = 455 - i * 16;
        ctx.fillRect(x, y, 48, 6);
      }
      const k = Math.min(1, s / 6),
        lx = 200 + k * 300,
        ly = 462 - Math.max(0, lx - 240) * 0.33;
      drawSprAt('pair', 2 + (Math.floor(s * 6) % 4), lx + 20, ly, 0.5, 1);
    },
  },
  {
    full: true,
    lines: [['', '그리고 마침내, 두 사람의 시간이 다시 흐르기 시작했다.']],
    draw(s) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      if (CGIMG.complete && CGIMG.naturalWidth) {
        const z = 1.02 + s * 0.012,
          iw = CGIMG.naturalWidth,
          ih = CGIMG.naturalHeight,
          sc = Math.max(W / iw, H / ih) * z;
        ctx.globalAlpha = Math.min(1, s / 1.2);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(CGIMG, W / 2 - (iw * sc) / 2, H / 2 - (ih * sc) / 2 - s * 3, iw * sc, ih * sc);
        ctx.globalAlpha = 1;
      }
    },
  },
  {
    title: true,
    draw(s) {
      ctx.fillStyle = '#1b1430';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(sky, 0, 0, W, H);
      ctx.save();
      ctx.translate(0, 0);
      glow(500, 124, 300, '246,223,160', 0.5);
      ctx.fillStyle = '#f6dfa0';
      ctx.beginPath();
      ctx.arc(500, 124, 56, 0, 7);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(13,9,21,.5)';
      ctx.fillRect(0, 0, W, H);
      const a = Math.min(1, s * 0.6);
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f6dfa0';
      ctx.font = '64px "Gowun Batang", serif';
      ctx.fillText('로그', W / 2, H / 2);
      ctx.fillStyle = '#cdbff0';
      ctx.font = '24px "Gowun Batang", serif';
      ctx.fillText('열두 시진의 문', W / 2, H / 2 + 44);
      ctx.fillStyle = '#e8dcc0';
      ctx.font = '18px "Gowun Dodum", sans-serif';
      ctx.fillText('멈춘 시간 속, 잃어버린 너를 찾아', W / 2, H / 2 + 90);
      if (s > 1.8) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(s * 3);
        ctx.fillText('끝 · Space 또는 화면을 눌러 결과 보기', W / 2, H / 2 + 150);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    },
  },
];
