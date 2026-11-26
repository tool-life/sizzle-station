// The pantry: every ingredient, how it must be prepared, and every recipe the order
// board can ask for. A recipe is a list of (ingredient, preparation) pairs; a plate
// matches it when its items are exactly that multiset.

export const PREP_RAW = 'raw';
export const PREP_CHOPPED = 'chopped';
export const PREP_GRILLED = 'grilled';
export const PREP_BURNED = 'burned';

export const INGREDIENTS = {
  tomato: { name: 'Tomato', short: 'Tom', color: '#e5534b', chop: true, grill: false },
  lettuce: { name: 'Lettuce', short: 'Let', color: '#7ec850', chop: true, grill: false },
  onion: { name: 'Onion', short: 'Oni', color: '#d9c2e8', chop: true, grill: false },
  patty: { name: 'Patty', short: 'Pat', color: '#8a5a3b', chop: false, grill: true },
  bacon: { name: 'Bacon', short: 'Bac', color: '#c94f5e', chop: false, grill: true },
  egg: { name: 'Egg', short: 'Egg', color: '#f6e8c8', chop: false, grill: true },
  bun: { name: 'Bun', short: 'Bun', color: '#e0a458', chop: false, grill: false },
  cheese: { name: 'Cheese', short: 'Chz', color: '#f2c94c', chop: false, grill: false },
  bread: { name: 'Bread', short: 'Brd', color: '#d9b06a', chop: false, grill: false },
};

export const INGREDIENT_IDS = Object.keys(INGREDIENTS);

/** What preparation a fresh ingredient of this kind needs before it can be plated. */
export function requiredPrep(id) {
  if (INGREDIENTS[id].chop) return PREP_CHOPPED;
  if (INGREDIENTS[id].grill) return PREP_GRILLED;
  return PREP_RAW;
}

export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    price: 12,
    needs: [
      { id: 'lettuce', prep: PREP_CHOPPED },
      { id: 'tomato', prep: PREP_CHOPPED },
    ],
  },
  {
    id: 'burger',
    name: 'Classic Burger',
    price: 18,
    needs: [
      { id: 'bun', prep: PREP_RAW },
      { id: 'patty', prep: PREP_GRILLED },
      { id: 'lettuce', prep: PREP_CHOPPED },
    ],
  },
  {
    id: 'melt',
    name: 'Cheese Melt',
    price: 14,
    needs: [
      { id: 'bread', prep: PREP_RAW },
      { id: 'cheese', prep: PREP_RAW },
      { id: 'tomato', prep: PREP_CHOPPED },
    ],
  },
  {
    id: 'sunrise',
    name: 'Sunrise Plate',
    price: 16,
    needs: [
      { id: 'egg', prep: PREP_GRILLED },
      { id: 'bacon', prep: PREP_GRILLED },
      { id: 'bread', prep: PREP_RAW },
    ],
  },
  {
    id: 'stack',
    name: 'Double Stack',
    price: 22,
    needs: [
      { id: 'bun', prep: PREP_RAW },
      { id: 'patty', prep: PREP_GRILLED },
      { id: 'patty', prep: PREP_GRILLED },
      { id: 'cheese', prep: PREP_RAW },
    ],
  },
  {
    id: 'veggie',
    name: 'Veggie Delight',
    price: 15,
    needs: [
      { id: 'bread', prep: PREP_RAW },
      { id: 'lettuce', prep: PREP_CHOPPED },
      { id: 'tomato', prep: PREP_CHOPPED },
      { id: 'onion', prep: PREP_CHOPPED },
    ],
  },
];

/** True when the items on a plate are exactly the recipe's needs (order does not matter). */
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const wanted = recipe.needs.map((n) => `${n.id}:${n.prep}`).sort();
  const have = plateItems.map((i) => `${i.id}:${i.prep}`).sort();
  return wanted.every((w, index) => w === have[index]);
}

/** True when every item on the plate is part of the recipe (a partial, still-valid build). */
export function plateFitsRecipe(plateItems, recipe) {
  const wanted = recipe.needs.map((n) => `${n.id}:${n.prep}`);
  const have = plateItems.map((i) => `${i.id}:${i.prep}`);
  const pool = [...wanted];
  return have.every((h) => {
    const at = pool.indexOf(h);
    if (at === -1) return false;
    pool.splice(at, 1);
    return true;
  });
}
