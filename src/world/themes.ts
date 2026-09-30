// 스테이지별 테마: 배경 네 겹(하늘·먼 풍경·중간·가까운 풍경), 바닥 질감, 대기 입자, 맵 생성 규칙.
// 열두 시진이 흐르는 하루라는 설정에 맞춰, 자시의 밤 → 묘시의 새벽 → 오시의 한낮 → 유시의 노을 → 해시의 밤으로
// 하늘 색이 바뀌고, 각 문을 지키는 십이지신의 성격이 풍경에 드러나게 했다.
// 배경은 480×270 저해상도 캔버스에 그린 뒤 2배로 키운다. 픽셀 아트 느낌을 유지하려는 것이다.

type G2 = CanvasRenderingContext2D;
type Rng = () => number;

export type Particle =
  | 'embers'
  | 'sparks'
  | 'leaves'
  | 'petals'
  | 'fireflies'
  | 'dust'
  | 'fluff'
  | 'confetti'
  | 'gold'
  | 'rain'
  | 'snow';

export interface GroundStyle {
  body: string;
  top: string;
  hi: string;
  line: string;
  accent: string;
  pattern: 'brick' | 'grate' | 'earth' | 'moss' | 'jade' | 'cloud' | 'plank' | 'gold' | 'stone';
  circuit?: boolean;
}
export interface PlatStyle {
  body: string;
  top: string;
  trim: string[];
}
export interface GenParams {
  seg: [number, number]; // 땅 조각 길이 범위
  gap: [number, number]; // 구덩이 폭 범위
  heights: number[]; // 땅 높이 후보(y). 이웃 조각과의 차이는 최대 60으로 제한한다
  plat: number; // 발판 밀도(0~1)
  platOff: number[]; // 발판이 땅에서 떠 있는 높이 후보
  moving: number; // 구덩이 위에 움직이는 발판을 놓을 확률
  hurdles: number; // 1000px당 장애물(뛰어넘을 블록) 수
  stepping?: boolean; // 넓은 구덩이에 징검돌
  towers?: number; // 발판을 2~3층으로 쌓을 확률
  ropes?: number; // 줄타기(얇은 긴 발판) 확률
  stairs?: number; // 계단형 발판 확률
  metal?: number; // 쇠 발판 확률(불가사리용)
}
export interface Theme {
  name: string;
  sky: string[];
  sun: 'eclipse' | 'moon' | 'redsun' | 'bright' | 'crimson' | 'cold';
  far: (g: G2, r: Rng) => void;
  mid: (g: G2, r: Rng) => void;
  near: (g: G2, r: Rng) => void;
  ground: GroundStyle;
  plat: PlatStyle;
  particle: Particle;
  mist: string; // 'r,g,b'
  pit: string;
  water?: boolean;
  overlay?: 'lightning' | 'searchlight' | 'heat';
  gen: GenParams;
}

export function mkRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function canvas(w: number, h: number, draw: (g: G2) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  return c;
}

// ---- 공용 붓 ----
const INK = '#120c18';
function bands(g: G2, cols: string[]) {
  const hs = [26, 24, 22, 20, 20, 20, 20, 22, 24, 26, 66];
  let y = 0;
  cols.forEach((c, i) => {
    g.fillStyle = c;
    g.fillRect(0, y, 480, hs[i]);
    y += hs[i];
  });
}
function stars(g: G2, r: Rng, n: number, maxY = 130) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() < 0.2 ? '#f3d9a0' : '#cdbff0';
    g.globalAlpha = 0.3 + r() * 0.6;
    g.fillRect((r() * 480) | 0, (r() * maxY) | 0, r() < 0.15 ? 2 : 1, 1);
  }
  g.globalAlpha = 1;
}
function sun(g: G2, type: Theme['sun'], x = 250, y = 62) {
  if (type === 'moon') {
    g.fillStyle = 'rgba(240,230,250,.16)';
    g.beginPath();
    g.arc(x, y + 10, 70, 0, 7);
    g.fill();
    g.fillStyle = '#efe9f6';
    g.beginPath();
    g.arc(x, y + 10, 50, 0, 7);
    g.fill();
    g.fillStyle = '#d9d0e6';
    for (const [dx, dy, rr] of [
      [-14, -6, 9],
      [12, 14, 7],
      [18, -12, 5],
      [-6, 20, 5],
    ]) {
      g.beginPath();
      g.arc(x + dx, y + 10 + dy, rr, 0, 7);
      g.fill();
    }
    // 달 속 계수나무
    g.fillStyle = 'rgba(120,100,150,.45)';
    g.fillRect(x - 2, y + 4, 4, 26);
    for (const [dx, dy, rr] of [
      [0, 0, 11],
      [-9, 6, 8],
      [9, 6, 8],
    ]) {
      g.beginPath();
      g.arc(x + dx, y + dy, rr, 0, 7);
      g.fill();
    }
    return;
  }
  if (type === 'redsun') {
    g.fillStyle = 'rgba(255,140,90,.2)';
    g.beginPath();
    g.arc(x, 190, 90, 0, 7);
    g.fill();
    g.fillStyle = '#e8573a';
    g.beginPath();
    g.arc(x, 190, 62, 0, 7);
    g.fill();
    g.fillStyle = '#f07a4a';
    for (let i = 0; i < 5; i++) g.fillRect(x - 62, 172 + i * 12, 124, 3);
    g.fillStyle = '#1b0b10';
    g.beginPath();
    g.arc(x - 4, 190, 44, 0, 7);
    g.fill();
    return;
  }
  const corona = type === 'crimson' ? '#e0503a' : type === 'cold' ? '#9ad7e8' : '#e8b24a';
  const halo = type === 'bright' ? 0.5 : 0.25;
  g.fillStyle =
    type === 'crimson'
      ? `rgba(224,80,58,${halo})`
      : type === 'cold'
        ? `rgba(154,215,232,${halo})`
        : `rgba(232,178,74,${halo})`;
  g.beginPath();
  g.arc(x, y, type === 'bright' ? 60 : 46, 0, 7);
  g.fill();
  for (let a = 0; a < 24; a++) {
    const an = (a / 24) * Math.PI * 2,
      l = a % 2 ? 38 : 46;
    g.strokeStyle = corona;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x + Math.cos(an) * 30, y + Math.sin(an) * 30);
    g.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l);
    g.stroke();
  }
  g.fillStyle = type === 'bright' ? '#fff3cc' : '#f6dfa0';
  g.beginPath();
  g.arc(x, y, 29, 0, 7);
  g.fill();
  g.fillStyle = '#0d0915';
  g.beginPath();
  g.arc(x - 1, y, 27, 0, 7);
  g.fill();
}
function giwa(g: G2, x: number, y: number, w: number, c: string) {
  g.fillStyle = c;
  g.beginPath();
  g.moveTo(x - 5, y + 2);
  g.quadraticCurveTo(x + w / 2, y - 4, x + w + 5, y + 2);
  g.lineTo(x + w + 7, y - 3);
  g.quadraticCurveTo(x + w / 2, y - 10, x - 7, y - 3);
  g.closePath();
  g.fill();
}
function hills(g: G2, base: number, amp: number, col: string, r: Rng, freq = 0.02) {
  const ph = r() * 9;
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(0, 270);
  for (let x = 0; x <= 480; x += 4)
    g.lineTo(x, base - Math.sin(x * freq + ph) * amp - Math.sin(x * freq * 2.7 + ph) * amp * 0.35);
  g.lineTo(480, 270);
  g.closePath();
  g.fill();
}
function peaks(g: G2, col: string, base: number, list: number[][]) {
  for (const [x0, w, h] of list)
    for (const x of [x0 - 480, x0, x0 + 480]) {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(x - w / 2, base);
      g.quadraticCurveTo(x - w / 2, base - h * 0.6, x - w * 0.18, base - h * 0.85);
      g.quadraticCurveTo(x, base - h * 1.05, x + w * 0.18, base - h * 0.85);
      g.quadraticCurveTo(x + w / 2, base - h * 0.6, x + w / 2, base);
      g.closePath();
      g.fill();
    }
}
function island(g: G2, x: number, y: number, w: number, top: string, rock: string) {
  g.fillStyle = rock;
  g.beginPath();
  g.moveTo(x - w / 2, y);
  g.lineTo(x + w / 2, y);
  g.lineTo(x + w * 0.2, y + w * 0.3);
  g.lineTo(x, y + w * 0.4);
  g.lineTo(x - w * 0.25, y + w * 0.22);
  g.closePath();
  g.fill();
  g.fillStyle = top;
  g.fillRect(x - w / 2, y - 4, w, 5);
}
function pagoda(g: G2, x: number, y: number, tiers: number, wall: string, roof: string) {
  let yy = y;
  for (let i = 0; i < tiers; i++) {
    const w = 30 - i * 5;
    g.fillStyle = wall;
    g.fillRect(x - w / 2, yy - 10, w, 10);
    giwa(g, x - w / 2 - 2, yy - 10, w + 4, roof);
    yy -= 13;
  }
  g.fillStyle = '#e8b24a';
  g.fillRect(x - 1, yy - 8, 2, 8);
}
function lanterns(g: G2, x1: number, y1: number, x2: number, y2: number, n: number, sag = 14) {
  g.strokeStyle = '#1f1628';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x1, y1);
  g.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag, x2, y2);
  g.stroke();
  for (let i = 1; i <= n; i++) {
    const k = i / (n + 1),
      lx = x1 + (x2 - x1) * k,
      ly = y1 + (y2 - y1) * k + sag * 4 * k * (1 - k) * 0.5 + 2;
    g.fillStyle = 'rgba(232,110,70,.3)';
    g.beginPath();
    g.arc(lx, ly + 4, 6, 0, 7);
    g.fill();
    g.fillStyle = i % 2 ? '#d0463a' : '#3a5fa0';
    g.fillRect(lx - 2, ly, 5, 7);
    g.fillStyle = '#f3c46b';
    g.fillRect(lx, ly + 2, 1, 3);
  }
}
function windows(g: G2, r: Rng, x: number, y: number, w: number, h: number, cols: string[], p = 0.28) {
  for (let yy = y + 4; yy < y + h - 3; yy += 5)
    for (let xx = x + 3; xx < x + w - 2; xx += 4)
      if (r() < p) {
        g.fillStyle = cols[(r() * cols.length) | 0];
        g.fillRect(xx, yy, 2, 2);
      }
}

