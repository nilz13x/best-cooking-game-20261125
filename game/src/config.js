// Dapur Kilat — configuration: palette, layout, ingredients, recipes, timings.
// One job: every tunable number and name lives here, so the other files
// never hard-code a colour, a position or a recipe.

export const W = 1280;
export const H = 800;

// Warung palette: deep teal does the structural work, cream is the wall,
// terracotta warms the counters, chili red is reserved for urgency only.
export const PALETTE = {
  wall: '#FFF3DF',
  wallShadow: '#F3DFBC',
  tealDark: '#0C4A42',
  teal: '#0E7C6B',
  tealSoft: '#DDF0E8',
  terracotta: '#C65D3B',
  terracottaDark: '#9E4527',
  chili: '#D92B1F',
  amber: '#F2A007',
  cream: '#FFF9EE',
  ink: '#22312E',
  inkSoft: '#5A6B66',
  board: '#123B33',
  boardEdge: '#0A2A24',
  counter: '#E8B98A',
  counterEdge: '#C98F5C',
  steel: '#C9D4D2',
  plate: '#FFFFFF',
  gold: '#FFC93C',
};

export const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

// Logical layout. The canvas is W x H; input and render both use these boxes.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: W, h: 56 },
  board: { x: 30, y: 64, w: 1220, h: 108 },
  ticket: { w: 296, h: 96, gap: 12 },
  labels: { y: 184 },
  bins: { x: 24, y: 210, cell: 100, gap: 10, cols: 3, rows: 3 },
  chop: { x: 350, y: 210, w: 290, h: 158 },
  wok: { x: 350, y: 384, w: 290, h: 158 },
  trash: { x: 350, y: 558, w: 132, h: 82 },
  help: { x: 496, y: 558, w: 144, h: 82 },
  plate: { x: 664, y: 210, w: 336, h: 330, cx: 832, cy: 372, r: 128 },
  serve: { x: 664, y: 556, w: 336, h: 84 },
  recipes: { x: 1024, y: 210, w: 232, h: 330 },
  hand: { x: 1024, y: 556, w: 232, h: 84 },
  bottomBar: { x: 0, y: 664, w: W, h: 56 },
  shiftBar: { x: 24, y: 740, w: 1232, h: 14 },
};

// Ingredients. prep: 'chop' (2s on the board), 'wok' (3s in the wok), 'none' (straight to the plate).
export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', prep: 'wok', color: '#FFF6E0', icon: 'rice' },
  { id: 'mie', name: 'Mie', key: '2', prep: 'wok', color: '#F7C948', icon: 'noodle' },
  { id: 'ayam', name: 'Ayam', key: '3', prep: 'chop', color: '#E8A87C', icon: 'drumstick' },
  { id: 'telur', name: 'Telur', key: '4', prep: 'wok', color: '#FDF3C4', icon: 'egg' },
  { id: 'sayur', name: 'Sayur', key: '5', prep: 'chop', color: '#58B368', icon: 'leaf' },
  { id: 'sambal', name: 'Sambal', key: '6', prep: 'none', color: '#D92B1F', icon: 'chili' },
  { id: 'kecap', name: 'Kecap', key: '7', prep: 'none', color: '#5B2E1E', icon: 'bottle' },
  { id: 'teh', name: 'Teh', key: '8', prep: 'none', color: '#C98A2E', icon: 'glass' },
  { id: 'es', name: 'Es', key: '9', prep: 'none', color: '#7FD4E8', icon: 'ice' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((g) => [g.id, g]));

// Recipes. needs lists ingredient ids; the plate must hold exactly that set,
// each in its required state, to serve the ticket.
export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng Kilat', needs: ['nasi', 'telur', 'ayam', 'kecap'], base: 120, weight: 3 },
  { id: 'mie-ayam', name: 'Mie Ayam Geprek', needs: ['mie', 'ayam', 'sambal'], base: 100, weight: 3 },
  { id: 'sate', name: 'Sate Kilat', needs: ['ayam', 'sayur', 'kecap'], base: 110, weight: 3 },
  { id: 'es-teh', name: 'Es Teh Melati', needs: ['teh', 'es'], base: 50, weight: 1 },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Timing and scoring.
export const TIMING = {
  shiftSeconds: 180,
  firstOrderAt: 0,
  spawnStart: 14,
  spawnEnd: 7,
  ticketLifeStart: 45,
  ticketLifeEnd: 30,
  chopSeconds: 2.0,
  wokSeconds: 3.0,
  maxTickets: 4,
  patience: 3,
  comboWindow: 12,
  comboCap: 5,
};

export const PREP_LABEL = { chop: 'Cincang', wok: 'Masak', none: 'Langsung' };
export const PREP_STATE = { chop: 'chopped', wok: 'cooked', none: 'ready' };
export const PREP_STATE_LABEL = { chopped: 'cincang', cooked: 'matang', ready: 'siap' };

// Deterministic RNG (mulberry32) so a seed replays the same orders.
export function rngFromSeed(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
