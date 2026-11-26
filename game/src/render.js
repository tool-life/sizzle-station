// Drawing only: the kitchen's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with the backdrop
// colour. Flat shapes and canvas text; the food is drawn, never loaded from a file.

import { CHEF, FIELD, LAYOUT, ORDER, PALETTE, SHIFT_SECONDS } from './config.js';
import { INGREDIENTS, PREP_BURNED, PREP_CHOPPED, PREP_GRILLED } from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function heart(context, x, y, size, color) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x, y + size * 0.9);
  context.bezierCurveTo(x - size, y + size * 0.2, x - size * 0.55, y - size * 0.7, x, y - size * 0.1);
  context.bezierCurveTo(x + size * 0.55, y - size * 0.7, x + size, y + size * 0.2, x, y + size * 0.9);
  context.fill();
}

/**
 * One ingredient, drawn at (x, y) with the given radius. Preparation changes the look:
 * chopped is cut into pieces, grilled is darker with grill lines, burned is charred.
 */
export function drawIngredient(context, id, prep, x, y, radius) {
  const food = INGREDIENTS[id];
  const r = radius;
  context.save();
  context.translate(x, y);
  if (prep === PREP_CHOPPED) {
    context.fillStyle = food.color;
    for (const [dx, dy] of [[-r * 0.5, -r * 0.3], [r * 0.45, -r * 0.35], [0, r * 0.45]]) {
      context.beginPath();
      context.arc(dx, dy, r * 0.42, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
    return;
  }
  if (id === 'tomato') {
    context.fillStyle = prep === PREP_BURNED ? '#3a2a24' : '#e5534b';
    context.beginPath();
    context.arc(0, 0, r, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#4e9a3d';
    context.beginPath();
    context.moveTo(0, -r);
    context.lineTo(-r * 0.45, -r * 1.25);
    context.lineTo(0, -r * 0.85);
    context.lineTo(r * 0.45, -r * 1.25);
    context.closePath();
    context.fill();
  } else if (id === 'lettuce') {
    context.fillStyle = prep === PREP_BURNED ? '#3a2a24' : '#7ec850';
    for (const [dx, dy, s] of [[-r * 0.4, 0, 0.62], [r * 0.4, 0, 0.62], [0, -r * 0.35, 0.7]]) {
      context.beginPath();
      context.arc(dx, dy, r * s, 0, Math.PI * 2);
      context.fill();
    }
    context.strokeStyle = '#4e9a3d';
    context.lineWidth = r * 0.12;
    context.beginPath();
    context.moveTo(-r * 0.5, r * 0.1);
    context.quadraticCurveTo(0, -r * 0.4, r * 0.5, r * 0.1);
    context.stroke();
  } else if (id === 'onion') {
    context.fillStyle = prep === PREP_BURNED ? '#3a2a24' : '#efe6f5';
    context.beginPath();
    context.arc(0, 0, r, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#b48ec9';
    context.lineWidth = r * 0.14;
    for (const s of [0.7, 0.4]) {
      context.beginPath();
      context.arc(0, 0, r * s, 0, Math.PI * 2);
      context.stroke();
    }
  } else if (id === 'patty') {
    context.fillStyle = prep === PREP_BURNED ? '#1f1713' : prep === PREP_GRILLED ? '#5f3a22' : '#8a5a3b';
    roundRect(context, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5);
    context.fill();
    if (prep === PREP_GRILLED) {
      context.strokeStyle = '#3a2415';
      context.lineWidth = r * 0.14;
      for (const dx of [-r * 0.5, 0, r * 0.5]) {
        context.beginPath();
        context.moveTo(dx, -r * 0.45);
        context.lineTo(dx, r * 0.45);
        context.stroke();
      }
    }
  } else if (id === 'bacon') {
    context.fillStyle = prep === PREP_BURNED ? '#1f1713' : '#c94f5e';
    context.beginPath();
    context.moveTo(-r, -r * 0.4);
    context.quadraticCurveTo(-r * 0.5, -r * 0.9, 0, -r * 0.4);
    context.quadraticCurveTo(r * 0.5, r * 0.1, r, -r * 0.4);
    context.quadraticCurveTo(r * 0.5, r * 0.9, 0, r * 0.4);
    context.quadraticCurveTo(-r * 0.5, -r * 0.1, -r, -r * 0.4);
    context.fill();
    context.fillStyle = prep === PREP_BURNED ? '#1f1713' : '#e88a8a';
    context.fillRect(-r * 0.8, -r * 0.12, r * 1.6, r * 0.24);
  } else if (id === 'egg') {
    context.fillStyle = '#f6e8c8';
    context.beginPath();
    context.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = prep === PREP_BURNED ? '#1f1713' : '#f2a93b';
    context.beginPath();
    context.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    context.fill();
  } else if (id === 'bun') {
    context.fillStyle = '#e0a458';
    context.beginPath();
    context.arc(0, r * 0.25, r, Math.PI, 0);
    context.closePath();
    context.fill();
    context.fillRect(-r, r * 0.25, r * 2, r * 0.3);
    context.fillStyle = '#fff3d6';
    for (const dx of [-r * 0.5, 0, r * 0.5]) {
      context.beginPath();
      context.ellipse(dx, -r * 0.35, r * 0.12, r * 0.07, 0, 0, Math.PI * 2);
      context.fill();
    }
  } else if (id === 'cheese') {
    context.fillStyle = '#f2c94c';
    context.beginPath();
    context.moveTo(-r, r * 0.7);
    context.lineTo(0, -r * 0.8);
    context.lineTo(r, r * 0.7);
    context.closePath();
    context.fill();
    context.fillStyle = '#d9a92e';
    for (const [dx, dy] of [[-r * 0.3, r * 0.25], [r * 0.25, r * 0.35], [0, -r * 0.2]]) {
      context.beginPath();
      context.arc(dx, dy, r * 0.14, 0, Math.PI * 2);
      context.fill();
    }
  } else if (id === 'bread') {
    context.fillStyle = '#c98f4e';
    roundRect(context, -r, -r * 0.8, r * 2, r * 1.6, r * 0.35);
    context.fill();
    context.fillStyle = '#e8c88f';
    roundRect(context, -r * 0.78, -r * 0.6, r * 1.56, r * 1.2, r * 0.3);
    context.fill();
  }
  context.restore();
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, weight) {
    const key = `${size}:${weight || ''}`;
    if (!fonts.has(key)) fonts.set(key, `${weight ? `${weight} ` : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.fillText(value, x, y);
  }

  function bar(x, y, width, height, ratio, fill, background) {
    context.fillStyle = background;
    roundRect(context, x, y, width, height, height / 2);
    context.fill();
    if (ratio > 0) {
      context.fillStyle = fill;
      roundRect(context, x, y, Math.max(height, width * Math.min(1, ratio)), height, height / 2);
      context.fill();
    }
  }

  function drawFloor() {
    context.fillStyle = PALETTE.floor;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.floorTile;
    const tile = 80;
    for (let y = 0; y < FIELD.height; y += tile) {
      for (let x = (y / tile) % 2 === 0 ? 0 : tile / 2; x < FIELD.width; x += tile) {
        context.fillRect(x, y, tile - 2, tile - 2);
      }
    }
    context.fillStyle = PALETTE.wall;
    context.fillRect(0, 0, FIELD.width, 6);
  }

  function drawBins() {
    for (const bin of LAYOUT.bins) {
      context.fillStyle = PALETTE.counter;
      roundRect(context, bin.x, bin.y, bin.width, bin.height, 8);
      context.fill();
      context.fillStyle = PALETTE.counterTop;
      roundRect(context, bin.x, bin.y, bin.width, 14, 8);
      context.fill();
      drawIngredient(context, bin.id, 'raw', bin.x + bin.width / 2, bin.y + 38, 20);
      text(INGREDIENTS[bin.id].name, bin.x + bin.width / 2, bin.y + bin.height - 8, 13, PALETTE.text, 'center');
    }
  }

  function drawChopping(state) {
    const rect = LAYOUT.chopping;
    context.fillStyle = PALETTE.counter;
    roundRect(context, rect.x, rect.y, rect.width, rect.height, 10);
    context.fill();
    context.fillStyle = PALETTE.board;
    roundRect(context, rect.x + 16, rect.y + 30, rect.width - 32, rect.height - 56, 10);
    context.fill();
    text('CHOPPING BOARD', rect.x + 16, rect.y + 20, 14, PALETTE.text, 'left', '700');
    const board = state.board;
    if (board.item !== null) {
      drawIngredient(context, board.item.id, 'chopped', rect.x + rect.width / 2 - 30, rect.y + rect.height / 2 + 12, 26);
      if (board.progress < 2.0) {
        bar(rect.x + 30, rect.y + rect.height - 22, rect.width - 60, 10, board.progress / 2.0, PALETTE.green, '#00000055');
      } else {
        text('READY!', rect.x + rect.width - 20, rect.y + rect.height - 14, 14, PALETTE.green, 'right', '700');
      }
    } else {
      text('place a veggie to chop', rect.x + rect.width / 2, rect.y + rect.height / 2 + 12, 14, PALETTE.muted, 'center');
    }
  }

  function drawGrill(state) {
    const rect = LAYOUT.grill;
    context.fillStyle = PALETTE.steel;
    roundRect(context, rect.x, rect.y, rect.width, rect.height, 10);
    context.fill();
    text('GRILL', rect.x + 16, rect.y + 20, 14, PALETTE.text, 'left', '700');
    for (let slot = 0; slot < 2; slot += 1) {
      const sx = rect.x + 30 + slot * 160;
      const sy = rect.y + 34;
      context.fillStyle = '#22252b';
      roundRect(context, sx, sy, 130, 62, 8);
      context.fill();
      // Flame bars under the grate.
      context.fillStyle = slot === 0 ? '#ff9a3c' : '#ff7a2f';
      for (let flame = 0; flame < 4; flame += 1) {
        const fx = sx + 14 + flame * 28;
        const height = 12 + 5 * Math.sin(state.elapsed * 6 + flame * 1.7 + slot);
        context.beginPath();
        context.moveTo(fx, sy + 56);
        context.quadraticCurveTo(fx + 6, sy + 56 - height, fx + 12, sy + 56);
        context.closePath();
        context.fill();
      }
      const item = state.grill[slot].item;
      if (item !== null) {
        drawIngredient(context, item.id, item.prep, sx + 65, sy + 26, 22);
        const progress = state.grill[slot].progress;
        if (progress >= 7.0) {
          text('BURNED!', sx + 65, sy + 82, 13, PALETTE.red, 'center', '700');
        } else if (progress >= 3.0) {
          text('READY!', sx + 65, sy + 82, 13, PALETTE.green, 'center', '700');
        } else {
          bar(sx + 8, sy + 74, 114, 8, progress / 3.0, PALETTE.accent, '#00000055');
        }
      }
    }
  }

  function drawPlates(state) {
    const rect = LAYOUT.plates;
    context.fillStyle = PALETTE.counter;
    roundRect(context, rect.x, rect.y, rect.width, rect.height, 10);
    context.fill();
    text('PLATES', rect.x + 16, rect.y + 20, 14, PALETTE.text, 'left', '700');
    for (let slot = 0; slot < 2; slot += 1) {
      const cx = rect.x + 66 + slot * 132;
      const cy = rect.y + 78;
      context.fillStyle = PALETTE.plate;
      context.beginPath();
      context.ellipse(cx, cy, 52, 40, 0, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#d8cfc0';
      context.lineWidth = 2;
      context.beginPath();
      context.ellipse(cx, cy, 40, 30, 0, 0, Math.PI * 2);
      context.stroke();
      const items = state.plates[slot].items;
      items.forEach((item, index) => {
        const angle = (index / Math.max(1, items.length)) * Math.PI * 2 - Math.PI / 2;
        drawIngredient(context, item.id, item.prep, cx + Math.cos(angle) * 22, cy + Math.sin(angle) * 15, 13);
      });
    }
  }

  function drawTrash() {
    const rect = LAYOUT.trash;
    context.fillStyle = PALETTE.steel;
    roundRect(context, rect.x, rect.y, rect.width, rect.height, 10);
    context.fill();
    context.fillStyle = '#2c2f36';
    roundRect(context, rect.x + 30, rect.y + 30, rect.width - 60, rect.height - 52, 8);
    context.fill();
    context.fillStyle = PALETTE.muted;
    context.fillRect(rect.x + 20, rect.y + 18, rect.width - 40, 8);
    text('TRASH', rect.x + rect.width / 2, rect.y + rect.height - 10, 14, PALETTE.text, 'center', '700');
  }

  function drawWindow() {
    const rect = LAYOUT.window;
    context.fillStyle = '#7a4a22';
    roundRect(context, rect.x, rect.y, rect.width, rect.height, 10);
    context.fill();
    context.fillStyle = '#ffb347';
    roundRect(context, rect.x + 14, rect.y + 14, rect.width - 28, 52, 8);
    context.fill();
    context.fillStyle = '#3a2c22';
    context.beginPath();
    context.arc(rect.x + rect.width / 2, rect.y + 40, 12, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.gold;
    context.beginPath();
    context.arc(rect.x + rect.width / 2, rect.y + 40, 7, 0, Math.PI * 2);
    context.fill();
    text('SERVE HERE  •  ring the bell', rect.x + rect.width / 2, rect.y + 92, 15, PALETTE.text, 'center', '700');
  }

  function drawOrderBoard(state) {
    const rect = LAYOUT.board;
    context.fillStyle = PALETTE.panel;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    text('ORDER BOARD', 20, rect.y + 24, 15, PALETTE.muted, 'left', '700');
    if (state.orders.length === 0) {
      text('No orders yet — the rush is coming…', 180, rect.y + 62, 18, PALETTE.muted, 'left');
      return;
    }
    state.orders.forEach((order, index) => {
      const x = 16 + index * 312;
      const y = rect.y + 8;
      const width = 296;
      const height = 88;
      context.fillStyle = PALETTE.ticket;
      roundRect(context, x, y, width, height, 8);
      context.fill();
      const ratio = Math.max(0, order.patience / order.max);
      const urgency = ratio < 0.35 ? PALETTE.red : ratio < 0.6 ? '#d98a1f' : '#4e9a3d';
      context.fillStyle = urgency;
      context.fillRect(x, y, 6, height);
      text(order.recipe.name, x + 16, y + 24, 17, PALETTE.ticketText, 'left', '700');
      text(`$${order.recipe.price}`, x + width - 14, y + 24, 17, PALETTE.ticketText, 'right', '700');
      order.recipe.needs.forEach((need, n) => {
        const cx = x + 28 + n * 52;
        drawIngredient(context, need.id, need.prep, cx, y + 52, 15);
      });
      bar(x + 16, y + height - 14, width - 32, 8, ratio, urgency, '#00000022');
    });
  }

  function drawHud(state, screen) {
    const rect = LAYOUT.hud;
    context.fillStyle = PALETTE.panel;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    text(`SCORE  $${state.score}`, 20, 52, 30, PALETTE.text, 'left', '800');
    if (state.combo > 1) {
      text(`COMBO x${state.combo}`, 230, 52, 20, PALETTE.gold, 'left', '700');
    }
    const remaining = Math.max(0, SHIFT_SECONDS - state.elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    const timerText = `${minutes}:${String(seconds).padStart(2, '0')}`;
    text(timerText, FIELD.width / 2, 52, 30, remaining < 30 ? PALETTE.red : PALETTE.text, 'center', '800');
    bar(FIELD.width / 2 - 90, 62, 180, 8, remaining / SHIFT_SECONDS, remaining < 30 ? PALETTE.red : PALETTE.accent, '#00000055');
    text('SHIFT', FIELD.width / 2, 24, 13, PALETTE.muted, 'center', '700');
    for (let heartIndex = 0; heartIndex < 3; heartIndex += 1) {
      heart(context, FIELD.width - 40 - heartIndex * 44, 42, 15, heartIndex < state.hearts ? PALETTE.red : '#3a2c22');
    }
    text('DISHES  ' + state.served, FIELD.width - 150, 78, 14, PALETTE.muted, 'right');
    if (screen === SCREEN_PAUSED) {
      text('PAUSED — press P to resume', FIELD.width / 2, 420, 34, PALETTE.text, 'center', '700');
    }
  }

  function drawChef(state) {
    const chef = state.chef;
    const bob = chef.moving ? Math.sin(state.elapsed * 14) * 2 : 0;
    context.save();
    context.translate(chef.x, chef.y + bob);
    // Shadow.
    context.fillStyle = '#00000044';
    context.beginPath();
    context.ellipse(0, CHEF.radius - 2, CHEF.radius, 8, 0, 0, Math.PI * 2);
    context.fill();
    // Body and apron.
    context.fillStyle = '#f4efe6';
    context.beginPath();
    context.arc(0, 0, CHEF.radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#e5534b';
    context.fillRect(-CHEF.radius, -4, CHEF.radius * 2, 8);
    // Face.
    context.fillStyle = '#f2c9a0';
    context.beginPath();
    context.arc(0, -CHEF.radius * 0.55, CHEF.radius * 0.62, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#2b211a';
    context.beginPath();
    context.arc(-6, -CHEF.radius * 0.6, 2.5, 0, Math.PI * 2);
    context.arc(6, -CHEF.radius * 0.6, 2.5, 0, Math.PI * 2);
    context.fill();
    // Chef hat.
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(-11, -CHEF.radius * 1.15, 8, 0, Math.PI * 2);
    context.arc(0, -CHEF.radius * 1.3, 9, 0, Math.PI * 2);
    context.arc(11, -CHEF.radius * 1.15, 8, 0, Math.PI * 2);
    context.fill();
    context.fillRect(-14, -CHEF.radius * 1.2, 28, 7);
    // Carried items above the hat.
    state.carried.forEach((item, index) => {
      const cx = (index - (state.carried.length - 1) / 2) * 34;
      const cy = -CHEF.radius - 34;
      if (item.plate) {
        context.fillStyle = PALETTE.plate;
        context.beginPath();
        context.ellipse(cx, cy, 32, 22, 0, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#d8cfc0';
        context.lineWidth = 2;
        context.beginPath();
        context.ellipse(cx, cy, 24, 16, 0, 0, Math.PI * 2);
        context.stroke();
        item.items.forEach((inner, j) => {
          const angle = (j / Math.max(1, item.items.length)) * Math.PI * 2 - Math.PI / 2;
          drawIngredient(context, inner.id, inner.prep, cx + Math.cos(angle) * 13, cy + Math.sin(angle) * 8, 8);
        });
      } else {
        drawIngredient(context, item.id, item.prep, cx, cy, 13);
      }
    });
    context.restore();
  }

  // The action prompt sits in a fixed pill at the bottom centre, so it never covers a
  // station, a plate or the chef.
  function drawPrompt(label, state) {
    if (label === null) return;
    const x = FIELD.width / 2;
    const y = FIELD.height - 22;
    context.font = `700 15px ${FONT}`;
    const width = context.measureText(label).width + 24;
    context.fillStyle = '#000000bb';
    roundRect(context, x - width / 2, y - 20, width, 28, 14);
    context.fill();
    text(label, x, y, 15, '#ffffff', 'center', '700');
  }

  function drawPanel(title, lines, prompt, accent) {
    const width = 640;
    const height = 150 + lines.length * 34;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = '#00000088';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    roundRect(context, x, y, width, height, 16);
    context.fill();
    context.strokeStyle = accent;
    context.lineWidth = 3;
    roundRect(context, x, y, width, height, 16);
    context.stroke();
    text(title, FIELD.width / 2, y + 62, 40, accent, 'center', '800');
    lines.forEach((line, index) => {
      text(line, FIELD.width / 2, y + 108 + index * 34, 19, PALETTE.text, 'center');
    });
    text(prompt, FIELD.width / 2, y + height - 26, 17, PALETTE.muted, 'center');
  }

  function drawTitle(state, best) {
    drawPanel(
      'SIZZLE STATION',
      [
        'The lunch rush is on. Read the order board,',
        'chop and grill each dish, plate it and serve it',
        'before the customer walks out!',
        '',
        'Move: WASD / arrows or click  •  Use a station: E',
        'Chop veggies on the board, grill on the grill,',
        'plate it up and ring the bell at the window.',
      ],
      best > 0 ? `Best score: $${best}  —  press Space or click to start` : 'Press Space or click to start',
      PALETTE.accent,
    );
  }

  function drawOver(state, best) {
    const outOfHearts = state.hearts <= 0;
    drawPanel(
      outOfHearts ? 'OUT OF HEARTS!' : "SHIFT'S OVER!",
      [
        `Final score: $${state.score}`,
        `Dishes served: ${state.served}`,
        state.score >= best && state.score > 0 ? 'New best score!' : `Best score: $${best}`,
      ],
      'Press Space or click to play again',
      outOfHearts ? PALETTE.red : PALETTE.accent,
    );
  }

  function draw(state, screen, best, promptLabel) {
    resize();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    context.textBaseline = 'alphabetic';

    drawFloor();
    drawBins();
    drawChopping(state);
    drawGrill(state);
    drawPlates(state);
    drawTrash();
    drawWindow();
    drawOrderBoard(state);
    drawChef(state);
    drawHud(state, screen);
    if (screen === SCREEN_PLAY) drawPrompt(promptLabel, state);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return {
    draw,
    /** Convert a client point on the canvas to playfield coordinates. */
    toField(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (canvas.width / rect.width);
      const y = (clientY - rect.top) * (canvas.height / rect.height);
      return { x: (x - view.x) / view.scale, y: (y - view.y) / view.scale };
    },
  };
}