// ---- 테마별 그림 ----
export const THEMES: Theme[] = [];

// 0 자시: 가라앉은 도시(기존 배경을 그대로 쓴다)
THEMES[0] = {
  name: '가라앉은 도시',
  sky: [],
  sun: 'eclipse',
  far: () => {},
  mid: () => {},
  near: () => {},
  ground: {
    body: '#3a2e44',
    top: '#6d5877',
    hi: '#9c83a3',
    line: '#261d2e',
    accent: '#4fd1c1',
    pattern: 'brick',
    circuit: true,
  },
  plat: { body: '#5b4964', top: '#9c83a3', trim: ['#2f8f7f', '#c0452f', '#e8b24a', '#2f8f7f', '#3a5fa0'] },
  particle: 'embers',
  mist: '170,190,215',
  pit: '#140d1f',
  gen: {
    seg: [460, 980],
    gap: [95, 150],
    heights: [460],
    plat: 0.64,
    platOff: [110, 150, 190],
    moving: 0,
    hurdles: 0,
  },
};

// 1 축시: 제철소와 공사장 — 쇠를 다루는 소의 문
THEMES[1] = {
  name: '쇳물이 흐르는 제철소',
  sky: [
    '#140c0c',
    '#1c1110',
    '#261612',
    '#311b14',
    '#3d2115',
    '#4a2716',
    '#5a2d16',
    '#6e3417',
    '#853c18',
    '#a0461a',
    '#c0561e',
  ],
  sun: 'eclipse',
  far: (g, r) => {
    const c = '#241614',
      base = 220;
    for (let x = 0; x < 480; x += 60) {
      g.fillStyle = c;
      g.fillRect(x + 8, base - 70 - r() * 50, 12, 200);
      g.fillStyle = 'rgba(240,120,60,.5)';
      g.fillRect(x + 8, base - 125, 12, 3);
    }
    g.fillStyle = c;
    for (let x = 0; x < 480; x += 40) {
      g.beginPath();
      g.moveTo(x, base - 20);
      g.lineTo(x + 30, base - 44);
      g.lineTo(x + 30, base - 20);
      g.fill();
    }
    g.fillRect(0, base - 20, 480, 60);
    g.fillStyle = 'rgba(40,24,20,.55)';
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.arc(40 + i * 80 + r() * 20, 90 + r() * 30, 30 + r() * 20, 0, 7);
      g.fill();
    }
    windows(g, r, 0, base - 18, 480, 18, ['#f0a050', '#e0703f'], 0.2);
  },
  mid: (g, r) => {
    const beam = '#3a2520';
    for (const cx of [90, 330]) {
      g.fillStyle = beam;
      g.fillRect(cx, 60, 8, 200);
      for (let y = 64; y < 260; y += 12) {
        g.fillRect(cx - 3, y, 14, 2);
      }
      g.fillRect(cx - 60, 58, 170, 6);
      for (let x = cx - 60; x < cx + 110; x += 10) {
        g.fillRect(x, 64, 2, 6);
      }
      g.fillRect(cx + 90, 64, 2, 60);
      g.fillStyle = '#e8b24a';
      g.fillRect(cx + 86, 124, 10, 6);
    }
    for (let i = 0; i < 4; i++) {
      g.save();
      g.translate(60 + i * 120 + r() * 30, 150 + r() * 40);
      g.rotate((r() - 0.5) * 0.4);
      g.fillStyle = '#4a2e24';
      g.fillRect(-30, -4, 60, 8);
      g.fillStyle = '#e0703f';
      g.fillRect(-30, -4, 60, 2);
      g.restore();
    }
  },
  near: (g) => {
    g.fillStyle = '#1d1210';
    for (let x = 20; x < 480; x += 110) {
      g.fillRect(x, 150, 5, 82);
      g.fillRect(x + 40, 150, 5, 82);
      g.fillRect(x, 150, 45, 4);
      g.fillRect(x, 190, 45, 3);
      g.save();
      g.beginPath();
      g.rect(x, 150, 45, 82);
      g.clip();
      g.strokeStyle = '#1d1210';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x, 150);
      g.lineTo(x + 45, 232);
      g.stroke();
      g.restore();
      for (let k = 0; k < 5; k++) {
        g.fillStyle = k % 2 ? '#e8b24a' : '#1d1210';
        g.fillRect(x + 50 + k * 8, 222, 8, 10);
      }
    }
  },
  ground: {
    body: '#34323c',
    top: '#666b78',
    hi: '#9aa3ad',
    line: '#202028',
    accent: '#f08a3a',
    pattern: 'grate',
  },
  plat: { body: '#4a4852', top: '#8d97a3', trim: ['#e8b24a', '#1d1210'] },
  particle: 'sparks',
  mist: '200,120,80',
  pit: '#1a0c08',
  overlay: 'heat',
  gen: {
    seg: [360, 700],
    gap: [95, 140],
    heights: [460, 440, 420],
    plat: 0.75,
    platOff: [100, 140, 180, 220],
    moving: 0.15,
    hurdles: 0.6,
    towers: 0.35,
    metal: 0.55,
  },
};

