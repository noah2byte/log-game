// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { drawHilt } from '../combat/sword';
import { DS, H, PAL, W } from '../config';
import { $ } from '../core/state';
import { FSC } from '../data/enemies';
import { ctx } from '../render/canvas';
import { drawLogAt, glow } from '../render/draw';
import { drawBackdrop } from './cutscene';
import { sky } from '../world/background';

export function drawRabbitSpr(x, y, k, fi, face, dark) {
  const S = $.ESPR.rabbit;
  if (!S) return;
  const f = S.fr[fi];
  const sc = ((0.52 * k) / DS) * (FSC.rabbit[fi] || 1);
  let img = S.img;
  if (dark) {
    if (!S.dark) {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = 'rgba(22,15,32,.9)';
      g.fillRect(0, 0, c.width, c.height);
      S.dark = c;
    }
    img = S.dark;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face || 1, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, f.x, 0, f.w, f.h, -f.ax * sc, -f.ay * sc, f.w * sc, f.h * sc);
  ctx.restore();
}

export function drawEyes(cx, cy, tt, n) {
  for (let i = 0; i < n; i++) {
    const an = (i / 11) * Math.PI * 1.3 + Math.PI * 1.1,
      r = 150 + (i % 3) * 40;
    const x = cx + Math.cos(an) * r * 1.6,
      y = cy + Math.sin(an) * r * 0.7 + (i % 2) * 20,
      blink = Math.sin(tt * 2 + i * 1.7) > 0.93;
    ctx.fillStyle = '#1d1526';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 10);
    ctx.lineTo(x - 12, y - (i % 4 < 2 ? 34 : 26));
    ctx.lineTo(x - 4, y - 16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 18, y - 10);
    ctx.lineTo(x + 12, y - (i % 4 < 2 ? 34 : 26));
    ctx.lineTo(x + 4, y - 16);
    ctx.fill();
    if (!blink) {
      ctx.fillStyle = PAL.teal;
      ctx.fillRect(x - 10, y - 3, 6, 3);
      ctx.fillRect(x + 4, y - 3, 6, 3);
    }
  }
}

