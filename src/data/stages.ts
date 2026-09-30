// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.

export const ALTAR = {
  x: 390,
  y: 460,
};

export // ---- 스테이지: 요괴 구간 → 보스 방 ----
const STAGES = [
  {
    k: 'rat',
    t: '자시(子時)',
    sub: '쥐의 문을 지키는 도둑',
    name: '자(子) · 도둑 쥐',
    tint: 'rgba(20,12,60,.22)',
    plat: [
      [190, 362, 140],
      [640, 362, 140],
      [410, 264, 120],
    ],
  },
  {
    k: 'ox',
    t: '축시(丑時)',
    sub: '소의 문을 지키는 장수',
    name: '축(丑) · 철갑 소',
    tint: 'rgba(16,10,50,.26)',
    pool: ['choraeng', 'yangban', 'bulga', 'changgwi', 'wisp'],
    plat: [
      [190, 362, 140],
      [630, 362, 140],
    ],
  },
  {
    k: 'tiger',
    t: '인시(寅時)',
    sub: '호랑이의 문을 지키는 장군',
    name: '인(寅) · 호랑이 장군',
    tint: 'rgba(40,20,70,.18)',
    pool: ['changgwi', 'jangsan', 'dueok', 'yangban', 'wisp'],
    plat: [
      [170, 362, 140],
      [410, 264, 140],
      [640, 362, 140],
    ],
  },
  {
    k: 'rabbit',
    t: '묘시(卯時)',
    sub: '그녀가 지키는 문',
    name: '묘(卯) · 달토끼',
    tint: 'rgba(150,80,60,.12)',
    pool: ['eodug', 'ghost', 'imae', 'choraeng'],
    plat: [
      [200, 362, 140],
      [620, 362, 140],
    ],
  },
  {
    k: 'snake',
    t: '사시(巳時)',
    sub: '뱀의 문을 지키는 서생',
    name: '사(巳) · 비단 뱀',
    tint: 'rgba(180,120,60,.08)',
    pool: ['imae', 'dueok', 'wisp', 'choraeng', 'eodug'],
  },
  {
    k: 'horse',
    t: '오시(午時)',
    sub: '말의 문을 지키는 개마무사',
    name: '오(午) · 개마무사',
    tint: 'rgba(220,170,90,.1)',
    pool: ['jangsan', 'choraeng', 'changgwi', 'yangban', 'bulga'],
  },
  {
    k: 'sheep',
    t: '미시(未時)',
    sub: '양의 문을 지키는 잠든 도사',
    name: '미(未) · 졸린 도사',
    tint: 'rgba(200,150,90,.08)',
    pool: ['eodug', 'yangban', 'ghost', 'imae', 'wisp'],
  },
  {
    k: 'monkey',
    t: '신시(申時)',
    sub: '원숭이의 문을 지키는 광대',
    name: '신(申) · 광대 원숭이',
    tint: 'rgba(190,110,60,.12)',
    pool: ['ghost', 'choraeng', 'dueok', 'jangsan', 'eodug'],
  },
  {
    k: 'rooster',
    t: '유시(酉時)',
    sub: '닭의 문을 지키는 전령',
    name: '유(酉) · 전령 닭',
    tint: 'rgba(170,60,40,.16)',
    pool: ['changgwi', 'yangban', 'choraeng', 'wisp', 'dueok'],
  },
  {
    k: 'dog',
    t: '술시(戌時)',
    sub: '개의 문을 지키는 순라군',
    name: '술(戌) · 순라군 삽살개',
    tint: 'rgba(90,30,70,.2)',
    pool: ['jangsan', 'bulga', 'dueok', 'changgwi', 'ghost'],
  },
  {
    k: 'pig',
    t: '해시(亥時)',
    sub: '돼지의 문을 지키는 부자',
    name: '해(亥) · 부자 돼지',
    tint: 'rgba(30,14,60,.26)',
    pool: ['bulga', 'yangban', 'eodug', 'choraeng', 'jangsan'],
  },
  {
    k: 'dragon',
    t: '진시(辰時)',
    sub: '모든 문의 끝, 금관을 쓴 용',
    name: '진(辰) · 금관의 용',
    tint: 'rgba(60,0,40,.24)',
    pool: ['yangban', 'choraeng', 'imae', 'eodug', 'jangsan', 'bulga', 'dueok', 'changgwi', 'wisp', 'ghost'],
  },
];

export const GB_PLAT = [
  [190, 362, 140],
  [630, 362, 140],
  [410, 264, 140],
];
// 첫 스테이지는 손으로 배치한 레벨을 그대로 쓴다

export // 첫 스테이지는 손으로 배치한 레벨을 그대로 쓴다
const STAGE0 = {
  solids: [
    [0, 460, 900, 80],
    [1000, 460, 700, 80],
    [1820, 460, 500, 80],
    [2450, 460, 1300, 80],
    [560, 362, 160, 12],
    [780, 290, 140, 12],
    [1250, 362, 180, 12],
    [1500, 280, 140, 12],
    [1720, 362, 120, 12],
    [2100, 362, 160, 12],
    [2350, 264, 120, 12],
    [2620, 362, 180, 12, 1],
    [2900, 280, 160, 12],
    [3150, 362, 200, 12],
  ],
  enemies: [
    ['changgwi', 640, 460, 470, 880],
    ['choraeng', 850, 290, 790, 910],
    ['yangban', 1180, 460, 1040, 1380],
    ['eodug', 1560, 460, 1420, 1690],
    ['dueok', 1340, 362],
    ['imae', 1960, 460, 1850, 2080],
    ['jangsan', 2240, 460],
    ['dueok', 2180, 362],
    ['bulga', 2530, 460, 2480, 3000],
    ['eodug', 3100, 460, 3010, 3200],
    ['changgwi', 3320, 460, 3150, 3440],
    ['wisp', 1010, 330],
    ['wisp', 1790, 300],
    ['wisp', 2560, 270],
    ['ghost', 2400, 430],
    ['ghost', 3500, 430],
  ],
  clues: [
    [840, 250],
    [1330, 322],
    [1570, 240],
    [2170, 322],
    [2410, 224],
    [2970, 240],
    [3240, 322],
  ],
  cks: [1060, 1860, 2500, 3060],
  x0: 3740,
};

export const WALKERS = ['yangban', 'choraeng', 'imae', 'eodug', 'changgwi', 'jangsan', 'bulga'];