// 2 인시: 대나무 숲과 산성 — 동트기 전, 호랑이가 사는 산
THEMES[2] = {
  name: '대숲 산성',
  sky: [
    '#0b1418',
    '#0e1a1f',
    '#112027',
    '#15272e',
    '#1a2f35',
    '#20383c',
    '#284243',
    '#324d49',
    '#3e5a50',
    '#4c6858',
    '#5d7760',
  ],
  sun: 'cold',
  far: (g, r) => {
    peaks(g, '#1f3434', 260, [
      [40, 150, 120],
      [170, 180, 150],
      [300, 160, 130],
      [430, 190, 140],
    ]);
    peaks(g, '#27403c', 260, [
      [100, 130, 90],
      [240, 150, 105],
      [380, 140, 95],
    ]);
    // 산등성이를 따라 쌓은 산성
    g.fillStyle = '#16262a';
    g.beginPath();
    g.moveTo(0, 200);
    for (let x = 0; x <= 480; x += 8) g.lineTo(x, 190 - Math.sin(x * 0.015) * 20);
    g.lineTo(480, 210);
    g.lineTo(0, 210);
    g.fill();
    for (let x = 0; x < 480; x += 8) g.fillRect(x, 184 - Math.sin(x * 0.015) * 20, 5, 6);
    g.fillStyle = 'rgba(200,230,220,.08)';
    g.fillRect(0, 200, 480, 70);
    void r;
  },
  mid: (g, r) => {
    for (let i = 0; i < 70; i++) {
      const x = r() * 480,
        h = 120 + r() * 120,
        w = 2 + ((r() * 3) | 0);
      g.fillStyle = r() < 0.5 ? '#1c3a2c' : '#23483a';
      g.fillRect(x, 270 - h, w, h);
      g.fillStyle = '#12281e';
      for (let y = 270 - h + 14; y < 270; y += 18) g.fillRect(x - 1, y, w + 2, 2);
      g.fillStyle = '#2c5a44';
      for (let k = 0; k < 3; k++) {
        const ly = 270 - h + r() * 40;
        g.fillRect(x + (r() < 0.5 ? -8 : w), ly, 8, 2);
      }
    }
  },
  near: (g, r) => {
    for (let i = 0; i < 14; i++) {
      const x = (i * 37 + r() * 20) % 480,
        w = 5 + ((r() * 3) | 0);
      g.fillStyle = '#0e1d16';
      g.fillRect(x, 60, w, 180);
      g.fillStyle = '#081210';
      for (let y = 80; y < 240; y += 26) g.fillRect(x - 1, y, w + 2, 3);
      g.fillStyle = '#12281e';
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.ellipse(x + (k % 2 ? 12 : -8), 70 + k * 30, 12, 3, k % 2 ? 0.4 : -0.4, 0, 7);
        g.fill();
      }
    }
    g.fillStyle = '#0a1612';
    for (let x = 0; x < 480; x += 30) g.fillRect(x, 228 - (x % 60 ? 4 : 0), 26, 12);
  },
  ground: {
    body: '#3b3326',
    top: '#566a36',
    hi: '#7f8f4c',
    line: '#2a241b',
    accent: '#9fbf5a',
    pattern: 'earth',
  },
  plat: { body: '#4a3f30', top: '#7f8f4c', trim: ['#2c5a44', '#c0452f'] },
  particle: 'leaves',
  mist: '190,220,210',
  pit: '#0a1210',
  gen: {
    seg: [300, 620],
    gap: [90, 130],
    heights: [460, 430, 400, 370],
    plat: 0.5,
    platOff: [100, 140, 180],
    moving: 0,
    hurdles: 0.35,
    stairs: 0.25,
  },
};

// 3 묘시: 달의 정원 — 새벽 연못과 계수나무, 그녀의 문
THEMES[3] = {
  name: '달의 정원',
  sky: [
    '#1b1433',
    '#241a3f',
    '#2f214a',
    '#3b2853',
    '#4a305b',
    '#5b3a61',
    '#6e4566',
    '#835168',
    '#9a5e69',
    '#b26d6a',
    '#c97f6c',
  ],
  sun: 'moon',
  far: (g, r) => {
    hills(g, 210, 14, '#3a2c55', r, 0.018);
    for (const [x, w] of [
      [80, 60],
      [200, 90],
      [350, 70],
    ]) {
      g.fillStyle = '#2e2346';
      g.fillRect(x, 170, w, 40);
      giwa(g, x - 4, 170, w + 8, '#241b38');
      windows(g, r, x, 172, w, 34, ['#f3e6c8'], 0.12);
    }
    g.fillStyle = 'rgba(220,210,240,.1)';
    g.fillRect(0, 210, 480, 60);
  },
  mid: (g, r) => {
    for (const x of [60, 250, 420]) {
      g.fillStyle = '#2a1f3c';
      g.fillRect(x - 4, 140, 8, 110);
      for (const [dx, dy, rr] of [
        [0, -8, 34],
        [-26, 10, 24],
        [26, 8, 26],
        [0, 20, 20],
      ]) {
        g.fillStyle = '#342650';
        g.beginPath();
        g.arc(x + dx, 140 + dy, rr, 0, 7);
        g.fill();
      }
      g.fillStyle = '#f3c46b';
      for (let k = 0; k < 10; k++) g.fillRect(x - 30 + r() * 60, 120 + r() * 40, 2, 2);
    }
    for (let i = 0; i < 8; i++) {
      const x = r() * 480,
        y = 40 + r() * 90;
      g.fillStyle = 'rgba(243,196,107,.25)';
      g.beginPath();
      g.arc(x, y, 6, 0, 7);
      g.fill();
      g.fillStyle = '#f3c46b';
      g.fillRect(x - 1, y - 1, 3, 3);
    }
  },
  near: (g) => {
    for (const x of [40, 190, 330, 450]) {
      g.fillStyle = '#231a33';
      g.fillRect(x - 4, 190, 8, 40);
      g.fillRect(x - 10, 182, 20, 10);
      g.fillRect(x - 12, 176, 24, 5);
      g.fillStyle = '#f3e6c8';
      g.fillRect(x - 5, 184, 10, 5);
      g.fillStyle = '#231a33';
      g.fillRect(x - 8, 172, 16, 4);
    }
    g.fillStyle = '#1b1428';
    for (let x = 0; x < 480; x += 7) g.fillRect(x, 214 - ((x * 13) % 16), 2, 20);
  },
  ground: {
    body: '#5b566c',
    top: '#c9c2d8',
    hi: '#efe9f6',
    line: '#3f3b52',
    accent: '#9ad7e8',
    pattern: 'stone',
  },
  plat: { body: '#7a7390', top: '#e8e2f2', trim: ['#9ad7e8', '#c0452f'] },
  particle: 'petals',
  mist: '220,210,240',
  pit: '#2a2f55',
  water: true,
  gen: {
    seg: [300, 560],
    gap: [130, 220],
    heights: [460],
    plat: 0.45,
    platOff: [110, 150],
    moving: 0.35,
    hurdles: 0,
    stepping: true,
  },
};

// 4 사시: 늪과 서낭당 — 뱀이 사는 곳
THEMES[4] = {
  name: '서낭당 늪',
  sky: [
    '#0c120c',
    '#101810',
    '#141e13',
    '#182416',
    '#1d2b19',
    '#23331c',
    '#2a3b1f',
    '#334522',
    '#3d4f25',
    '#495a29',
    '#56662e',
  ],
  sun: 'eclipse',
  far: (g, r) => {
    hills(g, 205, 10, '#1a2416', r, 0.02);
    for (let i = 0; i < 9; i++) {
      const x = r() * 480,
        h = 50 + r() * 50;
      g.strokeStyle = '#121a10';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x, 210);
      g.lineTo(x, 210 - h);
      g.stroke();
      g.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        const y = 210 - h + k * 14;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (k % 2 ? 14 : -14), y - 10);
        g.stroke();
      }
    }
    g.fillStyle = 'rgba(180,210,160,.12)';
    g.fillRect(0, 190, 480, 80);
  },
  mid: (g) => {
    // 서낭당 나무와 오색천
    for (const x of [120, 360]) {
      g.fillStyle = '#1a2214';
      g.fillRect(x - 8, 110, 16, 140);
      for (const [dx, dy, rr] of [
        [0, 0, 40],
        [-30, 20, 30],
        [30, 18, 32],
      ]) {
        g.beginPath();
        g.arc(x + dx, 100 + dy, rr, 0, 7);
        g.fill();
      }
      const cols = ['#c0452f', '#e8b24a', '#3a5fa0', '#f4efe3', '#2f8f7f'];
      g.strokeStyle = '#d6ccb6';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x - 30, 150);
      g.quadraticCurveTo(x, 162, x + 30, 150);
      g.stroke();
      for (let k = 0; k < 10; k++) {
        g.fillStyle = cols[k % 5];
        g.fillRect(x - 28 + k * 6, 153 + Math.sin(k) * 2, 3, 12 + (k % 3) * 4);
      }
      g.fillStyle = '#26301e';
      for (let k = 0; k < 3; k++) g.fillRect(x - 40 + k * 30, 238 - k * 4, 22, 12 + k * 4);
    }
  },
  near: (g) => {
    g.fillStyle = '#0e140c';
    for (let x = 0; x < 480; x += 5) {
      const h = 18 + ((x * 7) % 22);
      g.fillRect(x, 232 - h, 2, h);
    }
    for (const x of [60, 250, 430]) {
      for (let k = 0; k < 4; k++) {
        g.fillStyle = k % 2 ? '#2a3322' : '#1e261a';
        g.fillRect(x - 12 + k * 2, 220 - k * 8, 24 - k * 4, 8);
      }
    }
  },
  ground: {
    body: '#2c3125',
    top: '#4b6532',
    hi: '#6f8f45',
    line: '#1d2118',
    accent: '#b5c94a',
    pattern: 'moss',
  },
  plat: { body: '#3a3a2a', top: '#6f8f45', trim: ['#b5c94a', '#2a3322'] },
  particle: 'fireflies',
  mist: '160,200,140',
  pit: '#15241a',
  water: true,
  gen: {
    seg: [300, 600],
    gap: [110, 170],
    heights: [460, 450],
    plat: 0.5,
    platOff: [100, 130],
    moving: 0.25,
    hurdles: 0.3,
    stepping: true,
  },
};

