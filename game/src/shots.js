// Dapur Kilat — staged screenshot states. Each shot builds a real game
// state with the game's own code (tickets, plate, stations, score), then
// freezes the clock so the frame renders exactly the same every time.
// ?shot=1 cover: full kitchen mid-rush, all five judge elements at once.
// ?shot=2 assembly: a dish mid-assembly, hand holding the next ingredient.
// ?shot=3 serve: a completed plate, serve moment with combo.
// ?shot=4 rush: four tickets at once, under a minute left, a quick drink ready.
// Aliases from the starter's shots.json: start -> 2, play -> 1, end -> 3.

import { TIMING } from './config.js';

function ticket(id, recipeId, left, total) {
  return { id, recipeId, left, total };
}

export function stageShot(game, shot, seed = 7) {
  const jitter = (seed % 5) * 2;
  game.frozen = true;
  game.showHelp = false;
  game.paused = false;
  game.floaters = [];
  game.flash = null;
  game.tray = [];
  game.hand = null;

  if (shot === 1) {
    // Cover: mid-rush. Plate complete (ready to serve), wok and chop busy,
    // three tickets, one nearly out of time, combo running.
    game.time = 96 + jitter;
    game.shiftLeft = 84 - jitter;
    game.score = 1240 + jitter * 10;
    game.coins = 86;
    game.combo = 3;
    game.lastServeAt = game.time - 6;
    game.served = 9;
    game.patience = 3;
    game.tickets = [
      ticket(7, 'nasi-goreng', 12, 45),
      ticket(8, 'mie-ayam', 31, 45),
      ticket(9, 'sate', 44, 45),
    ];
    game.plate = ['nasi', 'telur', 'ayam', 'kecap'];
    game.chop = { id: 'ayam', progress: 0.8, total: TIMING.chopSeconds };
    game.wok = [
      { id: 'mie', progress: 1.8, total: TIMING.wokSeconds },
      null,
    ];
  } else if (shot === 2) {
    // Assembly: plate holds two of four, hand carries the next ingredient.
    game.time = 48 + jitter;
    game.shiftLeft = 132 - jitter;
    game.score = 640 + jitter * 10;
    game.coins = 41;
    game.combo = 2;
    game.lastServeAt = game.time - 8;
    game.served = 5;
    game.patience = 3;
    game.tickets = [
      ticket(4, 'nasi-goreng', 38, 45),
      ticket(5, 'mie-ayam', 24, 45),
    ];
    game.plate = ['nasi', 'telur'];
    game.hand = { id: 'kecap', state: 'ready' };
    game.chop = null;
    game.wok = [
      { id: 'telur', progress: 0.9, total: TIMING.wokSeconds },
      null,
    ];
  } else if (shot === 3) {
    // Serve: completed plate, big combo, one ticket about to expire.
    game.time = 133 + jitter;
    game.shiftLeft = 47 - jitter;
    game.score = 2180 + jitter * 10;
    game.coins = 153;
    game.combo = 5;
    game.lastServeAt = game.time - 4;
    game.served = 16;
    game.patience = 2;
    game.tickets = [ticket(11, 'sate', 8, 45)];
    game.plate = ['ayam', 'sayur', 'kecap'];
    game.hand = null;
    game.chop = null;
    game.wok = [null, null];
    game.tray = [{ id: 'teh', state: 'ready' }];
    game.floaters.push({
      x: 832, y: 258, life: 1.4, color: '#0E7C6B',
      text: '+165', sub: 'Sate Kilat · kombo x5',
    });
  } else if (shot === 4) {
    // Rush: four tickets at once, under a minute left, a quick drink ready.
    game.time = 122 + jitter;
    game.shiftLeft = 58 - jitter;
    game.score = 1870 + jitter * 10;
    game.coins = 121;
    game.combo = 4;
    game.lastServeAt = game.time - 5;
    game.served = 13;
    game.patience = 2;
    game.tickets = [
      ticket(12, 'nasi-goreng', 9, 45),
      ticket(13, 'mie-ayam', 18, 45),
      ticket(14, 'sate', 27, 45),
      ticket(15, 'es-teh', 36, 45),
    ];
    game.plate = ['teh', 'es'];
    game.hand = null;
    game.chop = { id: 'sayur', progress: 1.2, total: TIMING.chopSeconds };
    game.wok = [
      { id: 'nasi', progress: 2.4, total: TIMING.wokSeconds },
      { id: 'mie', progress: 1.1, total: TIMING.wokSeconds },
    ];
    game.tray = [{ id: 'sambal', state: 'ready' }];
  }
  return game;
}

export function shotFromQuery(query) {
  const shot = query.get('shot');
  if (!shot) return 0;
  if (shot === 'start') return 2;
  if (shot === 'play') return 1;
  if (shot === 'end') return 3;
  const n = Number(shot);
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : 0;
}
