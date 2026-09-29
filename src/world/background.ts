// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { H, PAL, W } from '../config';
import { $ } from '../core/state';
import { ctx } from '../render/canvas';

export // ---- background: 연옥(명계와 이승 사이) × 삼국 × 현대 ----
function layer(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g);
  return c;
}

export function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export const SKY = [
  '#150f26',
  '#1c1430',
  '#24193b',
  '#2f1f46',
  '#3d254d',
  '#522b52',
  '#6c3350',
  '#8b3f4a',
  '#ad5243',
  '#cf6f45',
  '#e38f52',
];

// 제1문(과 타이틀·컷신)의 연옥 배경. 설정화 "연옥의 전경"을 참고해
// 소용돌이치는 보랏빛 구름과 황금 코로나의 검은 해, 폭포가 떨어지는 떠 있는 섬, 빽빽한 기와 도시와 중앙의 산성,
// 장승·솟대·청사초롱 가로등이 선 앞마당을 겹겹이 그린다.
const pine = (g, x, y, s, c) => {
  g.fillStyle = c;
  g.fillRect(x - 1, y - 10 * s, 2, 10 * s);
  for (const [dx, dy, w] of [
    [-6, -10, 12],
    [-9, -6, 9],
    [3, -7, 9],
    [-4, -14, 8],
  ])
    g.fillRect(x + dx * s, y + dy * s, w * s, 3 * s);
};
const roof = (g, x, y, w, c) => {
  g.fillStyle = c;
  g.beginPath();
  g.moveTo(x - 5, y + 2);
  g.quadraticCurveTo(x + w / 2, y - 4, x + w + 5, y + 2);
  g.lineTo(x + w + 7, y - 3);
  g.quadraticCurveTo(x + w / 2, y - 10, x - 7, y - 3);
  g.closePath();
  g.fill();
};
const lamp = (g, x, y) => {
  g.fillStyle = 'rgba(240,120,70,.28)';
  g.beginPath();
  g.arc(x, y + 4, 6, 0, 7);
  g.fill();
  g.fillStyle = '#d0463a';
  g.fillRect(x - 2, y, 5, 7);
  g.fillStyle = '#f3c46b';
  g.fillRect(x, y + 2, 1, 3);
};
export const sky = layer(480, 270, (g) => {
  const hs = [26, 24, 22, 20, 20, 20, 20, 22, 24, 26, 66];
  let y = 0;
  SKY.forEach((c, i) => {
    g.fillStyle = c;
    g.fillRect(0, y, 480, hs[i]);
    y += hs[i];
  });
  const r = rng(7);
  for (let i = 0; i < 110; i++) {
    g.fillStyle = r() < 0.2 ? '#f3d9a0' : '#cdbff0';
    g.globalAlpha = 0.3 + r() * 0.6;
    g.fillRect((r() * 480) | 0, (r() * 120) | 0, r() < 0.15 ? 2 : 1, 1);
  }
  g.globalAlpha = 1;
  // 소용돌이치는 구름 덩어리: 윗면은 어둡고 아랫면은 잿불빛
  for (let i = 0; i < 26; i++) {
    const cx = r() * 480,
      cy = 30 + r() * 110,
      rw = 30 + r() * 50,
      rh = 6 + r() * 9;
    g.fillStyle = 'rgba(28,18,48,.85)';
    g.beginPath();
    g.ellipse(cx, cy, rw, rh, 0, 0, 7);
    g.fill();
    g.fillStyle = cy > 90 ? 'rgba(227,143,82,.35)' : 'rgba(120,80,150,.35)';
    g.beginPath();
    g.ellipse(cx + 4, cy + rh * 0.5, rw * 0.8, rh * 0.45, 0, 0, 7);
    g.fill();
  }
  // 일식: 소용돌이 고리 + 황금 코로나
  const sx = 250,
    sy = 58;
  for (let k = 0; k < 4; k++) {
    g.strokeStyle = `rgba(232,178,74,${0.12 + k * 0.04})`;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(sx, sy, 70 - k * 9, 0.3 + k, 5.4 + k);
    g.stroke();
  }
  g.fillStyle = 'rgba(232,178,74,.22)';
  g.beginPath();
  g.arc(sx, sy, 50, 0, 7);
  g.fill();
  g.fillStyle = 'rgba(232,178,74,.4)';
  g.beginPath();
  g.arc(sx, sy, 38, 0, 7);
  g.fill();
  for (let a = 0; a < 32; a++) {
    const an = (a / 32) * Math.PI * 2,
      l = a % 2 ? 40 : 48;
    g.strokeStyle = '#f0c060';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(sx + Math.cos(an) * 30, sy + Math.sin(an) * 30);
    g.lineTo(sx + Math.cos(an) * l, sy + Math.sin(an) * l);
    g.stroke();
  }
  g.fillStyle = '#fff0c0';
  g.beginPath();
  g.arc(sx, sy, 30, 0, 7);
  g.fill();
  g.fillStyle = '#0a0612';
  g.beginPath();
  g.arc(sx - 1, sy, 28, 0, 7);
  g.fill();
  // 사신도 별자리: 청룡(구불구불), 백호(좌), 주작(우)
  const star = (pts) => {
    g.strokeStyle = 'rgba(111,214,198,.4)';
    g.lineWidth = 1;
    g.beginPath();
    pts.forEach(([x, yy], i) => (i ? g.lineTo(x, yy) : g.moveTo(x, yy)));
    g.stroke();
    g.fillStyle = '#bff5ec';
    pts.forEach(([x, yy]) => g.fillRect(x - 1, yy - 1, 2, 2));
  };
  star([
    [20, 44],
    [40, 34],
    [62, 40],
    [84, 30],
    [106, 38],
    [128, 26],
    [150, 34],
    [168, 24],
  ]);
  star([
    [60, 70],
    [74, 62],
    [92, 66],
    [104, 58],
    [96, 76],
    [80, 82],
    [66, 78],
  ]);
  star([
    [340, 30],
    [356, 22],
    [372, 28],
    [386, 18],
    [400, 26],
    [392, 40],
    [376, 44],
    [360, 40],
  ]);
  star([
    [420, 60],
    [436, 52],
    [452, 58],
    [444, 70],
    [430, 72],
  ]);
});
export const far = layer(480, 270, (g) => {
  const base = 222,
    r = rng(11),
    C = '#2b1f3f',
    C2 = '#23193a';
  const win = (x, y, w, h, p = 0.3) => {
    for (let yy = y + 4; yy < y + h - 3; yy += 5)
      for (let xx = x + 3; xx < x + w - 2; xx += 4)
        if (r() < p) {
          g.fillStyle = r() < 0.65 ? '#5fc9b9' : '#e8b24a';
          g.fillRect(xx, yy, 2, 2);
        }
  };
  // 먼 스카이라인(두 겹)
  for (let x = 0; x < 480; x += 14) {
    const h = 30 + r() * 60;
    g.fillStyle = C2;
    g.fillRect(x, base - h, 12, h);
    win(x, base - h, 12, h, 0.12);
  }
  // 중앙의 산성: 봉우리 위 궁궐
  g.fillStyle = '#261a38';
  g.beginPath();
  g.moveTo(150, base);
  g.quadraticCurveTo(200, 110, 240, 104);
  g.quadraticCurveTo(290, 108, 330, base);
  g.closePath();
  g.fill();
  for (const [x, y, w] of [
    [205, 118, 70],
    [215, 104, 50],
    [228, 92, 24],
  ]) {
    g.fillStyle = C;
    g.fillRect(x, y, w, 12);
    roof(g, x, y, w, '#140c1e');
    win(x, y, w, 12, 0.5);
  }
  g.fillStyle = '#e8b24a';
  g.fillRect(239, 80, 2, 10);
  g.strokeStyle = 'rgba(79,209,193,.5)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(180, 160);
  g.lineTo(200, 150);
  g.lineTo(214, 156);
  g.moveTo(270, 150);
  g.lineTo(290, 162);
  g.stroke();
  // 장군총과 탑
  for (let i = 0; i < 7; i++) {
    const w = 96 - i * 12;
    g.fillStyle = i % 2 ? C : '#30234a';
    g.fillRect(40 + (96 - w) / 2, base - (i + 1) * 8, w, 8);
  }
  g.fillStyle = '#5fc9b9';
  for (let i = 0; i < 6; i++) g.fillRect(84, base - 10 - i * 8, 3, 3);
  for (const [x, t] of [
    [140, 5],
    [372, 4],
  ]) {
    let yy = base - 10;
    for (let k = 0; k < t; k++) {
      const w = 20 - k * 3;
      g.fillStyle = C;
      g.fillRect(x - w / 2, yy - 9, w, 9);
      roof(g, x - w / 2 - 2, yy - 9, w + 4, '#140c1e');
      yy -= 12;
    }
  }
  // 기와지붕을 인 빌딩 숲
  for (const [x, w, h] of [
    [300, 30, 130],
    [336, 20, 96],
    [410, 34, 150],
    [450, 18, 110],
    [112, 22, 90],
    [168, 18, 70],
  ]) {
    g.fillStyle = C;
    g.fillRect(x, base - h, w, h);
    win(x, base - h, w, h);
    roof(g, x, base - h, w, '#140c1e');
    if (h > 100) roof(g, x + 2, base - h * 0.55, w - 4, '#140c1e');
  }
  g.fillStyle = C;
  g.fillRect(0, base, 480, 48);
  // 구름 바다
  g.fillStyle = 'rgba(160,130,190,.35)';
  for (let i = 0; i < 30; i++) {
    g.beginPath();
    g.arc(r() * 480, base - 4 + r() * 10, 10 + r() * 14, 0, 7);
    g.fill();
  }
  g.fillStyle = 'rgba(227,143,82,.2)';
  g.fillRect(0, base - 12, 480, 10);
});
export const mid = layer(480, 270, (g) => {
  const r = rng(21);
  const isle = (x, y, w, fall) => {
    g.fillStyle = '#5a4468';
    g.beginPath();
    g.moveTo(x - w / 2, y);
    g.lineTo(x + w / 2, y);
    g.lineTo(x + w * 0.3, y + w * 0.25);
    g.lineTo(x + w * 0.08, y + w * 0.45);
    g.lineTo(x - w * 0.12, y + w * 0.32);
    g.lineTo(x - w * 0.36, y + w * 0.16);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(20,12,30,.45)';
    g.beginPath();
    g.moveTo(x - w * 0.2, y + w * 0.18);
    g.lineTo(x + w * 0.25, y + w * 0.2);
    g.lineTo(x + w * 0.08, y + w * 0.45);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(227,143,82,.55)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x + w / 2, y);
    g.lineTo(x + w * 0.3, y + w * 0.25);
    g.lineTo(x + w * 0.08, y + w * 0.45);
    g.stroke();
    g.fillStyle = '#7a6090';
    for (let k = 0; k < 6; k++) g.fillRect(x - w / 2 + r() * w, y + 4 + r() * w * 0.2, 6, 2);
    g.fillStyle = '#2f5a4a';
    g.fillRect(x - w / 2, y - 4, w, 5);
    g.fillStyle = '#c2694a';
    g.fillRect(x + w / 2 - 12, y - 4, 12, 2);
    // 폭포와 그 아래 물보라
    if (fall)
      for (const fx of fall) {
        g.fillStyle = 'rgba(191,245,236,.55)';
        g.fillRect(x + fx, y, 3, 70);
        g.fillStyle = 'rgba(191,245,236,.25)';
        g.fillRect(x + fx - 2, y + 20, 7, 60);
        g.fillStyle = 'rgba(220,240,240,.3)';
        g.beginPath();
        g.arc(x + fx + 1, y + 74, 8, 0, 7);
        g.fill();
      }
    // 매달린 뿌리·사슬
    g.fillStyle = '#8a7a92';
    for (const cx of [x - w * 0.2, x + w * 0.15])
      for (let k = 0; k < 6; k++) g.fillRect(cx | 0, y + w * 0.28 + k * 5, 2, 3);
  };
  // 섬1: 기울어진 오층석탑과 소나무
  isle(100, 150, 120, [30]);
  g.save();
  g.translate(92, 146);
  g.rotate(-0.12);
  g.fillStyle = '#6c5a74';
  g.fillRect(-14, -10, 28, 10);
  let yy = -10;
  for (let i = 0; i < 5; i++) {
    const w = 34 - i * 5;
    g.fillStyle = '#7d6a86';
    g.fillRect(-w / 2 - 3, yy - 3, w + 6, 3);
    g.fillStyle = '#5a4a63';
    g.fillRect(-w / 2 + 3, yy - 11, w - 6, 8);
    yy -= 11;
  }
  g.fillStyle = '#e8b24a';
  g.fillRect(-1, yy - 10, 2, 10);
  g.restore();
  pine(g, 140, 146, 1.4, '#1c3a2c');
  // 섬2: 전봇대·연등·기와집
  isle(350, 100, 160, [-40, 50]);
  g.fillStyle = '#1f1628';
  g.fillRect(288, 40, 4, 58);
  g.fillRect(408, 34, 4, 64);
  g.fillRect(284, 48, 12, 2);
  g.fillRect(404, 42, 12, 2);
  g.strokeStyle = '#1f1628';
  g.lineWidth = 1;
  for (const dy of [0, 5]) {
    g.beginPath();
    g.moveTo(290, 49 + dy);
    g.quadraticCurveTo(350, 72 + dy, 410, 43 + dy);
    g.stroke();
  }
  for (const [lx, ly] of [
    [312, 58],
    [334, 62],
    [356, 63],
    [380, 58],
  ])
    lamp(g, lx, ly);
  g.fillStyle = '#3b2a44';
  g.fillRect(326, 80, 48, 18);
  roof(g, 322, 80, 56, '#1f1628');
  g.fillStyle = '#f3c46b';
  g.fillRect(335, 86, 6, 6);
  g.fillRect(358, 86, 6, 6);
  // 먼 작은 섬들
  for (const [x, y, w] of [
    [210, 60, 40],
    [470, 130, 50],
    [30, 70, 34],
  ]) {
    isle(x, y, w, w > 45 ? [8] : null);
    pine(g, x - 4, y - 2, 0.8, '#1c3a2c');
  }
  for (let i = 0; i < 6; i++) lamp(g, 180 + r() * 260, 20 + r() * 60);
});
export const near = layer(480, 270, (g) => {
  const b = 232,
    C = '#1d1526';
  // 장승 한 쌍(얼굴을 새긴 기둥)
  const js = (x, h) => {
    g.fillStyle = C;
    g.fillRect(x, b - h, 16, h);
    g.fillRect(x - 3, b - h - 7, 22, 9);
    g.fillStyle = '#2a1f33';
    g.fillRect(x + 2, b - h + 6, 12, 22);
    g.fillStyle = '#5fc9b9';
    g.fillRect(x + 3, b - h + 11, 3, 3);
    g.fillRect(x + 10, b - h + 11, 3, 3);
    g.fillStyle = '#8b3f4a';
    g.fillRect(x + 4, b - h + 21, 8, 3);
    g.fillStyle = '#f4efe3';
    g.fillRect(x + 5, b - h + 21, 1, 2);
    g.fillRect(x + 10, b - h + 21, 1, 2);
  };
  js(30, 84);
  js(54, 74);
  // 붉은 깃발 장대
  g.fillStyle = C;
  g.fillRect(96, b - 130, 3, 130);
  g.fillStyle = '#8b2a24';
  g.fillRect(99, b - 126, 14, 50);
  g.fillRect(99, b - 76, 10, 8);
  // 솟대 무리
  const sd = (x, h) => {
    g.fillStyle = C;
    g.fillRect(x, b - h, 2, h);
    g.fillRect(x - 4, b - h - 3, 9, 3);
    g.fillRect(x + 4, b - h - 6, 3, 3);
    g.fillRect(x - 6, b - h - 2, 3, 2);
  };
  sd(160, 120);
  sd(172, 96);
  sd(186, 108);
  // 소나무
  pine(g, 222, b, 2.2, '#150f1c');
  // 청사초롱 가로등
  g.fillStyle = C;
  g.fillRect(262, b - 112, 4, 112);
  g.fillRect(262, b - 112, 26, 3);
  g.fillRect(284, b - 110, 2, 6);
  g.fillStyle = 'rgba(111,214,198,.22)';
  g.beginPath();
  g.arc(285, b - 96, 16, 0, 7);
  g.fill();
  g.fillStyle = '#c0452f';
  g.fillRect(280, b - 104, 10, 6);
  g.fillStyle = '#3a5fa0';
  g.fillRect(280, b - 98, 10, 6);
  g.fillStyle = '#f3c46b';
  g.fillRect(283, b - 101, 4, 4);
  // 연등 전선
  g.strokeStyle = C;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(266, b - 100);
  g.quadraticCurveTo(320, b - 70, 376, b - 104);
  g.stroke();
  for (const lx of [296, 322, 348]) lamp(g, lx, b - 86 + Math.abs(lx - 322) * 0.2);
  // 기울어진 신호등
  g.fillStyle = C;
  g.fillRect(380, b - 104, 4, 104);
  g.save();
  g.translate(382, b - 104);
  g.rotate(0.3);
  g.fillRect(-5, -28, 11, 28);
  g.fillStyle = '#c0452f';
  g.fillRect(-2, -25, 6, 5);
  g.fillStyle = '#3a2e44';
  g.fillRect(-2, -18, 6, 5);
  g.fillStyle = '#2f8f7f';
  g.fillRect(-2, -11, 6, 5);
  g.restore();
  // 기와를 얹은 낮은 돌담과 이끼
  for (let x = 0; x < 480; x += 18) {
    g.fillStyle = C;
    g.fillRect(x, b - 12 - ((x / 18) % 3), 16, 14);
  }
  roof(g, 420, b - 22, 56, '#140c1e');
  g.fillStyle = C;
  g.fillRect(420, b - 22, 56, 10);
  g.fillStyle = '#2f5a4a';
  for (let x = 4; x < 480; x += 13) g.fillRect(x, b - 13 - ((x / 13) % 2), 5, 2);
});