// 5 오시: 한낮의 초원과 성벽 — 개마무사가 달리는 벌판
THEMES[5] = {
  name: '성벽 아래 벌판',
  sky: [
    '#3a2a1f',
    '#4a3424',
    '#5c3f29',
    '#6f4a2d',
    '#825631',
    '#956236',
    '#a86e3c',
    '#b97b44',
    '#c8894d',
    '#d49658',
    '#dea464',
  ],
  sun: 'bright',
  far: (g, r) => {
    hills(g, 200, 18, '#8a6a40', r, 0.012);
    hills(g, 215, 12, '#7a5c36', r, 0.02);
    g.fillStyle = 'rgba(255,230,180,.12)';
    g.fillRect(0, 180, 480, 90);
  },
  mid: (g) => {
    // 고구려 성벽과 깃발
    g.fillStyle = '#5a4430';
    g.fillRect(0, 170, 480, 80);
    g.fillStyle = '#4a3624';
    for (let y = 178; y < 250; y += 10)
      for (let x = (y / 10) % 2 ? 0 : 12; x < 480; x += 24) g.fillRect(x, y, 22, 1);
    g.fillStyle = '#5a4430';
    for (let x = 0; x < 480; x += 16) g.fillRect(x, 162, 10, 10);
    for (const x of [40, 160, 280, 400]) {
      g.fillStyle = '#3a2a1a';
      g.fillRect(x, 110, 2, 56);
      g.fillStyle = x % 80 ? '#c0452f' : '#2f8f7f';
      g.fillRect(x + 2, 112, 20, 14);
      g.fillRect(x + 2, 126, 14, 6);
    }
    for (const x of [100, 340]) {
      g.fillStyle = '#4a3624';
      g.fillRect(x - 18, 130, 36, 40);
      giwa(g, x - 22, 130, 44, '#2a1d14');
    }
  },
  near: (g) => {
    g.fillStyle = '#6a5228';
    for (let x = 0; x < 480; x += 3) {
      const h = 10 + ((x * 11) % 16);
      g.fillRect(x, 236 - h, 2, h);
    }
    g.fillStyle = '#3a2a1a';
    for (let x = 20; x < 480; x += 90) {
      g.fillRect(x, 200, 4, 36);
      g.fillRect(x + 36, 200, 4, 36);
      g.fillRect(x, 206, 40, 3);
      g.fillRect(x, 218, 40, 3);
    }
  },
  ground: {
    body: '#5a4630',
    top: '#a8843f',
    hi: '#d4b06a',
    line: '#3a2d1f',
    accent: '#c0452f',
    pattern: 'earth',
  },
  plat: { body: '#6a5236', top: '#d4b06a', trim: ['#c0452f', '#2f8f7f'] },
  particle: 'dust',
  mist: '240,210,160',
  pit: '#2a1c10',
  gen: {
    seg: [700, 1100],
    gap: [100, 125],
    heights: [460, 450],
    plat: 0.35,
    platOff: [110, 150],
    moving: 0,
    hurdles: 1.1,
  },
};

// 6 미시: 구름 위 산사 — 졸린 도사의 문
THEMES[6] = {
  name: '구름 위 산사',
  sky: [
    '#2a2440',
    '#342c4c',
    '#3e3558',
    '#4a3f63',
    '#57496d',
    '#655477',
    '#746080',
    '#846d88',
    '#957b8f',
    '#a78a97',
    '#b99aa0',
  ],
  sun: 'eclipse',
  far: (g, r) => {
    for (const [x, h] of [
      [70, 90],
      [210, 120],
      [360, 100],
    ]) {
      peaks(g, '#4a3f63', 210, [[x, 70, h]]);
      pagoda(g, x, 210 - h + 6, 3, '#e8e2f2', '#3a2e4a');
    }
    g.fillStyle = '#d8d0e4';
    for (let i = 0; i < 26; i++) {
      g.beginPath();
      g.arc(r() * 480, 205 + r() * 20, 16 + r() * 14, 0, 7);
      g.fill();
    }
    g.fillRect(0, 215, 480, 60);
  },
  mid: (g) => {
    for (const [x, y] of [
      [110, 130],
      [340, 100],
    ]) {
      island(g, x, y + 40, 150, '#e8e2f2', '#6a6080');
      g.fillStyle = '#f4efe3';
      g.fillRect(x - 40, y + 10, 80, 30);
      g.fillStyle = '#c0452f';
      for (let k = 0; k < 5; k++) g.fillRect(x - 38 + k * 18, y + 10, 3, 30);
      giwa(g, x - 48, y + 10, 96, '#3a2e4a');
      giwa(g, x - 30, y - 6, 60, '#3a2e4a');
      g.strokeStyle = '#e8b24a';
      g.lineWidth = 1;
      for (const dx of [-46, 46]) {
        g.beginPath();
        g.moveTo(x + dx, y + 12);
        g.lineTo(x + dx, y + 20);
        g.stroke();
        g.fillStyle = '#e8b24a';
        g.fillRect(x + dx - 2, y + 20, 4, 4);
      }
    }
  },
  near: (g, r) => {
    g.fillStyle = 'rgba(248,244,252,.85)';
    for (let i = 0; i < 18; i++) {
      g.beginPath();
      g.arc((i * 29 + r() * 20) % 480, 236 + r() * 12, 14 + r() * 12, 0, 7);
      g.fill();
    }
  },
  ground: {
    body: '#8a86a0',
    top: '#e0dcea',
    hi: '#ffffff',
    line: '#6a6680',
    accent: '#f3c46b',
    pattern: 'cloud',
  },
  plat: { body: '#a8a2bc', top: '#ffffff', trim: ['#f3c46b', '#c0452f'] },
  particle: 'fluff',
  mist: '245,240,250',
  pit: '#cfc8dc',
  gen: {
    seg: [250, 460],
    gap: [120, 170],
    heights: [460, 420, 380],
    plat: 0.8,
    platOff: [110, 150, 190],
    moving: 0.45,
    hurdles: 0,
    towers: 0.2,
  },
};

