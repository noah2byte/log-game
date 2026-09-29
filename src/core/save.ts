// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { $ } from './state';
import { loadStageWhenReady, loadStage, newGame } from '../world/stages';

export // ---- 저장 ----
const SAVE_KEY = 'log-12gates-save-v1';

export function saveGame(stage) {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        v: 1,
        stage,
        souls: $.sword.souls,
        weps: $.sword.weps,
        mem: $.memTotal,
        cleared: !!(loadSave() || {}).cleared,
      }),
    );
  } catch (e) {}
}

export function loadSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  } catch (e) {
    return null;
  }
}

export function markCleared() {
  try {
    const s = loadSave() || {};
    s.cleared = true;
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch (e) {}
}

export function continueGame() {
  const s = loadSave();
  if (!s) return newGame();
  $.sword = {
    has: true,
    souls: s.souls || 0,
    swing: 0,
    cd: 0,
    hit: new Set(),
    weps: s.weps || ['sword'],
    wi: 0,
  };
  $.memTotal = s.mem || 0;
  loadStageWhenReady(Math.min(11, s.stage || 0));
}
// ---- 소리: ZzFX 효과음 + 생성형 배경음 ----
