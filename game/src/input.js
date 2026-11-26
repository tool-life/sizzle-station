// Keyboard and pointer input. Held keys give a steering vector; one-shot presses (use a
// station, pause) are queued as bit flags and taken once by the loop, so a press between two
// frames is never lost and never counted twice. A click sets a walk target in field
// coordinates; clicking near a station also arms an automatic interact on arrival.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const CONFIRM = new Set(['KeyE', 'Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createInput(target) {
  let left = false;
  let right = false;
  let up = false;
  let down = false;
  let actions = 0;
  let clickTarget = null;

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    left = false;
    right = false;
    up = false;
    down = false;
  });
  // Pointer clicks are handled by the caller (main.js): a click walks the chef, a click
  // near a station arms an automatic interact on arrival, and a click on a menu screen
  // starts the game. This module only tracks the keyboard.

  return {
    /** Held-key steering vector, each component -1, 0 or 1. */
    direction() {
      return { x: (right ? 1 : 0) - (left ? 1 : 0), y: (down ? 1 : 0) - (up ? 1 : 0) };
    },
    /** One-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** A click-to-move target in field coordinates, or null. */
    clickTarget() {
      return clickTarget;
    },
    /** Set the click target; `auto` means interact on arrival. */
    setClickTarget(point, auto) {
      clickTarget = { x: point.x, y: point.y, auto: Boolean(auto) };
    },
    clearClickTarget() {
      clickTarget = null;
    },
  };
}
