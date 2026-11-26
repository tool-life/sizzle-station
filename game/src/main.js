// Boot and the one loop: input is read every frame, the kitchen advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createKitchen, EVENT_FAIL, EVENT_OVER, EVENT_READY, EVENT_SERVE, stationList } from './kitchen.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

/** How close the chef must get to a clicked station before it is used on arrival. */
const CLICK_ARRIVE = 30;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const kitchen = createKitchen(createRandom(seed));
const renderer = createRenderer(canvas);
const stations = stationList();

/** Tiny synthesized sounds (WebAudio, no files): a ding for a serve, a blip for a ready
 * station, a buzz for a failure. Silent until the first user gesture creates audio. */
let audio = null;
function beep(frequency, duration, type) {
  try {
    if (audio === null) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  } catch {
    // No audio on this browser: the game plays on silently.
  }
}
function playEvent(events) {
  if (events & EVENT_SERVE) {
    beep(880, 0.12, 'sine');
    setTimeout(() => beep(1320, 0.18, 'sine'), 90);
  } else if (events & EVENT_READY) {
    beep(660, 0.08, 'triangle');
  } else if (events & EVENT_FAIL) {
    beep(160, 0.2, 'sawtooth');
  }
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, kitchen);
  let painted = 0;
  function paint() {
    const prompt = scene.screen === SCREEN_PLAY ? kitchen.actionLabel() : null;
    renderer.draw(kitchen.state, scene.screen, scene.best, prompt);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    kitchen.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve the orders before their patience runs out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (kitchen.state.score > best) {
      best = kitchen.state.score;
      saveBest(best);
    }
    announce(`Shift over. Score ${kitchen.state.score}. Best ${best}.`);
  }

  // Clicking walks the chef; a click near a station walks there and uses it on arrival.
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const point = renderer.toField(event.clientX, event.clientY);
    let nearest = null;
    let nearestDistance = 70;
    for (const station of stations) {
      const dx = point.x - station.x;
      const dy = point.y - station.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = station;
      }
    }
    if (nearest !== null) input.setClickTarget({ x: nearest.x, y: nearest.y }, true);
    else input.setClickTarget(point, false);
  });

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen !== SCREEN_PLAY) return;
    const direction = input.direction();
    if (direction.x !== 0 || direction.y !== 0) input.clearClickTarget();
    const target = input.clickTarget();
    const events = kitchen.step(STEP, direction, target);
    playEvent(events);
    if (events & EVENT_OVER) endGame();
    if (target !== null && target.auto) {
      const chef = kitchen.state.chef;
      const dx = chef.x - target.x;
      const dy = chef.y - target.y;
      // The arrival radius is deliberately far smaller than INTERACT_RANGE: the
      // chef walks to within 6 px of the clicked station, and a wide radius would
      // fire the use while passing another station on the way (a bin 104 px from
      // the next one, so 30 px can never catch the wrong station).
      if (Math.sqrt(dx * dx + dy * dy) <= CLICK_ARRIVE) {
        kitchen.interact();
        input.clearClickTarget();
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        if (screen === SCREEN_TITLE) kitchen.step(STEP, { x: 0, y: 0 }, null);
        else step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    const prompt = screen === SCREEN_PLAY ? kitchen.actionLabel() : null;
    renderer.draw(kitchen.state, screen, best, prompt);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle Station. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
