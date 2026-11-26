// The game's rules and state, with no drawing and no browser in it: the chef, the stations
// (ingredient bins, chopping board, grill, plates, trash, serving window), the orders on the
// board, the shift clock, the score and the hearts. step() advances one fixed step and returns
// what happened as bit flags, so the caller can react without the kitchen knowing about screens
// or sound. Nothing here allocates after createKitchen returns.

import {
  BURN_AFTER,
  CARRY_MAX,
  CHEF,
  CHOP_SECONDS,
  FIELD,
  GRILL_SECONDS,
  HEARTS,
  INTERACT_RANGE,
  LAYOUT,
  ORDER,
  SHIFT_SECONDS,
} from './config.js';
import { INGREDIENTS, plateMatchesRecipe, RECIPES, requiredPrep } from './recipes.js';

export const EVENT_SERVE = 1;
export const EVENT_FAIL = 2;
export const EVENT_READY = 4;
export const EVENT_OVER = 8;

const GRILL_SLOTS = 2;

/** Every solid rectangle the chef cannot walk through (station counters). */
function solidRects() {
  const rects = [];
  rects.push({ x: 20, y: 196, width: 960, height: 86 }); // ingredient bins row
  rects.push(LAYOUT.chopping);
  rects.push(LAYOUT.grill);
  rects.push(LAYOUT.plates);
  rects.push(LAYOUT.trash);
  rects.push(LAYOUT.window);
  return rects;
}

