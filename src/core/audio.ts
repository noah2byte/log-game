// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { $ } from './state';
import { ZZFX } from 'zzfx';

export function initAudioPrefs() {
  try {
    $.SND.on = localStorage.getItem('log-sound') !== 'off';
  } catch (e) {}
}

export const SFX = {
  jump: [0.35, 0.05, 420, 0.01, 0.02, 0.08, 0, 1.6, 12],
  slash: [0.45, 0.05, 700, 0.01, 0.02, 0.12, 3, 2.2, -18, 0, 0, 0, 0, 0.4],
  hit: [0.6, 0.05, 160, 0.01, 0.03, 0.12, 4, 2, -6, 0, 0, 0, 0, 0.6],
  kill: [0.55, 0.05, 300, 0.01, 0.05, 0.25, 1, 1.5, -10, 0, 0, 0, 0, 0.2, 0, 0, 0.08],
  soul: [0.3, 0.02, 880, 0.01, 0.02, 0.12, 0, 1.8, 40],
  hurt: [0.7, 0.05, 120, 0.01, 0.08, 0.25, 3, 2.4, -4, 0, 0, 0, 0, 0.7],
  lamp: [0.25, 0.02, 520, 0.05, 0.1, 0.3, 0, 1, 4],
  stomp: [0.6, 0.05, 240, 0, 0.02, 0.1, 1, 1.8, -30],
  boss: [0.8, 0.05, 90, 0.08, 0.4, 0.8, 2, 1.5, -2, 0, 0, 0, 0.2, 0.4],
  gate: [0.5, 0.02, 330, 0.05, 0.3, 0.6, 0, 1.2, 0, 0, 160, 0.1],
  pickup: [0.5, 0.02, 660, 0.02, 0.1, 0.3, 0, 1.6, 0, 0, 220, 0.08],
  arrow: [0.4, 0.05, 900, 0.01, 0.02, 0.1, 0, 1.8, -60],
  shock: [0.7, 0.05, 70, 0.02, 0.1, 0.4, 4, 2, -2, 0, 0, 0, 0, 0.8],
  select: [0.3, 0.02, 600, 0.01, 0.02, 0.05, 0, 1.5],
  steal: [0.55, 0.05, 500, 0.01, 0.05, 0.2, 2, 1.8, 20],
};

// ZzFX는 소리를 낼 때마다 파형을 새로 계산한다. 느린 기기에서는 이 계산이 프레임을 멈추게 해서(렉),
// 같은 소리는 한 번 만든 파형을 재사용하고, 소리가 켜지는 순간 조금씩 미리 만들어 둔다.
const SAMPLE_CACHE = new Map();
function playCached(key, params) {
  let smp = SAMPLE_CACHE.get(key);
  if (!smp) {
    smp = ZZFX.buildSamples(...params);
    SAMPLE_CACHE.set(key, smp);
  }
  ZZFX.playSamples([smp]);
}
function noteParams(mode, n) {
  const boss = mode === 'boss',
    cut = mode === 'cut';
  const base = boss ? 147 : cut ? 220 : 196,
    f = base * Math.pow(2, n / 12);
  return [
    boss ? 0.12 : 0.1,
    0,
    f,
    0.005,
    0.04,
    boss ? 0.35 : 1.1,
    1,
    1.2,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.12,
    0.6,
    0.2,
  ];
}
const DRUM = [0.18, 0, 55, 0.005, 0.02, 0.14, 4, 2, -3, 0, 0, 0, 0, 0.3];
function prewarm() {
  const jobs = [];
  for (const [k, v] of Object.entries(SFX)) jobs.push([k, v]);
  for (const m of ['stage', 'boss', 'cut']) for (const n of PENTA) jobs.push([m + n, noteParams(m, n)]);
  jobs.push(['drum', DRUM]);
  const next = () => {
    const j = jobs.shift();
    if (!j) return;
    if (!SAMPLE_CACHE.has(j[0])) SAMPLE_CACHE.set(j[0], ZZFX.buildSamples(...j[1].map((v) => v)));
    setTimeout(next, 30);
  };
  setTimeout(next, 30);
}
export function sfx(n) {
  if (!$.SND.on || !SFX[n]) return;
  try {
    playCached(n, SFX[n]);
  } catch (e) {}
}

export const MUS = {
  mode: 'off',
  timer: 0,
  drone: null,
};

export function music(m) {
  MUS.mode = m;
  MUS.timer = 0;
}

export function audioUnlock() {
  try {
    const ac = ZZFX.audioContext;
    if (ac.state !== 'running') ac.resume();
    if (!MUS.drone) {
      prewarm();
      const g = ac.createGain();
      g.gain.value = 0;
      g.connect(ac.destination);
      for (const f of [55, 82.4]) {
        const o = ac.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        o.connect(g);
        o.start();
      }
      MUS.drone = g;
    }
  } catch (e) {}
}

export const PENTA = [0, 2, 5, 7, 9, 12, 14, 17];

export function updateMusic(dt) {
  if (MUS.drone) {
    const tgt = $.SND.on && MUS.mode !== 'off' ? (MUS.mode === 'boss' ? 0.05 : 0.035) : 0;
    MUS.drone.gain.value += (tgt - MUS.drone.gain.value) * Math.min(1, dt * 2);
  }
  if (!$.SND.on || MUS.mode === 'off' || !MUS.drone) return;
  MUS.timer -= dt;
  if (MUS.timer > 0) return;
  const boss = MUS.mode === 'boss',
    cut = MUS.mode === 'cut';
  const n = PENTA[Math.floor(Math.random() * PENTA.length)];
  try {
    playCached(MUS.mode + n, noteParams(MUS.mode, n));
    if (boss && Math.random() < 0.6) playCached('drum', DRUM);
  } catch (e) {}
  MUS.timer = boss
    ? 0.18 + Math.random() * 0.12
    : cut
      ? 0.9 + Math.random() * 0.9
      : 0.5 + Math.random() * 0.6;
}

export function toggleSound() {
  $.SND.on = !$.SND.on;
  try {
    localStorage.setItem('log-sound', $.SND.on ? 'on' : 'off');
  } catch (e) {}
}
// ---- 타이틀 ----
