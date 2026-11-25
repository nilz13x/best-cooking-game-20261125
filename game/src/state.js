// Dapur Kilat — game state and rules. Owns the shift clock, the order
// tickets, the stations (chop board, wok, ready tray), the plate, scoring,
// combo and patience. No drawing here; render.js reads this state.

import { INGREDIENT_BY_ID, PREP_STATE, RECIPES, TIMING, rngFromSeed } from './config.js';

let nextTicketId = 1;

export function createGame(seed = 7) {
  const rng = rngFromSeed(seed);
  return {
    seed,
    rng,
    phase: 'playing', // 'playing' | 'done'
    frozen: false, // shot mode: render a staged frame, never advance time
    time: 0, // seconds since the shift started
    shiftLeft: TIMING.shiftSeconds,
    spawnIn: TIMING.firstOrderAt,
    tickets: [], // { id, recipeId, left, total }
    hand: null, // { id, state } — state: raw | chopped | cooked | ready
    chop: null, // { id, progress, total } | null
    wok: [null, null], // two slots, same shape as chop
    tray: [], // finished items waiting: { id, state }
    plate: [], // ingredient ids on the assembly plate, in add order
    score: 0,
    coins: 0,
    combo: 0,
    lastServeAt: -999,
    served: 0,
    expired: 0,
    patience: TIMING.patience,
    floaters: [], // { x, y, text, sub, life, color }
    shake: 0, // screen shake timer for errors
    flash: null, // { color, life } full-screen flash
    sfxTicked: new Set(), // ticket ids already ticked at 5s
    paused: false,
    muted: false,
    stats: { bestCombo: 0 },
  };
}

export function recipeOf(ticket) {
  return RECIPES.find((r) => r.id === ticket.recipeId);
}

function pickRecipe(rng) {
  const total = RECIPES.reduce((n, r) => n + r.weight, 0);
  let roll = rng() * total;
  for (const r of RECIPES) {
    roll -= r.weight;
    if (roll <= 0) return r.id;
  }
  return RECIPES[0].id;
}

function spawnTicket(game) {
  if (game.tickets.length >= TIMING.maxTickets) return;
  const progress = game.time / TIMING.shiftSeconds;
  const life = TIMING.ticketLifeStart + (TIMING.ticketLifeEnd - TIMING.ticketLifeStart) * progress;
  game.tickets.push({ id: nextTicketId++, recipeId: pickRecipe(game.rng), left: life, total: life });
}

// The plate matches a ticket when it holds exactly that recipe's set.
export function plateMatches(game, ticket) {
  const recipe = recipeOf(ticket);
  if (game.plate.length !== recipe.needs.length) return false;
  return recipe.needs.every((id) => game.plate.includes(id));
}

export function servableTicket(game) {
  return game.tickets.find((t) => plateMatches(game, t)) ?? null;
}

// Which ingredient ids may go on the plate right now: parts of an active
// ticket, in the state that ticket needs, not already on the plate.
export function plateAccepts(game, item) {
  if (game.plate.includes(item.id)) return false;
  return game.tickets.some((t) => {
    const recipe = recipeOf(t);
    if (!recipe.needs.includes(item.id)) return false;
    const need = INGREDIENT_BY_ID[item.id].prep;
    return PREP_STATE[need] === item.state;
  });
}

export function pickBin(game, id) {
  if (game.phase !== 'playing' || game.paused || game.hand) return false;
  // Direct ingredients need no station: they are ready the moment picked.
  const prep = INGREDIENT_BY_ID[id].prep;
  game.hand = { id, state: prep === 'none' ? 'ready' : 'raw' };
  return true;
}

export function trashHand(game) {
  if (!game.hand) return false;
  game.hand = null;
  return true;
}

export function takeTray(game, index) {
  if (game.phase !== 'playing' || game.paused || game.hand) return false;
  const item = game.tray[index];
  if (!item) return false;
  game.tray.splice(index, 1);
  game.hand = item;
  return true;
}

function stationAccepts(station, item) {
  if (station) return false;
  if (!item || item.state !== 'raw') return false;
  return true;
}

export function useChop(game) {
  if (game.phase !== 'playing' || game.paused) return false;
  const item = game.hand;
  if (!item || INGREDIENT_BY_ID[item.id].prep !== 'chop') return false;
  if (!stationAccepts(game.chop, item)) return false;
  game.chop = { id: item.id, progress: 0, total: TIMING.chopSeconds };
  game.hand = null;
  return 'chop';
}

export function useWok(game) {
  if (game.phase !== 'playing' || game.paused) return false;
  const item = game.hand;
  if (!item || INGREDIENT_BY_ID[item.id].prep !== 'wok') return false;
  const slot = game.wok.findIndex((s) => s === null);
  if (slot < 0) return false;
  game.wok[slot] = { id: item.id, progress: 0, total: TIMING.wokSeconds };
  game.hand = null;
  return 'wok';
}

