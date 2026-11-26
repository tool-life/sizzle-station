// The screenshot scenes behind ?shot=start|play|serve. Each one builds a real kitchen state
// with the same rules the game runs on — orders on the board, food on the stations, a plate
// mid-assembly — and returns the screen to draw over it, so the frame is what the game
// really looks like and the same seed always gives the same frame.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { RECIPES } from './recipes.js';

function order(uid, recipeId, patience) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  return { uid, recipe, patience, max: 50 };
}

/**
 * Set `kitchen` to the named scene (start, play or serve; any other name is start) and
 * return the screen to draw over it and the best score to show.
 */
export function stageShot(name, kitchen) {
  const state = kitchen.state;
  kitchen.reset();

  if (name !== 'play' && name !== 'serve') {
    state.orders.push(order(0, 'salad', 42));
    state.orders.push(order(1, 'burger', 30));
    state.chef.x = 300;
    state.chef.y = 640;
    state.chef.tx = 300;
    state.chef.ty = 640;
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'play') {
    state.score = 84;
    state.served = 4;
    state.hearts = 3;
    state.elapsed = 54;
    state.orders.push(order(0, 'burger', 12));
    state.orders.push(order(1, 'sunrise', 38));
    state.orders.push(order(2, 'melt', 44));
    // A burger mid-assembly on plate one: bun and a grilled patty already on it.
    state.plates[0].items = [
      { id: 'bun', prep: 'raw' },
      { id: 'patty', prep: 'grilled' },
    ];
    // Lettuce chopping on the board, bacon on the grill, chef carrying a tomato.
    state.board.item = { id: 'lettuce', prep: 'raw' };
    state.board.progress = 1.2;
    state.grill[0].item = { id: 'bacon', prep: 'raw' };
    state.grill[0].progress = 2.2;
    state.carried = [{ id: 'tomato', prep: 'raw' }];
    state.chef.x = 200;
    state.chef.y = 500;
    state.chef.tx = 200;
    state.chef.ty = 500;
    return { screen: SCREEN_PLAY, best: 84 };
  }

  // serve: a finished burger on a plate in the chef's hands, at the serving window,
  // with the matching order still on the board and the shift clock running.
  state.score = 132;
  state.served = 6;
  state.hearts = 3;
  state.elapsed = 96;
  state.orders.push(order(0, 'burger', 20));
  state.orders.push(order(1, 'stack', 40));
  state.carried = [
    {
      plate: true,
      items: [
        { id: 'bun', prep: 'raw' },
        { id: 'patty', prep: 'grilled' },
        { id: 'lettuce', prep: 'chopped' },
      ],
    },
  ];
  state.chef.x = 900;
  state.chef.y = 620;
  state.chef.tx = 900;
  state.chef.ty = 620;
  return { screen: SCREEN_PLAY, best: 132 };
}