export function drawLayer(img, f, cam, yOff = 0) {
  const tw = img.width * 2,
    off = -((cam * f) % tw);
  for (let x = off; x < W; x += tw) ctx.drawImage(img, x, yOff, tw, img.height * 2);
}
// 떠오르는 혼불과 잿불

export // 떠오르는 혼불과 잿불
const r0 = rng(3);

export const souls = Array.from(
  {
    length: 26,
  },
  () => ({
    x: r0() * 1600,
    y: r0() * 540,
    s: 10 + r0() * 18,
    ph: r0() * 9,
  }),
);

export const embers = Array.from(
  {
    length: 40,
  },
  () => ({
    x: r0() * W,
    y: r0() * H,
    s: 30 + r0() * 50,
    ph: r0() * 9,
  }),
);

export function drawSouls(dt) {
  for (const q of souls) {
    q.y -= q.s * dt;
    if (q.y < -20) {
      q.y = H + 20;
      q.x = r0() * 1600;
    }
    const x = ((((q.x - $.cam * 0.35) % 1600) + 1600) % 1600) - 200,
      y = q.y,
      sw = Math.sin($.t * 1.3 + q.ph) * 6;
    ctx.fillStyle = 'rgba(243,196,107,.16)';
    ctx.beginPath();
    ctx.arc(x + sw, y, 7, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#f3c46b';
    ctx.fillRect(Math.round(x + sw) - 1, Math.round(y) - 1, 3, 3);
  }
}

export function drawMist() {
  ctx.fillStyle = '#140d1f';
  ctx.fillRect(0, 470, W, H - 470);
  ctx.fillStyle = 'rgba(79,209,193,.08)';
  for (let x = 0; x < W; x += 6) {
    const h = 6 + ((x * 37) % 23);
    ctx.fillRect(x, H - h, 2, h);
  }
  for (let k = 0; k < 4; k++) {
    ctx.fillStyle = `rgba(170,190,215,${0.07 + k * 0.035})`;
    const by = 418 + k * 22;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const y = by + Math.sin(x * 0.018 + $.t * (0.6 + k * 0.25) + k * 1.7) * 5;
      ctx.lineTo(x, Math.round(y / 2) * 2);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawEmbers(dt) {
  for (const q of embers) {
    q.y -= q.s * dt;
    q.x += Math.sin($.t * 2 + q.ph) * 10 * dt;
    if (q.y < -4) {
      q.y = H + 4;
      q.x = r0() * W;
    }
    ctx.globalAlpha = 0.5 + Math.sin($.t * 6 + q.ph) * 0.4;
    ctx.fillStyle = q.ph > 6 ? '#f3c46b' : '#e0703f';
    ctx.fillRect(q.x | 0, q.y | 0, 2, 2);
  }
  ctx.globalAlpha = 1;
}

export const vignette = layer(W, H, (g) => {
  const gr = g.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, W * 0.72);
  gr.addColorStop(0, 'rgba(10,5,20,0)');
  gr.addColorStop(1, 'rgba(10,5,20,.55)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
});

// ---- 도입 영상 ----
