// 모바일 터치 조작.
// - 가로 화면: 버튼을 게임 화면 위 양쪽 아래에 반투명하게 겹친다(왼손 방향, 오른손 행동). 휴대용 게임기와 같은 배치라 손이 익숙하다
// - 세로 화면: 게임 화면이 작아 버튼을 겹치면 화면을 가리므로, 화면 아래에 큰 버튼으로 둔다
// - 방향 버튼은 하나의 영역에서 손가락 위치로 좌우를 판단한다. 버튼 두 개로 나누면 손가락을 미끄러뜨려 방향을 바꿀 때 입력이 끊기기 때문이다
// - 여러 손가락을 동시에 추적한다(달리면서 점프하고 베기)
import { $ } from './state';
import { keys } from './input';
import { audioUnlock, toggleSound, music } from './audio';
import { WEAP } from '../data/weapons';
import { pop } from '../combat/damage';

type Key = 'left' | 'right' | 'jump' | 'slash' | 'lamp';

export function isTouchDevice(): boolean {
  // 주 입력이 손가락인 기기만. 터치스크린 노트북처럼 마우스가 주 입력인 PC에는 버튼을 띄우지 않는다
  return (
    matchMedia('(pointer: coarse)').matches ||
    ('ontouchstart' in window && !matchMedia('(pointer: fine)').matches)
  );
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text) e.textContent = text;
  return e;
}

export function initTouch(stage: HTMLElement): void {
  if (!isTouchDevice()) return;
  document.documentElement.classList.add('touch');

  const root = el('div', 'tc');
  const dpad = el('div', 'tc-dpad');
  const lBtn = el('span', 'tc-arrow', '◀');
  const rBtn = el('span', 'tc-arrow', '▶');
  dpad.append(lBtn, rBtn);
  const acts = el('div', 'tc-acts');
  const mk = (k: Key | 'weapon', label: string, cls = '') => {
    const b = el('button', 'tc-btn ' + cls, label);
    b.type = 'button';
    b.dataset.k = k;
    acts.append(b);
    return b;
  };
  mk('weapon', '무기', 'tc-small');
  mk('lamp', '랜턴', 'tc-small');
  mk('slash', '베기');
  mk('jump', '점프', 'tc-big');
  root.append(dpad, acts);

  const sys = el('div', 'tc-sys');
  const fsBtn = el('button', 'tc-sysbtn', '⛶');
  fsBtn.title = '전체 화면';
  const sndBtn = el('button', 'tc-sysbtn', $.SND.on ? '🔊' : '🔈');
  const homeBtn = el('button', 'tc-sysbtn', '☰');
  homeBtn.title = '타이틀로';
  if (!document.fullscreenEnabled) fsBtn.style.display = 'none'; // iPhone Safari는 전체 화면 API를 지원하지 않는다
  sys.append(fsBtn, sndBtn, homeBtn);

  const hint = el('div', 'tc-rotate', '가로로 돌리면 화면이 커진다');
  stage.append(root, sys);
  stage.after(hint);

  // ---- 방향 영역: 손가락 위치로 좌우 판단 ----
  const dirOf = (x: number) => {
    const r = dpad.getBoundingClientRect();
    return x < r.left + r.width / 2 ? 'left' : 'right';
  };
  const dpadPointers = new Map<number, 'left' | 'right'>();
  const syncDpad = () => {
    const v = [...dpadPointers.values()];
    keys.left = v.includes('left');
    keys.right = v.includes('right');
    lBtn.classList.toggle('on', keys.left);
    rBtn.classList.toggle('on', keys.right);
  };
  dpad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    audioUnlock();
    dpad.setPointerCapture(e.pointerId);
    dpadPointers.set(e.pointerId, dirOf(e.clientX));
    syncDpad();
  });
  dpad.addEventListener('pointermove', (e) => {
    if (!dpadPointers.has(e.pointerId)) return;
    dpadPointers.set(e.pointerId, dirOf(e.clientX));
    syncDpad();
  });
  const dpadEnd = (e: PointerEvent) => {
    dpadPointers.delete(e.pointerId);
    syncDpad();
  };
  dpad.addEventListener('pointerup', dpadEnd);
  dpad.addEventListener('pointercancel', dpadEnd);

  // ---- 행동 버튼 ----
  acts.querySelectorAll<HTMLButtonElement>('.tc-btn').forEach((b) => {
    const k = b.dataset.k as Key | 'weapon';
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      audioUnlock();
      b.setPointerCapture(e.pointerId);
      b.classList.add('on');
      if (k === 'weapon') {
        if ($.sword && $.sword.weps.length > 1) {
          $.sword.wi = ($.sword.wi + 1) % $.sword.weps.length;
          pop($.p.x, $.p.y - 110, (WEAP as Record<string, { n: string }>)[$.sword.weps[$.sword.wi]].n);
        }
        return;
      }
      if (k === 'jump' && !keys.jump) $.jumpPressedAt = $.t;
      keys[k] = true;
    });
    const off = () => {
      b.classList.remove('on');
      if (k !== 'weapon') keys[k] = false;
    };
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
  });

  // ---- 시스템 버튼 ----
  fsBtn.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await document.documentElement.requestFullscreen();
        // 전체 화면일 때만 방향 고정이 허용된다. 지원하지 않는 브라우저는 조용히 넘어간다
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        await o.lock?.('landscape').catch(() => {});
      }
    } catch {
      /* 무시 */
    }
  });
  sndBtn.addEventListener('click', () => {
    toggleSound();
    sndBtn.textContent = $.SND.on ? '🔊' : '🔈';
  });
  homeBtn.addEventListener('click', () => {
    if ($.mode === 'game') {
      $.mode = 'title';
      music('cut');
    }
  });

  // 길게 눌렀을 때 뜨는 메뉴·확대를 막는다
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
}

/** 게임 중에만 조작 버튼을 보인다. 타이틀·컷신에서는 화면을 눌러 진행해야 하기 때문이다 */
export function updateTouchVisibility(): void {
  const on = $.mode === 'game' && !$.done;
  document.documentElement.classList.toggle('tc-play', on);
  if (!on) {
    keys.left = keys.right = keys.jump = keys.slash = keys.lamp = false;
  }
}