// 7 신시: 해 질 녘 장터 — 광대 원숭이의 놀이판
THEMES[7] = {
  name: '남사당 장터',
  sky: [
    '#221428',
    '#2c1830',
    '#381c36',
    '#45203a',
    '#53253d',
    '#622a3e',
    '#72303d',
    '#84373b',
    '#973f38',
    '#aa4935',
    '#bd5533',
  ],
  sun: 'eclipse',
  far: (g, r) => {
    for (let x = 0; x < 480; x += 34) {
      const h = 24 + r() * 22,
        w = 30;
      g.fillStyle = '#2a1626';
      g.fillRect(x, 212 - h, w, h + 60);
      giwa(g, x, 212 - h, w, '#1c0e1a');
      windows(g, r, x, 214 - h, w, h, ['#f3c46b', '#e0703f'], 0.25);
    }
  },
  mid: (g) => {
    lanterns(g, 0, 60, 160, 50, 6, 20);
    lanterns(g, 160, 50, 320, 66, 6, 22);
    lanterns(g, 320, 66, 480, 54, 6, 18);
    g.strokeStyle = '#d6ccb6';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(40, 110);
    g.lineTo(440, 104);
    g.stroke();
    g.fillStyle = '#1c0e1a';
    g.fillRect(40, 104, 3, 150);
    g.fillRect(438, 98, 3, 150);
    for (const x of [120, 250, 380]) {
      g.fillStyle = ['#c0452f', '#2f8f7f', '#e8b24a'][x % 3];
      g.beginPath();
      g.moveTo(x, 70);
      g.lineTo(x + 16, 76);
      g.lineTo(x, 82);
      g.fill();
      g.fillStyle = '#1c0e1a';
      g.fillRect(x - 1, 66, 2, 40);
    }
  },
  near: (g) => {
    for (const x of [10, 130, 250, 370]) {
      g.fillStyle = '#1c0e1a';
      g.fillRect(x, 180, 4, 52);
      g.fillRect(x + 90, 180, 4, 52);
      for (let k = 0; k < 6; k++) {
        g.fillStyle = k % 2 ? '#c0452f' : '#f4efe3';
        g.beginPath();
        g.moveTo(x - 4 + k * 17, 176);
        g.lineTo(x + 13 + k * 17, 176);
        g.lineTo(x + 13 + k * 17, 190);
        g.lineTo(x + 4 + k * 17, 194);
        g.lineTo(x - 4 + k * 17, 190);
        g.fill();
      }
      g.fillStyle = '#2a1626';
      g.fillRect(x + 8, 214, 80, 18);
      g.fillStyle = '#e8b24a';
      for (let k = 0; k < 5; k++) g.fillRect(x + 14 + k * 14, 208, 8, 6);
    }
  },
  ground: {
    body: '#4a3222',
    top: '#8a5a36',
    hi: '#b07a4a',
    line: '#2e1f15',
    accent: '#e8b24a',
    pattern: 'plank',
  },
  plat: { body: '#6a4430', top: '#b07a4a', trim: ['#c0452f', '#f4efe3'] },
  particle: 'confetti',
  mist: '240,170,130',
  pit: '#1c0c14',
  gen: {
    seg: [420, 800],
    gap: [95, 130],
    heights: [460, 440],
    plat: 0.9,
    platOff: [100, 140, 180],
    moving: 0.1,
    hurdles: 0.5,
    ropes: 0.3,
  },
};

// 8 유시: 노을 속 송신탑 — 전령 닭의 확성기
THEMES[8] = {
  name: '노을 송신탑',
  sky: [
    '#1c0c14',
    '#2a0f18',
    '#3a131b',
    '#4c171d',
    '#5f1c1e',
    '#73221f',
    '#882a20',
    '#9d3321',
    '#b23e22',
    '#c64b24',
    '#d85a27',
  ],
  sun: 'redsun',
  far: (g, r) => {
    for (let x = 0; x < 480; x += 26) {
      const h = 20 + r() * 40;
      g.fillStyle = '#2a0e12';
      g.fillRect(x, 215 - h, 24, h + 60);
      windows(g, r, x, 217 - h, 24, h, ['#f3c46b'], 0.15);
    }
  },
  mid: (g) => {
    for (const [x, h] of [
      [70, 190],
      [260, 230],
      [420, 170],
    ]) {
      g.strokeStyle = '#1c080c';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x - 20, 270);
      g.lineTo(x, 270 - h);
      g.lineTo(x + 20, 270);
      g.stroke();
      for (let y = 270 - h + 10; y < 270; y += 14) {
        const w = (20 * (270 - y)) / h;
        g.beginPath();
        g.moveTo(x - w, y);
        g.lineTo(x + w, y + 14);
        g.moveTo(x + w, y);
        g.lineTo(x - w, y + 14);
        g.stroke();
      }
      g.fillStyle = '#ff5a3a';
      g.fillRect(x - 2, 266 - h, 4, 4);
    }
    g.strokeStyle = '#1c080c';
    g.lineWidth = 1;
    for (const y of [120, 130]) {
      g.beginPath();
      g.moveTo(0, y);
      g.quadraticCurveTo(160, y + 20, 260, y - 40);
      g.quadraticCurveTo(360, y + 10, 480, y - 10);
      g.stroke();
    }
  },
  near: (g) => {
    for (const x of [30, 190, 350]) {
      g.fillStyle = '#14060a';
      g.fillRect(x, 110, 5, 130);
      g.fillRect(x - 12, 118, 30, 3);
      g.fillStyle = '#9aa3ad';
      g.beginPath();
      g.moveTo(x + 18, 124);
      g.lineTo(x + 34, 116);
      g.lineTo(x + 34, 136);
      g.lineTo(x + 18, 128);
      g.fill();
    }
    g.fillStyle = '#14060a';
    for (let x = 0; x < 480; x += 60) {
      g.fillRect(x, 206, 56, 30);
      giwa(g, x, 206, 56, '#0c0406');
      g.fillRect(x + 26, 180, 2, 26);
    }
  },
  ground: {
    body: '#3a2626',
    top: '#7a4a3a',
    hi: '#a86a50',
    line: '#241616',
    accent: '#f3c46b',
    pattern: 'grate',
  },
  plat: { body: '#5a3a30', top: '#a86a50', trim: ['#f3c46b', '#14060a'] },
  particle: 'embers',
  mist: '240,140,110',
  pit: '#1c0808',
  gen: {
    seg: [360, 700],
    gap: [95, 140],
    heights: [460, 440, 420],
    plat: 0.75,
    platOff: [100, 150, 200, 250],
    moving: 0.15,
    hurdles: 0.3,
    towers: 0.5,
  },
};

// 9 술시: 밤의 순라길 — 삽살개가 지키는 성곽
THEMES[9] = {
  name: '순라길 성곽',
  sky: [
    '#070a18',
    '#0a0e20',
    '#0d1228',
    '#101630',
    '#131a38',
    '#161e40',
    '#1a2348',
    '#1e2850',
    '#232e58',
    '#283460',
    '#2d3a68',
  ],
  sun: 'cold',
  far: (g, r) => {
    stars(g, r, 70, 150);
    for (let x = 0; x < 480; x += 22) {
      const h = 30 + r() * 60;
      g.fillStyle = '#0c1022';
      g.fillRect(x, 215 - h, 20, h + 60);
      windows(g, r, x, 217 - h, 20, h, ['#f3e27a', '#9ad7e8'], 0.22);
    }
  },
  mid: (g) => {
    g.fillStyle = '#1a1e30';
    g.fillRect(0, 175, 480, 80);
    g.fillStyle = '#12151f';
    for (let y = 183; y < 255; y += 10)
      for (let x = (y / 10) % 2 ? 0 : 10; x < 480; x += 20) g.fillRect(x, y, 18, 1);
    g.fillStyle = '#1a1e30';
    for (let x = 0; x < 480; x += 14) g.fillRect(x, 168, 9, 8);
    for (const x of [90, 330]) {
      g.fillStyle = '#1a1e30';
      g.fillRect(x - 22, 120, 44, 56);
      giwa(g, x - 28, 120, 56, '#0c0e18');
      g.fillStyle = '#f3e27a';
      g.fillRect(x - 6, 134, 12, 8);
    }
  },
  near: (g) => {
    g.fillStyle = '#0a0c16';
    for (const x of [40, 220, 400]) {
      g.fillRect(x, 190, 40, 44);
      giwa(g, x - 4, 190, 48, '#05060c');
      g.fillStyle = '#f3e27a';
      g.fillRect(x + 14, 202, 10, 8);
      g.fillStyle = '#0a0c16';
    }
    for (let x = 0; x < 480; x += 36) {
      g.fillRect(x + 100, 220, 4, 14);
      g.fillRect(x + 96, 222, 12, 3);
    }
  },
  ground: {
    body: '#262a3a',
    top: '#474e68',
    hi: '#6a7090',
    line: '#171a26',
    accent: '#f3e27a',
    pattern: 'brick',
  },
  plat: { body: '#353a52', top: '#6a7090', trim: ['#f3e27a', '#0a0c16'] },
  particle: 'snow',
  mist: '150,170,220',
  pit: '#05060e',
  overlay: 'searchlight',
  gen: {
    seg: [380, 720],
    gap: [95, 135],
    heights: [460, 420, 380],
    plat: 0.6,
    platOff: [100, 150],
    moving: 0,
    hurdles: 0.7,
    towers: 0.25,
  },
};