export const SCENES = [
  {
    lines: [
      ['', '이승과 저승 사이, 해가 검게 멈춘 곳.'],
      ['', '사람들은 이곳을 연옥이라 불렀다.'],
      ['', '열두 시진의 문이 차례로 돌아야 시간이 흐르고, 넋들은 제 갈 길을 찾아간다.'],
    ],
    draw(s) {
      drawBackdrop(s * 25, 0.15);
    },
  },
  {
    lines: [
      ['', '어느 밤, 하늘에서 목소리가 내려왔다.'],
      ['환웅', '탐정 로그.'],
      ['환웅', '열두 시진의 문지기, 십이지신이 오류에 물들었다.'],
      ['환웅', '그들이 문을 걸어 잠그고 연옥의 시간을 멈춰 세웠다.'],
      ['환웅', '가서 바로잡아라. 문이 다시 돌게 하라.'],
    ],
    draw(s) {
      drawBackdrop(300, 0.6);
      const a = Math.min(1, s * 0.6);
      ctx.globalAlpha = a;
      const g = ctx.createLinearGradient(0, 0, 0, 470);
      g.addColorStop(0, 'rgba(246,223,160,0)');
      g.addColorStop(0.35, 'rgba(246,223,160,.28)');
      g.addColorStop(1, 'rgba(246,223,160,.5)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 40, 0);
      ctx.lineTo(W / 2 + 40, 0);
      ctx.lineTo(W / 2 + 95, 470);
      ctx.lineTo(W / 2 - 95, 470);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff6d8';
      for (let i = 0; i < 26; i++) {
        const y = (s * 55 + i * 41) % 470,
          x = W / 2 - 70 + ((i * 53) % 140) + Math.sin(s + i) * 6;
        ctx.fillRect(x | 0, y | 0, 2, 2);
      }
      glow(W / 2, 462, 190, '246,223,160', 0.35);
      ctx.globalAlpha = 1;
      drawLogAt(W / 2, 462, 0.62, 0, 1);
    },
  },
  {
    lines: [
      ['', '명을 받은 날 밤, 한 여인이 로그의 곁에 나타났다.'],
      ['', '달빛처럼 조용한 사람이었다.'],
      ['', '그녀는 십이지신이 보낸 눈이었다.', 'spy'],
    ],
    draw(s) {
      drawBackdrop(700 + s * 6, 0.4);
      const rx = Math.max(590, 820 - s * 40);
      drawLogAt(380, 462, 0.62, 0, 1);
      glow(400, 440, 70, '111,214,198', 0.25);
      drawRabbitSpr(rx, 462, 1, 13, -1, $.IN.li < 2);
    },
  },
  {
    lines: [
      ['', '함께 사건을 쫓는 밤이 쌓여 갔다.'],
      ['', '그리고 그녀는, 품어서는 안 될 마음을 품었다.'],
    ],
    draw(s) {
      drawBackdrop(1100 + s * 10, 0.3);
      glow(470, 420, 160, '243,196,107', 0.22);
      drawLogAt(420, 462, 0.62, 0, 1);
      drawRabbitSpr(530, 462, 1, 13, -1);
      for (let i = 0; i < 14; i++) {
        const x = (i * 97 + s * 18) % W,
          y = H - ((s * 30 + i * 53) % H);
        ctx.fillStyle = '#f3c46b';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x, y, 3, 3);
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    lines: [
      ['토끼', '이건 내 절구공이야. 연옥 입구의 제단에 숨겨 둘게.'],
      ['토끼', '요괴의 넋을 담을수록 칼날이 자랄 거야.'],
      ['토끼', '쥐는 흩어졌을 때 가장 약해. 소는 벽에 부딪히면 멈추고…'],
      ['토끼', '나는… 그들이 보낸 첩자였어. 미안해.'],
    ],
    draw(s) {
      drawBackdrop(1400, 0.6);
      glow(W / 2, 300, 220, '191,245,236', 0.18);
      drawLogAt(330, 510, 1.2, 0, 1);
      drawRabbitSpr(650, 510, 2.1, $.IN.li >= 3 ? 12 : 13, -1);
      if ($.IN.li < 3) {
        const hy = 330 + Math.sin(s * 2) * 5;
        glow(495, hy, 50, '191,245,236', 0.5);
        drawHilt(478, hy, 0, 1.8);
      }
    },
  },
  {
    lines: [
      ['', '배신의 대가는 정신개조였다.'],
      ['', '십이지신은 그녀의 기억을 오류로 덮어썼다.'],
    ],
    draw(s) {
      ctx.fillStyle = '#0d0915';
      ctx.fillRect(0, 0, W, H);
      drawEyes(W / 2, 270, s, Math.min(11, Math.floor(s * 4)));
      const k = Math.min(1, s / 3);
      glow(W / 2, 380, 150, '79,209,193', 0.1 + k * 0.15);
      drawRabbitSpr(W / 2, 470 - k * 16, 1.7, k > 0.45 ? 0 : 13, -1);
      if (Math.sin(s * 23) > 0.8 && s > 1) {
        ctx.fillStyle = 'rgba(79,209,193,.12)';
        ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = 'rgba(79,209,193,.5)';
          ctx.fillRect(Math.random() * W, Math.random() * H, 40 + Math.random() * 120, 3);
        }
      }
    },
  },
  {
    lines: [
      ['', '하지만 전부 지우지는 못했다.'],
      ['토끼', '로…그…'],
    ],
    draw(s) {
      ctx.fillStyle = '#0d0915';
      ctx.fillRect(0, 0, W, H);
      glow(W / 2, 330, 240, '79,209,193', 0.14);
      drawRabbitSpr(W / 2, 500, 2.3, $.IN.li >= 1 ? 12 : 0, -1);
    },
  },
  {
    lines: [
      ['로그', '기다려. 열두 개의 문을 전부 열고, 너를 되찾으러 간다.'],
      ['로그', '설령 네게 칼을 겨눠야 한대도.'],
    ],
    draw(s) {
      drawBackdrop(1800 + s * 4, 0.45);
      glow(W / 2 + 40, 350, 180, '111,214,198', 0.28);
      drawLogAt(W / 2, 540, 1.9, 0, 1);
    },
  },
  {
    title: true,
    draw(s) {
      ctx.fillStyle = '#0d0915';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(sky, 0, 0, W, H);
      ctx.fillStyle = 'rgba(13,9,21,.55)';
      ctx.fillRect(0, 0, W, H);
      const a = Math.min(1, s * 0.7);
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f6dfa0';
      ctx.font = '64px "Gowun Batang", serif';
      ctx.fillText('로그', W / 2, H / 2 - 40);
      ctx.fillStyle = '#cdbff0';
      ctx.font = '24px "Gowun Batang", serif';
      ctx.fillText('열두 시진의 문', W / 2, H / 2 + 10);
      if (s > 1.2) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(s * 3);
        ctx.fillStyle = '#e8dcc0';
        ctx.font = '18px "Gowun Dodum", sans-serif';
        ctx.fillText('Space 또는 화면을 눌러 시작', W / 2, H / 2 + 90);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    },
  },
];
// ---- 토끼를 되찾은 뒤 컷신 ----
