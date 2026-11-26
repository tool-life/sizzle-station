# Sizzle Station

[![Make the best cooking game](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/tool-life/sizzle-station/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/tool-life/sizzle-station/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

A complete 2D cooking game for the make.fun competition
[Make the best cooking game](https://make.fun/c/best-cooking-game-20261125-0137).
Run the lunch rush: read the order board, chop veggies, grill patties, plate
dishes and ring the bell before the customers walk out.

## How to play

- **Move:** WASD / arrow keys, or click anywhere to walk there. Clicking a
  station walks the chef to it and uses it on arrival.
- **Use a station:** `E` (or click the station). Pick up an ingredient from the
  bins, chop veggies on the chopping board (2 s), grill patties and bacon on
  the grill (2.5 s — leave them and they burn), put the finished parts on a
  plate, then carry the plate to the serving window and ring the bell.
- **Serve:** a plate only counts when it holds exactly the recipe's parts.
  A wrong plate is sent back. A finished dish earns its price plus a tip for
  the patience left on its ticket.
- **The rush:** a 150-second shift. New orders arrive faster as it goes on
  (every ~14 s at first, every ~6 s near the end). A ticket that runs out
  costs a heart; three lost hearts end the shift. Serving three dishes in a
  row without a miss builds a combo that pays up to +50%.
- **Other keys:** `Space` starts / restarts, `P` or `Esc` pauses. The best
  score is kept in the browser.

## Recipes

| Dish | Price | Parts |
| --- | --- | --- |
| Garden Salad | $12 | chopped lettuce, chopped tomato |
| Classic Burger | $18 | bun, grilled patty, chopped lettuce |
| Cheese Melt | $14 | bread, cheese, chopped tomato |
| Sunrise Plate | $16 | egg, bacon, bread |
| Double Stack | $22 | bun, grilled patty, grilled patty, cheese |
| Veggie Delight | $15 | chopped lettuce, chopped tomato, chopped onion |

The chef carries two items at most (one of them can be a plate). Burned food
and wrong parts go in the trash.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `game/` is plain static files
(`game/index.html` and its ES modules, no libraries). The screenshots in
`screenshots/` are real renders of the game in a headless browser
(`?shot=start|play|serve&seed=1` stages each scene).

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored `vendor/makefun-game.ts` library.

## Files

- `game/src/kitchen.js` — the game's rules and state (chef, stations, orders,
  scoring, combos), with no drawing and no browser in it
- `game/src/recipes.js` — the ingredients and the six recipes
- `game/src/config.js` — numbers and the kitchen layout
- `game/src/render.js` — all canvas drawing
- `game/src/input.js` — keyboard and pointer input
- `game/src/shots.js` — staged scenes for the screenshots
- `game/src/random.js` — seeded random numbers
- `game/src/main.js` — boot, the game loop and the screens

Everything here is original: the name, the art (drawn in code) and the sounds
(tiny synthesized beeps, no files).
