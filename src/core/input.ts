// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { pop } from '../combat/damage';
import { DEBUG, H, W } from '../config';
import { audioUnlock, music, toggleSound } from './audio';
import { $ } from './state';
import { WEAP } from '../data/weapons';
import { hurt } from '../entities/player';
import { cv } from '../render/canvas';
import { endIntro, introNext } from '../story/cutscene';
import { titleClick, titleKey } from '../ui/title';
import { restartStage, warpStage } from '../world/stages';

export // ---- input ----
const keys = {
  left: false,
  right: false,
  jump: false,
  lamp: false,
  slash: false,
};

export const KM = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Space: 'jump',
  ArrowUp: 'jump',
  KeyW: 'jump',
  KeyX: 'lamp',
  KeyJ: 'lamp',
  KeyZ: 'slash',
  KeyK: 'slash',
};

export function initInput() {
  addEventListener('keydown', (e) => {
    audioUnlock();
    if ($.mode === 'title') {
      if (['ArrowUp', 'ArrowDown', 'Space', 'Enter'].includes(e.code)) e.preventDefault();
      titleKey(e.code);
      return;
    }
    if (e.code === 'KeyM') {
      toggleSound();
      return;
    }
    if ($.mode === 'intro') {
      if (['Space', 'Enter', 'KeyZ', 'ArrowRight', 'KeyX'].includes(e.code)) {
        e.preventDefault();
        introNext();
      }
      if (e.code === 'Escape') endIntro();
      return;
    }
    if (e.code === 'Escape' && $.mode === 'game') {
      $.mode = 'title';
      music('cut');
      return;
    }
    const WK = {
      Digit1: 0,
      Digit2: 1,
      Digit3: 2,
      Digit4: 3,
      Digit5: 4,
      Digit6: 5,
      Digit7: 6,
      Digit8: 7,
      Digit9: 8,
      Digit0: 9,
      Minus: 10,
      Equal: 11,
    };
    if (DEBUG && e.code in WK) {
      warpStage(WK[e.code]);
      return;
    }
    if (DEBUG && e.code === 'BracketRight') {
      $.p.x = $.ARENA.x0 - 60;
      $.p.y = 460;
      return;
    }
    if (e.code === 'KeyC' && $.sword && $.sword.weps.length > 1) {
      $.sword.wi = ($.sword.wi + 1) % $.sword.weps.length;
      pop($.p.x, $.p.y - 110, WEAP[$.sword.weps[$.sword.wi]].n);
      return;
    }
    const k = KM[e.code];
    if (k) {
      e.preventDefault();
      if (k === 'jump' && !keys.jump) $.jumpPressedAt = $.t;
      keys[k] = true;
    }
    if (DEBUG && e.code === 'KeyH') hurt($.p.face, false);
    if (DEBUG && e.code === 'KeyD') $.debug = !$.debug;
    if (e.code === 'KeyR') {
      if ($.done && $.STAGE === 11 && $.ARENA.done) {
        $.mode = 'title';
        music('cut');
      } else restartStage();
    }
  });
  addEventListener('keyup', (e) => {
    const k = KM[e.code];
    if (k) {
      keys[k] = false;
    }
  });
  cv.addEventListener('pointerdown', (e) => {
    audioUnlock();
    const r = cv.getBoundingClientRect(),
      x = ((e.clientX - r.left) / r.width) * W,
      y = ((e.clientY - r.top) / r.height) * H;
    if ($.mode === 'title') {
      titleClick(x, y);
      return;
    }
    if ($.mode !== 'intro') return;
    if (x > W - 170 && y > H - 46) endIntro();
    else introNext();
  });
}
// ---- player ----