// 10 해시: 부잣집 곳간과 금고 — 돼지의 문
THEMES[10] = {
  name: '황금 곳간',
  sky: [
    '#140c18',
    '#1c1020',
    '#261428',
    '#301830',
    '#3a1c34',
    '#452236',
    '#502836',
    '#5c3034',
    '#683a30',
    '#74462c',
    '#80542a',
  ],
  sun: 'eclipse',
  far: (g, r) => {
    for (let i = 0; i < 8; i++) {
      const x = 30 + i * 60 + r() * 20,
        h = 40 + r() * 50;
      g.fillStyle = '#4a3418';
      g.beginPath();
      g.moveTo(x - 40, 230);
      g.quadraticCurveTo(x, 230 - h * 2, x + 40, 230);
      g.fill();
      g.fillStyle = '#d4a93a';
      for (let k = 0; k < 8; k++) g.fillRect(x - 20 + r() * 40, 230 - r() * h, 3, 2);
    }
    g.fillStyle = '#3a2814';
    g.beginPath();
    g.arc(380, 150, 56, 0, 7);
    g.fill();
    g.strokeStyle = '#d4a93a';
    g.lineWidth = 3;
    g.stroke();
    g.lineWidth = 2;
    for (let a = 0; a < 8; a++) {
      g.beginPath();
      g.moveTo(380, 150);
      g.lineTo(380 + Math.cos(a * 0.785) * 40, 150 + Math.sin(a * 0.785) * 40);
      g.stroke();
    }
    g.fillStyle = '#d4a93a';
    g.beginPath();
    g.arc(380, 150, 10, 0, 7);
    g.fill();
  },
  mid: (g) => {
    for (const [x, w] of [
      [40, 120],
      [230, 150],
      [420, 100],
    ]) {
      g.fillStyle = '#3a2418';
      g.fillRect(x - w / 2, 150, w, 90);
      giwa(g, x - w / 2 - 6, 150, w + 12, '#1c1008');
      g.fillStyle = '#5a3a20';
      for (let k = 0; k < w - 20; k += 22) g.fillRect(x - w / 2 + 10 + k, 176, 16, 30);
      g.fillStyle = '#e8b24a';
      g.fillRect(x - 6, 190, 12, 4);
    }
    g.fillStyle = '#2a1a10';
    for (let x = 0; x < 480; x += 20) g.fillRect(x, 232, 18, 10);
  },
  near: (g) => {
    for (let i = 0; i < 7; i++) {
      const x = 30 + i * 72;
      g.strokeStyle = '#8a6a2a';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 60 + (i % 3) * 20);
      g.stroke();
      for (let k = 0; k < 5; k++) {
        g.fillStyle = '#d4a93a';
        g.beginPath();
        g.arc(x, 30 + k * 8 + (i % 3) * 20, 3, 0, 7);
        g.fill();
        g.fillStyle = '#3a2418';
        g.fillRect(x - 1, 29 + k * 8 + (i % 3) * 20, 2, 2);
      }
    }
    g.fillStyle = '#b8862f';
    for (const x of [60, 200, 360]) {
      g.beginPath();
      g.moveTo(x - 30, 236);
      g.quadraticCurveTo(x, 196, x + 30, 236);
      g.fill();
    }
  },
  ground: {
    body: '#4a3418',
    top: '#c9992f',
    hi: '#f6dfa0',
    line: '#2a1c0c',
    accent: '#fff6d8',
    pattern: 'gold',
  },
  plat: { body: '#6a4a20', top: '#f6dfa0', trim: ['#d4a93a', '#3a2418'] },
  particle: 'gold',
  mist: '240,200,120',
  pit: '#140a06',
  gen: {
    seg: [360, 700],
    gap: [95, 135],
    heights: [460, 440, 420, 400],
    plat: 0.6,
    platOff: [100, 140, 180],
    moving: 0.1,
    hurdles: 0.4,
    stairs: 0.45,
    metal: 0.4,
  },
};

// 11 진시: 폭풍 속 용궁 폐허 — 마지막 문
THEMES[11] = {
  name: '폭풍의 용궁',
  sky: [
    '#07050d',
    '#0b0814',
    '#100b1c',
    '#150e24',
    '#1a112c',
    '#1f1434',
    '#25183c',
    '#2b1c44',
    '#32204c',
    '#392554',
    '#402a5c',
  ],
  sun: 'crimson',
  far: (g, r) => {
    for (let i = 0; i < 30; i++) {
      g.fillStyle = r() < 0.5 ? '#1c1430' : '#241a3c';
      g.beginPath();
      g.ellipse(r() * 480, 60 + r() * 120, 40 + r() * 50, 10 + r() * 14, 0, 0, 7);
      g.fill();
    }
    g.strokeStyle = 'rgba(191,245,236,.35)';
    g.lineWidth = 1;
    g.beginPath();
    let x = 120,
      y = 20;
    g.moveTo(x, y);
    for (let k = 0; k < 8; k++) {
      x += (r() - 0.5) * 30;
      y += 18;
      g.lineTo(x, y);
    }
    g.stroke();
  },
  mid: (g) => {
    for (const [x, y, w] of [
      [90, 150, 130],
      [260, 110, 170],
      [420, 160, 110],
    ]) {
      island(g, x, y, w, '#4fa89a', '#241c34');
      g.fillStyle = '#2e5a54';
      for (let k = -2; k <= 2; k++)
        g.fillRect(x + k * (w / 6) - 3, y - 36 + Math.abs(k) * 6, 6, 36 - Math.abs(k) * 6);
      giwa(g, x - w / 3, y - 40, (w * 2) / 3, '#12221f');
      g.fillStyle = '#e8b24a';
      g.fillRect(x - 2, y - 52, 4, 10);
    }
    g.strokeStyle = 'rgba(79,209,193,.6)';
    g.lineWidth = 2;
    for (const x of [170, 350]) {
      g.beginPath();
      g.moveTo(x, 0);
      for (let y = 0; y < 140; y += 8) g.lineTo(x + (y % 16 ? 3 : -3), y);
      g.stroke();
    }
  },
  near: (g) => {
    for (const [x, h] of [
      [30, 90],
      [160, 60],
      [300, 110],
      [440, 70],
    ]) {
      g.fillStyle = '#12221f';
      g.fillRect(x, 236 - h, 16, h);
      g.fillStyle = '#1f3a36';
      g.fillRect(x + 2, 236 - h, 3, h);
      g.fillStyle = '#12221f';
      g.beginPath();
      g.moveTo(x - 4, 236 - h);
      g.lineTo(x + 8, 226 - h);
      g.lineTo(x + 20, 236 - h);
      g.fill();
    }
  },
  ground: {
    body: '#1f3a36',
    top: '#3f8a7e',
    hi: '#8ff0de',
    line: '#12221f',
    accent: '#e8b24a',
    pattern: 'jade',
  },
  plat: { body: '#2a4a44', top: '#8ff0de', trim: ['#e8b24a', '#12221f'] },
  particle: 'rain',
  mist: '150,130,200',
  pit: '#05040a',
  overlay: 'lightning',
  gen: {
    seg: [260, 480],
    gap: [120, 175],
    heights: [460, 430, 400],
    plat: 0.65,
    platOff: [110, 150, 190],
    moving: 0.4,
    hurdles: 0.2,
    towers: 0.2,
  },
};

// ---- 배경 캔버스 캐시 ----
export interface Backdrop {
  sky: HTMLCanvasElement;
  far: HTMLCanvasElement;
  mid: HTMLCanvasElement;
  near: HTMLCanvasElement;
}
const cache = new Map<number, Backdrop>();
export function buildBackdrop(i: number, fallback: Backdrop): Backdrop {
  if (i === 0) return fallback;
  const hit = cache.get(i);
  if (hit) return hit;
  const T = THEMES[i],
    seed = 1000 + i * 97;
  const b: Backdrop = {
    sky: canvas(480, 270, (g) => {
      const r = mkRng(seed);
      bands(g, T.sky);
      if (i === 2 || i === 9 || i === 11 || i === 4) stars(g, r, 40);
      if (T.sun !== 'redsun') sun(g, T.sun);
      else sun(g, 'redsun');
    }),
    far: canvas(480, 270, (g) => T.far(g, mkRng(seed + 1))),
    mid: canvas(480, 270, (g) => T.mid(g, mkRng(seed + 2))),
    near: canvas(480, 270, (g) => T.near(g, mkRng(seed + 3))),
  };
  cache.set(i, b);
  return b;
}

