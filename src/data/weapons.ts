// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.

export const TIERS = [
  {
    n: '빈 칼자루',
    min: 0,
    len: 0,
    dmg: 0,
  },
  {
    n: '넋 단검',
    min: 1,
    len: 46,
    dmg: 1,
  },
  {
    n: '넋 장검',
    min: 4,
    len: 70,
    dmg: 1,
  },
  {
    n: '넋 대검',
    min: 8,
    len: 94,
    dmg: 2,
  },
  {
    n: '천넋검',
    min: 13,
    len: 116,
    dmg: 3,
    wave: true,
  },
];

export function tierOf(n) {
  let r = 0;
  TIERS.forEach((q, i) => {
    if (n >= q.min) r = i;
  });
  return r;
}
// ---- 보스: 자(子) 도둑 쥐 ----

export // ---- 무기: 넋칼 / 넋창 / 넋활 ----
const WEAP = {
  sword: {
    n: '넋칼',
    icon: 0,
  },
  spear: {
    n: '넋창',
    icon: 1,
  },
  bow: {
    n: '넋활',
    icon: 2,
  },
};

export const REWARD = {
  horse: 'spear',
  tiger: 'bow',
};
