// Every tuning number, colour and layout rect in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends on
// the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Length of one shift, in seconds. */
export const SHIFT_SECONDS = 150;

export const CHEF = { radius: 24, speed: 330 };

export const HEARTS = 3;

/** How close the chef must be to a station's interact point to use it. */
export const INTERACT_RANGE = 96;

/** Seconds to chop an ingredient on the board. */
export const CHOP_SECONDS = 2.0;

/** Seconds to grill an ingredient; left longer than BURN_AFTER it burns. */
export const GRILL_SECONDS = 3.0;
export const BURN_AFTER = 7.0;

/** Orders: patience, spawn interval (shrinks over the shift), and the concurrent cap. */
export const ORDER = {
  patience: 50,
  firstAt: 2,
  intervalStart: 16,
  intervalEnd: 9,
  maxOpen: 4,
};

/** How many items the chef can carry at once (a plate counts as one item). */
export const CARRY_MAX = 2;

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-station.best';

/** Layout of the kitchen, in playfield coordinates. */
export const LAYOUT = {
  hud: { x: 0, y: 0, width: 1280, height: 84 },
  board: { x: 0, y: 88, width: 1280, height: 104 },
  bins: [
    { id: 'tomato', x: 36, y: 200, width: 96, height: 78 },
    { id: 'lettuce', x: 140, y: 200, width: 96, height: 78 },
    { id: 'onion', x: 244, y: 200, width: 96, height: 78 },
    { id: 'patty', x: 348, y: 200, width: 96, height: 78 },
    { id: 'bacon', x: 452, y: 200, width: 96, height: 78 },
    { id: 'egg', x: 556, y: 200, width: 96, height: 78 },
    { id: 'bun', x: 660, y: 200, width: 96, height: 78 },
    { id: 'cheese', x: 764, y: 200, width: 96, height: 78 },
    { id: 'bread', x: 868, y: 200, width: 96, height: 78 },
  ],
  chopping: { x: 36, y: 350, width: 250, height: 130 },
  grill: { x: 470, y: 350, width: 340, height: 130 },
  plates: { x: 980, y: 350, width: 264, height: 130 },
  trash: { x: 36, y: 550, width: 170, height: 120 },
  window: { x: 980, y: 550, width: 264, height: 120 },
};

export const PALETTE = {
  backdrop: '#171310',
  floor: '#3a2c22',
  floorTile: '#423327',
  wall: '#241a14',
  counter: '#6b4a2f',
  counterTop: '#8a5f3c',
  steel: '#4a4f57',
  steelTop: '#6e757f',
  board: '#c89b62',
  plate: '#f4efe6',
  text: '#fff7e8',
  muted: '#cbb59a',
  accent: '#ffb347',
  green: '#7ec850',
  red: '#e5534b',
  gold: '#f2c94c',
  panel: '#2b211a',
  ticket: '#fff8e7',
  ticketText: '#3a2c22',
};