// ---- 대기 입자 ----
interface P {
  x: number;
  y: number;
  s: number;
  ph: number;
  c: number;
}
const R0 = mkRng(77);
const parts: P[] = Array.from({ length: 70 }, () => ({
  x: R0() * 960,
  y: R0() * 540,
  s: 0.5 + R0(),
  ph: R0() * 9,
  c: R0(),
}));
const CONF = ['#c0452f', '#e8b24a', '#2f8f7f', '#f4efe3', '#3a5fa0'];
export function drawParticles(
  ctx: CanvasRenderingContext2D,
  type: Particle,
  dt: number,
  t: number,
  W: number,
  H: number,
) {
  const wrap = (q: P) => {
    if (q.y > H + 8) {
      q.y = -8;
      q.x = R0() * W;
    }
    if (q.y < -8) {
      q.y = H + 8;
      q.x = R0() * W;
    }
    if (q.x < -8) q.x = W + 8;
    if (q.x > W + 8) q.x = -8;
  };
  const n = type === 'rain' ? 70 : type === 'fireflies' ? 26 : 44;
  for (let i = 0; i < n; i++) {
    const q = parts[i];
    switch (type) {
      case 'sparks':
        q.y -= 90 * q.s * dt;
        q.x += Math.sin(t * 3 + q.ph) * 20 * dt;
        ctx.fillStyle = q.c < 0.5 ? '#ffb060' : '#ff7a3a';
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 12 + q.ph);
        ctx.fillRect(q.x | 0, q.y | 0, 2, 2);
        break;
      case 'leaves':
        q.y += 40 * q.s * dt;
        q.x -= 30 * q.s * dt;
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(t * 2 + q.ph);
        ctx.fillStyle = q.c < 0.5 ? '#6f9a4a' : '#9fbf5a';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-3, -1, 6, 2);
        ctx.restore();
        break;
      case 'petals':
        q.y += 26 * q.s * dt;
        q.x += Math.sin(t + q.ph) * 24 * dt;
        ctx.fillStyle = q.c < 0.5 ? '#f3e6f0' : '#e6d8f0';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(q.x | 0, q.y | 0, 3, 2);
        break;
      case 'fireflies':
        q.x += Math.sin(t * 0.8 + q.ph) * 18 * dt;
        q.y += Math.cos(t * 0.7 + q.ph * 1.3) * 14 * dt;
        ctx.globalAlpha = Math.max(0, Math.sin(t * 2 + q.ph));
        ctx.fillStyle = 'rgba(220,240,120,.3)';
        ctx.beginPath();
        ctx.arc(q.x, q.y, 5, 0, 7);
        ctx.fill();
        ctx.fillStyle = '#e6f58a';
        ctx.fillRect(q.x - 1, q.y - 1, 2, 2);
        break;
      case 'dust':
        q.x += 50 * q.s * dt;
        q.y += Math.sin(t + q.ph) * 6 * dt;
        ctx.fillStyle = '#e8d0a0';
        ctx.globalAlpha = 0.35;
        ctx.fillRect(q.x | 0, q.y | 0, 2, 1);
        break;
      case 'fluff':
        q.y += 14 * q.s * dt;
        q.x += Math.sin(t * 0.6 + q.ph) * 16 * dt;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(q.x | 0, q.y | 0, 3, 3);
        break;
      case 'confetti':
        q.y += 40 * q.s * dt;
        q.x += Math.sin(t * 2 + q.ph) * 20 * dt;
        ctx.fillStyle = CONF[(q.c * 5) | 0];
        ctx.globalAlpha = 0.8;
        ctx.fillRect(q.x | 0, q.y | 0, 3, 2);
        break;
      case 'gold':
        q.y += 18 * q.s * dt;
        ctx.globalAlpha = 0.4 + 0.6 * Math.max(0, Math.sin(t * 5 + q.ph));
        ctx.fillStyle = '#f6dfa0';
        ctx.fillRect(q.x | 0, q.y | 0, 2, 2);
        break;
      case 'snow':
        q.y += 30 * q.s * dt;
        q.x += Math.sin(t * 0.9 + q.ph) * 10 * dt;
        ctx.fillStyle = '#dde6ff';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(q.x | 0, q.y | 0, 2, 2);
        break;
      case 'rain':
        q.y += 620 * q.s * dt;
        q.x -= 120 * q.s * dt;
        ctx.strokeStyle = 'rgba(160,190,230,.45)';
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x + 4, q.y - 14);
        ctx.stroke();
        break;
      default:
        q.y -= 50 * q.s * dt;
        q.x += Math.sin(t * 2 + q.ph) * 10 * dt;
        ctx.globalAlpha = 0.5 + Math.sin(t * 6 + q.ph) * 0.4;
        ctx.fillStyle = q.ph > 6 ? '#f3c46b' : '#e0703f';
        ctx.fillRect(q.x | 0, q.y | 0, 2, 2);
    }
    wrap(q);
  }
  ctx.globalAlpha = 1;
}

// ---- 화면 덮개 연출 ----
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  o: Theme['overlay'],
  t: number,
  W: number,
  H: number,
) {
  if (o === 'lightning') {
    const k = Math.sin(t * 0.7) * Math.sin(t * 2.3);
    if (k > 0.93) {
      ctx.fillStyle = `rgba(200,230,255,${(k - 0.93) * 4})`;
      ctx.fillRect(0, 0, W, H);
    }
  } else if (o === 'searchlight') {
    for (const [cx, sp, ph] of [
      [240, 0.5, 0],
      [720, 0.38, 2],
    ]) {
      const a = -Math.PI / 2 + Math.sin(t * sp + ph) * 0.7;
      const g = ctx.createLinearGradient(cx, 300, cx + Math.cos(a) * 520, 300 + Math.sin(a) * 520);
      g.addColorStop(0, 'rgba(243,226,122,.18)');
      g.addColorStop(1, 'rgba(243,226,122,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx, 300);
      ctx.lineTo(cx + Math.cos(a - 0.09) * 560, 300 + Math.sin(a - 0.09) * 560);
      ctx.lineTo(cx + Math.cos(a + 0.09) * 560, 300 + Math.sin(a + 0.09) * 560);
      ctx.closePath();
      ctx.fill();
    }
  } else if (o === 'heat') {
    ctx.fillStyle = `rgba(255,120,50,${0.05 + 0.03 * Math.sin(t * 3)})`;
    ctx.fillRect(0, H - 180, W, 180);
  }
}

// ---- 구덩이와 안개 ----
export function drawPitMist(ctx: CanvasRenderingContext2D, T: Theme, t: number, W: number, H: number) {
  ctx.fillStyle = T.pit;
  ctx.fillRect(0, 470, W, H - 470);
  if (T.water) {
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(0, 486, W, 2);
    for (let x = 0; x < W; x += 24) {
      const y = 494 + Math.sin(t * 1.6 + x * 0.05) * 3;
      ctx.fillStyle = 'rgba(220,235,255,.18)';
      ctx.fillRect(x, y | 0, 12, 1);
    }
  } else {
    ctx.fillStyle = 'rgba(79,209,193,.08)';
    for (let x = 0; x < W; x += 6) {
      const h = 6 + ((x * 37) % 23);
      ctx.fillRect(x, H - h, 2, h);
    }
  }
  for (let k = 0; k < 4; k++) {
    ctx.fillStyle = `rgba(${T.mist},${0.06 + k * 0.03})`;
    const by = 418 + k * 22;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8)
      ctx.lineTo(x, Math.round((by + Math.sin(x * 0.018 + t * (0.6 + k * 0.25) + k * 1.7) * 5) / 2) * 2);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }
}