function overlapsCircleRect(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

/** Stations the chef can use, each with the point the chef stands at to use it. */
export function stationList() {
  const list = [];
  for (const bin of LAYOUT.bins) {
    list.push({ kind: 'bin', id: bin.id, x: bin.x + bin.width / 2, y: bin.y + bin.height + 26 });
  }
  const chop = LAYOUT.chopping;
  list.push({ kind: 'chopping', x: chop.x + chop.width / 2, y: chop.y + chop.height + 26 });
  const grill = LAYOUT.grill;
  list.push({ kind: 'grill', slot: 0, x: grill.x + grill.width / 4, y: grill.y + grill.height + 26 });
  list.push({ kind: 'grill', slot: 1, x: grill.x + (3 * grill.width) / 4, y: grill.y + grill.height + 26 });
  const plates = LAYOUT.plates;
  list.push({ kind: 'plate', slot: 0, x: plates.x + plates.width / 4, y: plates.y + plates.height + 26 });
  list.push({ kind: 'plate', slot: 1, x: plates.x + (3 * plates.width) / 4, y: plates.y + plates.height + 26 });
  const trash = LAYOUT.trash;
  list.push({ kind: 'trash', x: trash.x + trash.width / 2, y: trash.y - 26 });
  const win = LAYOUT.window;
  list.push({ kind: 'window', x: win.x + win.width / 2, y: win.y - 26 });
  return list;
}

export function createKitchen(random) {
  const rects = solidRects();
  const stations = stationList();
  const state = {
    chef: { x: 640, y: 560, tx: 640, ty: 560, moving: false, detour: null, stall: 0, lastTarget: null },
    carried: [],
    board: { item: null, progress: 0 },
    grill: [
      { item: null, progress: 0 },
      { item: null, progress: 0 },
    ],
    plates: [{ items: [] }, { items: [] }],
    orders: [],
    score: 0,
    served: 0,
    hearts: HEARTS,
    elapsed: 0,
    spawnTimer: ORDER.firstAt,
    nextOrder: 0,
    combo: 0,
    comboTimer: 0,
    over: false,
  };

  function reset() {
    state.chef.x = 640;
    state.chef.y = 560;
    state.chef.tx = 640;
    state.chef.ty = 560;
    state.chef.moving = false;
    state.chef.detour = null;
    state.chef.stall = 0;
    state.chef.lastTarget = null;
    state.carried = [];
    state.board = { item: null, progress: 0 };
    state.grill = [
      { item: null, progress: 0 },
      { item: null, progress: 0 },
    ];
    state.plates = [{ items: [] }, { items: [] }];
    state.orders = [];
    state.score = 0;
    state.served = 0;
    state.hearts = HEARTS;
    state.elapsed = 0;
    state.spawnTimer = ORDER.firstAt;
    state.nextOrder = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.over = false;
  }

  function nearestStation() {
    let best = null;
    let bestDistance = INTERACT_RANGE;
    for (const station of stations) {
      const dx = state.chef.x - station.x;
      const dy = state.chef.y - station.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = station;
      }
    }
    return best;
  }

  /** A carried item that is not a plate, of the first kind matching `test`. */
  function carriedItemIndex(test) {
    for (let index = 0; index < state.carried.length; index += 1) {
      const item = state.carried[index];
      if (!item.plate && test(item)) return index;
    }
    return -1;
  }

  function carriedPlateIndex() {
    for (let index = 0; index < state.carried.length; index += 1) {
      if (state.carried[index].plate) return index;
    }
    return -1;
  }

  /**
   * Use the station in reach. Returns an event flag, and mutates the state.
   * Nothing happens when no station is in reach.
   */
  function interact() {
    const station = nearestStation();
    if (station === null) return 0;
    let events = 0;

    if (station.kind === 'bin') {
      if (state.carried.length < CARRY_MAX) {
        state.carried.push({ id: station.id, prep: 'raw' });
      }
      return events;
    }

    if (station.kind === 'chopping') {
      const board = state.board;
      if (board.item === null) {
        const at = carriedItemIndex((item) => INGREDIENTS[item.id].chop && item.prep === 'raw');
        if (at !== -1) {
          board.item = state.carried.splice(at, 1)[0];
          board.progress = 0;
        }
      } else if (board.progress >= CHOP_SECONDS && state.carried.length < CARRY_MAX) {
        state.carried.push({ id: board.item.id, prep: 'chopped' });
        board.item = null;
        board.progress = 0;
      }
      return events;
    }

    if (station.kind === 'grill') {
      const slot = state.grill[station.slot];
      if (slot.item === null) {
        const at = carriedItemIndex((item) => INGREDIENTS[item.id].grill && item.prep === 'raw');
        if (at !== -1) {
          slot.item = state.carried.splice(at, 1)[0];
          slot.progress = 0;
        }
      } else if (slot.progress >= GRILL_SECONDS && state.carried.length < CARRY_MAX) {
        const done = slot.item;
        slot.item = null;
        slot.progress = 0;
        state.carried.push({ id: done.id, prep: done.prep });
      }
      return events;
    }

    if (station.kind === 'plate') {
      const plate = state.plates[station.slot];
      const plateAt = carriedPlateIndex();
      if (plateAt !== -1) {
        // Put the carried plate back on its counter.
        if (plate.items.length === 0) {
          plate.items = state.carried.splice(plateAt, 1)[0].items;
        }
        return events;
      }
      if (state.carried.length === 0 && plate.items.length > 0) {
        // Pick the whole plate up (both hands).
        state.carried.push({ plate: true, items: plate.items });
        plate.items = [];
        return events;
      }
      const top = state.carried[state.carried.length - 1];
      if (top && !top.plate && plate.items.length < 4) {
        plate.items.push(state.carried.pop());
      }
      return events;
    }

    if (station.kind === 'trash') {
      const plateAt = carriedPlateIndex();
      if (plateAt !== -1) {
        state.carried[plateAt].items = [];
      } else {
        state.carried = [];
      }
      return events;
    }

    if (station.kind === 'window') {
      const plateAt = carriedPlateIndex();
      if (plateAt === -1) return events;
      const plate = state.carried[plateAt];
      for (let index = 0; index < state.orders.length; index += 1) {
        const order = state.orders[index];
        if (plateMatchesRecipe(plate.items, order.recipe)) {
          const tip = Math.round((order.recipe.price * 0.5 * order.patience) / order.max);
          const comboBonus = state.comboTimer > 0 ? state.combo * 2 : 0;
          state.score += order.recipe.price + tip + comboBonus;
          state.served += 1;
          state.combo = state.comboTimer > 0 ? Math.min(state.combo + 1, 5) : 1;
          state.comboTimer = 10;
          state.orders.splice(index, 1);
          state.carried.splice(plateAt, 1);
          return EVENT_SERVE;
        }
      }
      return EVENT_FAIL;
    }
    return events;
  }

  /** What the prompt near the chef should say for the station in reach, or null. */
  function actionLabel() {
    const station = nearestStation();
    if (station === null) return null;
    if (station.kind === 'bin') return `E: ${INGREDIENTS[station.id].name} を取る`;
    if (station.kind === 'chopping') {
      if (state.board.item === null) return 'E: 刻むものを置く';
      if (state.board.progress >= CHOP_SECONDS) return 'E: 刻んだものを取る';
      return '刻み中…';
    }
    if (station.kind === 'grill') {
      const slot = state.grill[station.slot];
      if (slot.item === null) return 'E: 焼くものを置く';
      if (slot.progress >= BURN_AFTER) return 'E: 焦げたものを捨てる';
      if (slot.progress >= GRILL_SECONDS) return 'E: 焼けたものを取る';
      return '焼き中…';
    }
    if (station.kind === 'plate') {
      const plate = state.plates[station.slot];
      if (carriedPlateIndex() !== -1) return 'E: 皿を戻す';
      if (state.carried.length === 0 && plate.items.length > 0) return 'E: 皿を持つ';
      if (plate.items.length >= 4) return '皿がいっぱい';
      return 'E: 皿にのせる';
    }
    if (station.kind === 'trash') return 'E: 手持ちを捨てる';
    if (station.kind === 'window') return 'E: 料理を提供する';
    return null;
  }

  function spawnOrder() {
    const recipe = RECIPES[Math.floor(random() * RECIPES.length)];
    state.orders.push({
      uid: state.nextOrder,
      recipe,
      patience: ORDER.patience,
      max: ORDER.patience,
    });
    state.nextOrder += 1;
  }

  // Columns the chef can walk vertically through the station rows: the gaps between
  // the chopping board and the grill (x 286..470) and between the grill and the
  // plates (x 810..980). A detour point always sits in one of these columns.
  const GAP_COLUMNS = [378, 895];

  // Move one axis at a time, reverting the axis that would enter a counter: walking
  // diagonally into a counter slides along it instead of getting stuck against it.
  // When a walk stalls flat against a counter (a bin straight above the grill cannot
  // be reached by walking straight up, by keys or by click), the chef detours through
  // the nearer gap column to the lane on the far side of the counter, then resumes.
  // The detour briefly overrides keys and clicks until it is reached.
  function moveChef(dt, direction, target) {
    const chef = state.chef;
    if (target !== null) {
      if (chef.lastTarget === null
        || Math.hypot(target.x - chef.lastTarget.x, target.y - chef.lastTarget.y) > 2) {
        chef.detour = null;
        chef.lastTarget = { x: target.x, y: target.y };
      }
    }
    let steer = target;
    if (chef.detour !== null) {
      if (Math.hypot(chef.detour.x - chef.x, chef.detour.y - chef.y) < 10) chef.detour = null;
      else steer = chef.detour;
    }
    let dx = 0;
    let dy = 0;
    if (steer === null && (direction.x !== 0 || direction.y !== 0)) {
      dx = direction.x;
      dy = direction.y;
      chef.moving = true;
      chef.tx = chef.x;
      chef.ty = chef.y;
    } else if (steer !== null) {
      const tx = steer.x - chef.x;
      const ty = steer.y - chef.y;
      const distance = Math.sqrt(tx * tx + ty * ty);
      if (distance > 6) {
        dx = tx / distance;
        dy = ty / distance;
        chef.moving = true;
      } else {
        chef.moving = false;
      }
    } else {
      chef.moving = false;
    }
    if (dx === 0 && dy === 0) return;
    const length = Math.sqrt(dx * dx + dy * dy);
    const stepX = (dx / length) * CHEF.speed * dt;
    const stepY = (dy / length) * CHEF.speed * dt;
    const startX = chef.x;
    const startY = chef.y;
    const oldX = chef.x;
    chef.x = Math.max(CHEF.radius, Math.min(FIELD.width - CHEF.radius, chef.x + stepX));
    const blockedX = rects.some((rect) => overlapsCircleRect(chef.x, chef.y, CHEF.radius, rect));
    if (blockedX) chef.x = oldX;
    const oldY = chef.y;
    chef.y = Math.max(200 + CHEF.radius, Math.min(FIELD.height - CHEF.radius, chef.y + stepY));
    const blockedY = rects.some((rect) => overlapsCircleRect(chef.x, chef.y, CHEF.radius, rect));
    if (blockedY) chef.y = oldY;
    const moved = Math.sqrt((chef.x - startX) ** 2 + (chef.y - startY) ** 2);
    if (moved < 0.5 && (blockedX || blockedY)) chef.stall += 1;
    else chef.stall = 0;
    if (chef.stall >= 8) {
      if (chef.detour !== null) {
        // The detour itself is blocked: try the other gap column once, then give up
        // and let the player steer with the keys.
        const other = GAP_COLUMNS.find((column) => column !== chef.detour.x);
        if (other !== undefined && chef.detour.tries < 2) {
          chef.detour = { x: other, y: chef.detour.y, tries: chef.detour.tries + 1 };
        } else {
          chef.detour = null;
        }
      } else {
        const blocker = blockedY && Math.abs(dy) >= Math.abs(dx)
          ? rects.find((rect) => overlapsCircleRect(chef.x, chef.y + stepY, CHEF.radius, rect))
          : rects.find((rect) => overlapsCircleRect(chef.x + stepX, chef.y, CHEF.radius, rect));
        if (blocker !== undefined) {
          const laneY = dy < 0
            ? blocker.y - CHEF.radius - 10
            : dy > 0
              ? blocker.y + blocker.height + CHEF.radius + 10
              : chef.y;
          const gapX = GAP_COLUMNS.reduce((best, column) => (
            Math.abs(column - chef.x) < Math.abs(best - chef.x) ? column : best
          ));
          chef.detour = { x: gapX, y: laneY, tries: 1 };
        }
      }
      chef.stall = 0;
    }
  }

  /**
   * One fixed step. `direction` is the held-key vector, `target` the click-to-move point
   * (or null). Returns event flags.
   */
  function step(dt, direction, target) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    if (state.comboTimer > 0) state.comboTimer = Math.max(0, state.comboTimer - dt);

    moveChef(dt, direction, target);

    // The board chops on its own once an item is on it.
    const board = state.board;
    if (board.item !== null && board.progress < CHOP_SECONDS) {
      const before = board.progress;
      board.progress = Math.min(CHOP_SECONDS, board.progress + dt);
      if (before < CHOP_SECONDS && board.progress >= CHOP_SECONDS) events |= EVENT_READY;
    }
    for (const slot of state.grill) {
      if (slot.item === null) continue;
      const before = slot.progress;
      slot.progress += dt;
      if (before < GRILL_SECONDS && slot.progress >= GRILL_SECONDS) {
        slot.item.prep = 'grilled';
        events |= EVENT_READY;
      }
      if (before < BURN_AFTER && slot.progress >= BURN_AFTER) {
        slot.item.prep = 'burned';
        events |= EVENT_FAIL;
      }
    }

    // Orders arrive faster as the shift goes on.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.orders.length < ORDER.maxOpen) {
      spawnOrder();
      const t = Math.min(1, state.elapsed / SHIFT_SECONDS);
      state.spawnTimer = ORDER.intervalStart + (ORDER.intervalEnd - ORDER.intervalStart) * t;
    }

    // An order whose patience runs out costs a heart.
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(index, 1);
        state.hearts -= 1;
        state.combo = 0;
        state.comboTimer = 0;
        events |= EVENT_FAIL;
        if (state.hearts <= 0) {
          state.over = true;
          events |= EVENT_OVER;
        }
      }
    }

    if (state.elapsed >= SHIFT_SECONDS) {
      state.over = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  return { state, reset, step, interact, actionLabel, nearestStation };
}