// Collect a finished station job: to the hand when empty, else the tray.
function collectStation(game, get, set, sfx) {
  const job = get();
  if (!job || job.progress < job.total) return false;
  const done = { id: job.id, state: PREP_STATE[INGREDIENT_BY_ID[job.id].prep] };
  set(null);
  if (!game.hand) game.hand = done;
  else if (game.tray.length < 4) game.tray.push(done);
  else {
    set(job); // nowhere to put it: leave it on the station, still done
    return false;
  }
  if (sfx) sfx.done();
  return true;
}

export function collectChop(game, sfx) {
  return collectStation(game, () => game.chop, (v) => { game.chop = v; }, sfx);
}

export function collectWok(game, slot, sfx) {
  return collectStation(game, () => game.wok[slot], (v) => { game.wok[slot] = v; }, sfx);
}

export function addToPlate(game) {
  if (game.phase !== 'playing' || game.paused) return false;
  const item = game.hand;
  if (!item) return false;
  if (!plateAccepts(game, item)) return false;
  game.plate.push(item.id);
  game.hand = null;
  return true;
}

export function serve(game, sfx) {
  if (game.phase !== 'playing' || game.paused) return null;
  const ticket = servableTicket(game);
  if (!ticket) return null;
  const recipe = recipeOf(ticket);
  const now = game.time;
  const combo = now - game.lastServeAt <= TIMING.comboWindow ? Math.min(game.combo + 1, TIMING.comboCap) : 1;
  game.combo = combo;
  game.stats.bestCombo = Math.max(game.stats.bestCombo, combo);
  game.lastServeAt = now;
  const timeBonus = Math.round(ticket.left) * 2;
  const comboBonus = Math.round(recipe.base * 0.1 * (combo - 1));
  const points = recipe.base + timeBonus + comboBonus;
  game.score += points;
  game.coins += Math.floor(points / 10);
  game.served++;
  game.tickets = game.tickets.filter((t) => t.id !== ticket.id);
  game.plate = [];
  game.floaters.push({
    x: 832, y: 258, life: 1.4, color: '#0E7C6B',
    text: `+${points}`, sub: combo > 1 ? `${recipe.name} · kombo x${combo}` : recipe.name,
  });
  if (sfx) { sfx.serve(); sfx.coin(); }
  return { recipe, points, combo };
}

function expireTicket(game, ticket, sfx) {
  game.tickets = game.tickets.filter((t) => t.id !== ticket.id);
  game.expired++;
  game.patience = Math.max(0, game.patience - 1);
  game.combo = 0;
  game.flash = { color: 'rgba(217,43,31,0.25)', life: 0.5 };
  game.floaters.push({
    x: 640, y: 120, life: 1.4, color: '#D92B1F',
    text: 'PESANAN HANGUS', sub: `${recipeOf(ticket).name} kehabisan waktu`,
  });
  if (sfx) sfx.expire();
  if (game.patience <= 0) endShift(game);
}

export function endShift(game) {
  game.phase = 'done';
}

export function update(game, dt, sfx) {
  if (game.phase !== 'playing' || game.paused || game.frozen) return;
  game.time += dt;
  game.shiftLeft = Math.max(0, TIMING.shiftSeconds - game.time);
  if (game.shiftLeft <= 0) {
    endShift(game);
    return;
  }

  // Spawn orders on an escalating schedule.
  game.spawnIn -= dt;
  if (game.spawnIn <= 0) {
    spawnTicket(game);
    const progress = game.time / TIMING.shiftSeconds;
    game.spawnIn = TIMING.spawnStart + (TIMING.spawnEnd - TIMING.spawnStart) * progress;
  }

  // Ticket countdowns.
  for (const t of [...game.tickets]) {
    t.left -= dt;
    if (t.left <= 5 && t.left > 0 && !game.sfxTicked.has(t.id)) {
      game.sfxTicked.add(t.id);
      if (sfx) sfx.tick();
    }
    if (t.left <= 0) expireTicket(game, t, sfx);
  }

  // Station progress.
  if (game.chop) {
    game.chop.progress += dt;
    if (game.chop.progress >= game.chop.total && !game.chop.rang) {
      game.chop.rang = true;
      if (sfx) sfx.done();
    }
  }
  for (const slot of game.wok) {
    if (slot) {
      slot.progress += dt;
      if (slot.progress >= slot.total && !slot.rang) {
        slot.rang = true;
        if (sfx) sfx.done();
      }
    }
  }

  // Floaters and flashes decay.
  for (const f of game.floaters) f.life -= dt;
  game.floaters = game.floaters.filter((f) => f.life > 0);
  if (game.flash) {
    game.flash.life -= dt;
    if (game.flash.life <= 0) game.flash = null;
  }
  if (game.shake > 0) game.shake = Math.max(0, game.shake - dt);
}