// ---- 지형 한 조각 그리기 ----
export interface Solid {
  x: number;
  y: number;
  w: number;
  h: number;
  metal?: boolean;
  move?: unknown;
  rope?: boolean;
}
const n2 = (a: number) => {
  const s = Math.sin(a * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};
// 고정된 지형은 무늬를 매 프레임 다시 그리지 않고, 처음 한 번 그린 캔버스를 재사용한다.
// 넓은 땅 조각(수천 px)의 무늬를 프레임마다 그리는 게 느린 기기에서 렉의 가장 큰 원인이었다.
const solidCache = new WeakMap<Solid, { cv: HTMLCanvasElement; T: Theme; w: number }>();
export function drawSolid(ctx: CanvasRenderingContext2D, s: Solid, x: number, T: Theme, t: number) {
  if (s.move || s.rope) return drawSolidRaw(ctx, s, x, T, t);
  let c = solidCache.get(s);
  if (!c || c.T !== T || c.w !== s.w) {
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(s.w));
    cv.height = Math.max(1, Math.ceil(s.h + 8));
    const g = cv.getContext('2d')!;
    g.translate(0, 8 - s.y);
    drawSolidRaw(g, s, 0, T, 0);
    c = { cv, T, w: s.w };
    solidCache.set(s, c);
  }
  ctx.drawImage(c.cv, Math.round(x), s.y - 8);
}
function drawSolidRaw(ctx: CanvasRenderingContext2D, s: Solid, x: number, T: Theme, t: number) {
  const y = s.y,
    G = T.ground,
    P = T.plat;
  if (s.rope) {
    ctx.strokeStyle = '#d6ccb6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.quadraticCurveTo(x + s.w / 2, y + 6, x + s.w, y + 2);
    ctx.stroke();
    ctx.fillStyle = '#2a1626';
    ctx.fillRect(x - 4, y - 6, 6, 80);
    ctx.fillRect(x + s.w - 2, y - 6, 6, 80);
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = P.trim[k % P.trim.length];
      ctx.fillRect(x + s.w * (0.2 + k * 0.2), y + 4, 4, 7);
    }
    return;
  }
  if (s.h < 40) {
    if (s.move) {
      ctx.fillStyle = 'rgba(191,245,236,.18)';
      ctx.fillRect(x + 6, y + s.h, s.w - 12, 8);
    }
    if (T.ground.pattern === 'cloud') {
      ctx.fillStyle = P.body;
      ctx.fillRect(x + 4, y + 6, s.w - 8, s.h - 6);
      ctx.fillStyle = P.top;
      for (let xx = 8; xx < s.w - 4; xx += 14) {
        ctx.beginPath();
        ctx.arc(x + xx, y + 6, 9, 0, 7);
        ctx.fill();
      }
      return;
    }
    ctx.fillStyle = P.body;
    ctx.fillRect(x, y, s.w, s.h);
    ctx.fillStyle = P.top;
    ctx.fillRect(x, y, s.w, 3);
    // 얇은 발판은 윗면 바로 아래에 작은 단청 띠를 둔다
    const ty = s.h >= 20 ? y + s.h - 9 : y + 5,
      th = s.h >= 20 ? 5 : 4;
    for (let i = 0, xx = x + 3; xx < x + s.w - 3; xx += 8, i++) {
      ctx.fillStyle = P.trim[i % P.trim.length];
      ctx.fillRect(xx, ty, 6, th);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, s.w - 3, s.h - 3);
    return;
  }
  ctx.fillStyle = G.body;
  ctx.fillRect(x, y, s.w, s.h);
  const wx = s.x;
  switch (G.pattern) {
    case 'grate':
      ctx.fillStyle = G.line;
      for (let xx = 6; xx < s.w; xx += 12) ctx.fillRect(x + xx, y + 12, 3, s.h);
      ctx.fillStyle = G.hi;
      for (let xx = 10; xx < s.w; xx += 36)
        for (let yy = y + 20; yy < y + s.h; yy += 26) ctx.fillRect(x + xx, yy, 3, 3);
      ctx.globalAlpha = 0.5 + 0.35 * Math.sin(t * 2 + wx * 0.01);
      ctx.fillStyle = G.accent;
      ctx.fillRect(x, y + 11, s.w, 2);
      ctx.globalAlpha = 1;
      break;
    case 'earth':
    case 'moss':
      for (let k = 0; k < s.w / 9; k++) {
        const px = n2(wx + k) * s.w,
          py = 16 + n2(wx + k * 3.1) * (s.h - 20);
        ctx.fillStyle = k % 3 ? G.line : G.top;
        ctx.fillRect(x + px, y + py, 3, 2);
      }
      if (G.pattern === 'moss') {
        ctx.fillStyle = G.accent;
        for (let xx = 4; xx < s.w; xx += 11) ctx.fillRect(x + xx, y + 10, 2, 4 + ((wx + xx) % 9));
      }
      break;
    case 'stone':
      ctx.fillStyle = G.line;
      for (let yy = y + 12, r = 0; yy < y + s.h; yy += 30, r++) {
        ctx.fillRect(x, yy, s.w, 2);
        for (let xx = r % 2 ? 0 : 24; xx < s.w; xx += 48) ctx.fillRect(x + xx, yy, 2, 30);
      }
      break;
    case 'jade':
      ctx.strokeStyle = G.accent;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      for (let xx = -40; xx < s.w; xx += 28) {
        ctx.beginPath();
        ctx.moveTo(x + xx, y + 12);
        ctx.lineTo(x + xx + 28, y + s.h);
        ctx.moveTo(x + xx + 28, y + 12);
        ctx.lineTo(x + xx, y + s.h);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 2 + wx * 0.02);
      ctx.fillStyle = G.hi;
      ctx.fillRect(x, y + 11, s.w, 1);
      ctx.globalAlpha = 1;
      break;
    case 'cloud':
      ctx.fillStyle = G.top;
      for (let xx = 0; xx < s.w; xx += 18) {
        ctx.beginPath();
        ctx.arc(x + xx + 9, y + 8, 12, 0, 7);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      for (let yy = y + 30; yy < y + s.h; yy += 26) ctx.fillRect(x + 6, yy, s.w - 12, 3);
      return;
    case 'plank':
      ctx.fillStyle = G.line;
      for (let xx = 0; xx < s.w; xx += 18) ctx.fillRect(x + xx, y + 12, 2, s.h);
      ctx.fillStyle = G.accent;
      for (let xx = 8; xx < s.w; xx += 18) {
        ctx.fillRect(x + xx, y + 18, 2, 2);
        ctx.fillRect(x + xx, y + 60, 2, 2);
      }
      break;
    case 'gold':
      for (let yy = y + 16; yy < y + s.h; yy += 14)
        for (let xx = (yy / 14) % 2 ? 0 : 7; xx < s.w; xx += 14) {
          ctx.fillStyle = G.top;
          ctx.beginPath();
          ctx.arc(x + xx + 7, yy, 6, 0, 7);
          ctx.fill();
          ctx.fillStyle = G.line;
          ctx.fillRect(x + xx + 5, yy - 2, 4, 4);
        }
      ctx.globalAlpha = Math.max(0, Math.sin(t * 3 + wx)) * 0.6;
      ctx.fillStyle = G.accent;
      ctx.fillRect(x + ((t * 60) % s.w), y + 14, 3, 3);
      ctx.globalAlpha = 1;
      break;
    default: // brick
      ctx.fillStyle = G.line;
      for (let yy = y + 14, r = 0; yy < y + s.h; yy += 22, r++) {
        ctx.fillRect(x, yy, s.w, 2);
        for (let xx = r % 2 ? 0 : 28; xx < s.w; xx += 56) ctx.fillRect(x + xx, yy, 2, 22);
      }
      if (G.circuit) {
        ctx.fillStyle = 'rgba(79,209,193,.75)';
        ctx.fillRect(x, y + 11, s.w, 1);
        for (let xx = 60 - (wx % 120); xx < s.w - 20; xx += 120) {
          ctx.globalAlpha = 0.45 + 0.4 * Math.sin(t * 2 + (wx + xx) * 0.05);
          ctx.fillRect(x + xx, y + 12, 2, 26);
          ctx.fillRect(x + xx, y + 38, 22, 2);
          ctx.fillRect(x + xx + 20, y + 38, 2, 18);
          ctx.fillRect(x + xx + 17, y + 54, 8, 6);
          ctx.globalAlpha = 1;
        }
      }
  }
  ctx.fillStyle = G.top;
  ctx.fillRect(x, y, s.w, 10);
  ctx.fillStyle = G.hi;
  ctx.fillRect(x, y, s.w, 2);
  if (G.pattern === 'earth' || G.pattern === 'moss') {
    ctx.fillStyle = G.hi;
    for (let xx = 3; xx < s.w; xx += 7) ctx.fillRect(x + xx, y - 3 - ((wx + xx) % 3), 1, 4);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1.5, y + 1.5, s.w - 3, s.h - 3);
}
