// @ts-nocheck — 단일 파일 PoC에서 모듈로 옮긴 코드. 타입은 점진적으로 붙인다.
import { H, PAL, W } from '../config';
import { music, sfx, toggleSound } from '../core/audio';
import { continueGame, loadSave } from '../core/save';
import { $ } from '../core/state';
import { STAGES } from '../data/stages';
import { ctx } from '../render/canvas';
import { startCut } from '../story/cutscene';
import { SCENES } from '../story/intro';
import { drawLayer, far, mid, near, sky, vignette } from '../world/background';
import { newGame } from '../world/stages';

export function menuItems() {
  const s = loadSave(),
    it = [];
  if (s && s.stage > 0)
    it.push({
      label: `이어하기 · 제${s.stage + 1}문 ${STAGES[Math.min(11, s.stage)].t}`,
      act: () => {
        $.mode = 'game';
        continueGame();
      },
    });
  it.push({
    label: '새로 시작',
    act: () => {
      music('cut');
      startCut(SCENES, () => {
        $.mode = 'game';
        $.IN = null;
        newGame();
      });
    },
  });
  it.push({
    label: '도입 영상 보기',
    act: () => {
      music('cut');
      startCut(SCENES, () => {
        $.mode = 'title';
        $.IN = null;
        music('cut');
      });
    },
  });
  it.push({
    label: `소리 · ${$.SND.on ? '켜짐' : '꺼짐'}`,
    act: () => toggleSound(),
  });
  return it;
}

export function renderTitle() {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sky, 0, 0, W, H);
  drawLayer(far, 0.07, $.t * 20, 4);
  drawLayer(mid, 0.22, $.t * 20, -30);
  drawLayer(near, 0.5, $.t * 20, -4);
  ctx.drawImage(vignette, 0, 0);
  ctx.fillStyle = 'rgba(13,9,21,.35)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f6dfa0';
  ctx.font = '72px "Gowun Batang", serif';
  ctx.fillText('로그', W / 2, 170);
  ctx.fillStyle = '#cdbff0';
  ctx.font = '24px "Gowun Batang", serif';
  ctx.fillText('열두 시진의 문', W / 2, 210);
  const it = menuItems();
  $.menuSel = Math.min($.menuSel, it.length - 1);
  it.forEach((m, i) => {
    const y = 290 + i * 44,
      on = i === $.menuSel;
    if (on) {
      ctx.fillStyle = 'rgba(232,178,74,.16)';
      ctx.fillRect(W / 2 - 190, y - 26, 380, 38);
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(W / 2 - 190, y - 26, 4, 38);
    }
    ctx.fillStyle = on ? '#f6dfa0' : '#e8dcc0';
    ctx.font = '21px "Gowun Dodum", sans-serif';
    ctx.fillText(m.label, W / 2, y);
  });
  const s = loadSave();
  ctx.fillStyle = 'rgba(232,220,192,.6)';
  ctx.font = '14px "Gowun Dodum", sans-serif';
  ctx.fillText(
    s && s.cleared ? '열두 개의 문을 모두 열었다' : '↑↓ 선택 · Space 결정 · 화면을 눌러도 된다',
    W / 2,
    H - 30,
  );
  ctx.textAlign = 'left';
}

export function titleKey(code) {
  const it = menuItems();
  if (code === 'ArrowUp' || code === 'KeyW') {
    $.menuSel = ($.menuSel + it.length - 1) % it.length;
    sfx('select');
  }
  if (code === 'ArrowDown' || code === 'KeyS') {
    $.menuSel = ($.menuSel + 1) % it.length;
    sfx('select');
  }
  if (['Space', 'Enter', 'KeyZ'].includes(code)) {
    sfx('pickup');
    it[$.menuSel].act();
  }
}

export function titleClick(x, y) {
  const it = menuItems();
  it.forEach((m, i) => {
    const yy = 290 + i * 44;
    if (Math.abs(y - (yy - 7)) < 20 && Math.abs(x - W / 2) < 190) {
      $.menuSel = i;
      sfx('pickup');
      m.act();
    }
  });
}
