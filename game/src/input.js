// Dapur Kilat — input. Mouse clicks and keyboard, resolved against the
// layout boxes from config.js. One job: turn a pointer or key into a game
// action, and report what happened so main.js can play the right sound.

import { INGREDIENTS, LAYOUT } from './config.js';
import {
  addToPlate, collectChop, collectWok, pickBin, serve, takeTray, trashHand,
  useChop, useWok,
} from './state.js';

export function binBox(i) {
  const { x, y, cell, gap, cols } = LAYOUT.bins;
  const col = i % cols;
  const row = Math.floor(i / cols);
  return { x: x + col * (cell + gap), y: y + row * (cell + gap), w: cell, h: cell };
}

export function hitRegions() {
  return {
    bins: INGREDIENTS.map((g, i) => ({ ...binBox(i), id: g.id })),
    chop: LAYOUT.chop,
    wok: LAYOUT.wok,
    trash: LAYOUT.trash,
    help: LAYOUT.help,
    plate: LAYOUT.plate,
    serve: LAYOUT.serve,
    hand: LAYOUT.hand,
    recipes: LAYOUT.recipes,
  };
}

const inside = (box, x, y) => x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;

// The tray sits as a strip of small slots under the wok, inside the wok box's
// lower edge: four 56px slots starting at the wok's left.
export function trayBox(i) {
  return { x: LAYOUT.wok.x + 8 + i * 64, y: LAYOUT.wok.y + LAYOUT.wok.h - 62, w: 56, h: 52 };
}

export function attachInput(canvas, game, sfx, hooks) {
  const toLogical = (e) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 1280,
      y: ((e.clientY - r.top) / r.height) * 800,
    };
  };

  const fail = () => {
    game.shake = 0.25;
    sfx.error();
  };

  canvas.addEventListener('pointerdown', (e) => {
    sfx.unlock();
    if (game.phase === 'done') {
      hooks.onRestart();
      return;
    }
    if (game.paused) {
      game.paused = false;
      return;
    }
    const { x, y } = toLogical(e);
    const regions = hitRegions();

    // Ingredient bins.
    for (const b of regions.bins) {
      if (inside(b, x, y)) {
        if (pickBin(game, b.id)) sfx.pick();
        else fail();
        return;
      }
    }
    // Ready tray.
    for (let i = 0; i < game.tray.length; i++) {
      if (inside(trayBox(i), x, y)) {
        if (takeTray(game, i)) sfx.pick();
        else fail();
        return;
      }
    }
    // Chopping board: collect a finished job, else start chopping.
    if (inside(regions.chop, x, y)) {
      if (game.chop && game.chop.progress >= game.chop.total) {
        if (!collectChop(game, sfx)) fail();
        return;
      }
      const r = useChop(game);
      if (r === 'chop') sfx.chop();
      else fail();
      return;
    }
    // Wok: collect a finished slot first, else start cooking.
    if (inside(regions.wok, x, y)) {
      const doneSlot = game.wok.findIndex((s) => s && s.progress >= s.total);
      if (doneSlot >= 0) {
        if (!collectWok(game, doneSlot, sfx)) fail();
        return;
      }
      const r = useWok(game);
      if (r === 'wok') sfx.sizzle();
      else fail();
      return;
    }
    // Assembly plate.
    if (inside(regions.plate, x, y)) {
      if (addToPlate(game)) sfx.plate();
      else fail();
      return;
    }
    // Serve button.
    if (inside(regions.serve, x, y)) {
      if (!serve(game, sfx)) fail();
      return;
    }
    // Trash: drop what is in hand.
    if (inside(regions.trash, x, y)) {
      if (trashHand(game)) sfx.pick();
      else fail();
      return;
    }
    // Help card: toggle the how-to overlay.
    if (inside(regions.help, x, y)) {
      hooks.onToggleHelp();
      return;
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (game.phase === 'done') {
      if (k === 'r' || k === 'enter') hooks.onRestart();
      return;
    }
    if (k === 'p') {
      game.paused = !game.paused;
      return;
    }
    if (k === 'm') {
      game.muted = sfx.toggleMute();
      return;
    }
    if (k === 'h') {
      hooks.onToggleHelp();
      return;
    }
    if (game.paused) return;
    if (k >= '1' && k <= '9') {
      const g = INGREDIENTS[Number(k) - 1];
      if (g) {
        if (pickBin(game, g.id)) sfx.pick();
        else fail();
      }
      return;
    }
    if (k === ' ') {
      e.preventDefault();
      if (!serve(game, sfx)) fail();
      return;
    }
    if (k === 't') {
      if (trashHand(game)) sfx.pick();
      else fail();
    }
  });
}
