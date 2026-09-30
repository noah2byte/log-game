// 진입점: 에셋을 불러온 뒤 고정 시간 간격(1/120초)으로 게임을 갱신하고 매 프레임 그린다.
// 물리를 고정 간격으로 돌리는 이유: 화면 주사율(60/120/144Hz)과 상관없이 점프 높이·판정이 같아야 하기 때문이다.
import './style.css';

// 다른 페이지(블로그 게임 탭)의 iframe 안에서 열렸는지 표시한다. 스타일이 페이지 장식을 숨긴다
if (window.self !== window.top) document.documentElement.classList.add('embed');
import { $ } from './core/state';
import { loadAssets } from './core/assets';
import { buildPlayerSprite, ensureSprites, spritesForStage, preloadRest } from './render/sprites';
import { ctx } from './render/canvas';
import { W, H } from './config';
import { initInput } from './core/input';
import { initAudioPrefs, music, updateMusic } from './core/audio';
import { renderTitle } from './ui/title';
import { updateIntro, renderIntro } from './story/cutscene';
import { step } from './entities/player';
import { render } from './render/world';
import { initTouch, updateTouchVisibility, isTouchDevice } from './core/touch';
import { DEBUG } from './config';
import { warpStage } from './world/stages';
import { damage } from './combat/damage';
import { loadSave } from './core/save';

const FIXED_DT = 1 / 120;
let last = performance.now();
let acc = 0;

/** 에셋을 받는 동안 보여주는 화면 */
function drawLoading(n: number, m: number): void {
  ctx.fillStyle = '#0d0915';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f6dfa0';
  ctx.font = '40px "Gowun Batang", serif';
  ctx.fillText('로그', W / 2, H / 2 - 40);
  ctx.fillStyle = '#cdbff0';
  ctx.font = '16px "Gowun Dodum", sans-serif';
  ctx.fillText('문을 여는 중…', W / 2, H / 2);
  ctx.fillStyle = '#3a2e44';
  ctx.fillRect(W / 2 - 150, H / 2 + 24, 300, 8);
  ctx.fillStyle = '#4fd1c1';
  ctx.fillRect(W / 2 - 150, H / 2 + 24, (300 * n) / Math.max(1, m), 8);
  ctx.textAlign = 'left';
}

function loop(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  updateMusic(dt);
  updateTouchVisibility();
  if ($.mode === 'loading') {
    drawLoading($.loading ? $.loading.n : 0, $.loading ? $.loading.m : 1);
  } else if ($.mode === 'title') {
    $.t += dt;
    renderTitle();
  } else if ($.mode === 'intro') {
    $.t += dt;
    updateIntro(dt);
    if ($.mode === 'intro' && $.IN) renderIntro();
  } else {
    acc += dt;
    while (acc >= FIXED_DT) {
      step(FIXED_DT);
      acc -= FIXED_DT;
    }
    render();
  }
  requestAnimationFrame(loop);
}

/** PC 전체 화면: 오른쪽 위 버튼과 F 키. 모바일은 터치 조작 쪽에 같은 기능이 있다 */
function initFullscreen(stage: HTMLElement): void {
  if (!document.fullscreenEnabled) return; // 전체 화면이 허용되지 않은 iframe 등에서는 버튼을 만들지 않는다
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };
  if (!isTouchDevice()) {
    const b = document.createElement('button');
    b.className = 'fs-btn';
    b.type = 'button';
    b.title = '전체 화면 (F)';
    b.textContent = '⛶';
    b.addEventListener('click', toggle);
    stage.append(b);
  }
  addEventListener('keydown', (e) => {
    if (e.code === 'KeyF' && !e.repeat) toggle();
  });
}

async function boot(): Promise<void> {
  initAudioPrefs();
  drawLoading(0, 1);
  const { atlas } = await loadAssets();
  buildPlayerSprite(atlas);
  // 첫 화면에 필요한 것(제1문 요괴, 도입 영상의 토끼)만 먼저 받고 나머지는 뒤에서 받는다
  const core = [...new Set([...spritesForStage(0), 'rabbit'])];
  await ensureSprites(core, (n: number, m: number) => drawLoading(n, m));
  preloadRest();
  initInput();
  initTouch(document.querySelector('.stage') as HTMLElement);
  initFullscreen(document.querySelector('.stage') as HTMLElement);
  $.mode = 'title';
  music('cut');
  last = performance.now();
  requestAnimationFrame(loop);
}

// ?debug 로 열면 콘솔과 자동 테스트에서 상태를 들여다볼 수 있게 노출한다.
if (DEBUG) (window as unknown as { __game: unknown }).__game = { $, warpStage, damage, loadSave };

boot();
