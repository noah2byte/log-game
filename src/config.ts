// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.

export const ANIM = {
  idle: [0, 1],
  walk: [2, 3, 4, 5, 6],
  jump: [7],
  fall: [8],
  hurt: [9],
};

export const S = 0.5;

export const W = 960;

export const H = 540;

export const MAXHP = 5;

export const PAL = {
  ink: '#120c18',
  verm: '#c0452f',
  gold: '#e8b24a',
  teal: '#4fd1c1',
  teal2: '#2f8f7f',
  stone: '#3a2e44',
  stone2: '#6d5877',
  stone3: '#9c83a3',
  night: '#2b1f3f',
  ember: '#d9824a',
};

export const DEBUG = /[?&]debug/.test(location.search);

// ---- input ----

export // ---- player ----
const HB = {
  w: 34,
  h: 78,
};

export const G = 2300;

export const RUN = 270;

export const ACC = 1900;

export const DEC = 2200;

export const AIR = 1300;

export const JV = 760;

export const SW = 0.24;

export const AS = (0.5 * 172) / 212 / 0.6;

export const DS = 0.6;
