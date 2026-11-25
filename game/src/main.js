// Dapur Kilat — boot and main loop. Wires the canvas, input, sound and
// state together, runs the frame loop, and exposes the game for testing
// (window.__game) so a headless play-test can drive real clicks.

import { H, W } from './config.js';
import { Sfx } from './audio.js';
import { createGame, update } from './state.js';
import { attachInput } from './input.js';
import { render } from './render.js';
import { shotFromQuery, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const sfx = new Sfx();

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 7) || 7;
const game = createGame(seed);
game.showHelp = false;

const shot = shotFromQuery(params);
if (shot > 0) stageShot(game, shot, seed);

// First order arrives immediately so the board is alive from frame one.
if (shot === 0) game.spawnIn = 0;

let showHelp = false;
Object.defineProperty(game, 'showHelp', {
  get: () => showHelp,
  set: (v) => { showHelp = v; },
  configurable: true,
});

attachInput(canvas, game, sfx, {
  onToggleHelp: () => { showHelp = !showHelp; },
  onRestart: () => {
    const fresh = createGame(seed);
    Object.assign(game, fresh);
    game.spawnIn = 0;
    game.showHelp = false;
  },
});

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform((canvas.width / W) * 1, 0, 0, (canvas.height / H) * 1, 0, 0);
  // Keep the 16:10 kitchen undistorted: letterbox by the shorter axis.
  const scale = Math.min(canvas.width / W, canvas.height / H);
  const ox = (canvas.width - W * scale) / 2;
  const oy = (canvas.height - H * scale) / 2;
  ctx.setTransform(scale, 0, 0, scale, ox, oy);
}
window.addEventListener('resize', resize);
resize();

let last = performance.now();
let statusTick = 0;
function frame(now) {
  // Clamp below at 0: the first frame's timestamp can predate module load.
  const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
  last = now;
  update(game, dt, sfx);
  render(ctx, game, now / 1000);
  statusTick += dt;
  if (statusTick > 1) {
    statusTick = 0;
    const serving = game.tickets.length;
    statusEl.textContent =
      game.phase === 'done'
        ? `Shift selesai. Skor ${game.score}, ${game.served} pesanan tersaji.`
        : `Skor ${game.score}, ${serving} pesanan aktif, ${Math.ceil(game.shiftLeft)} detik tersisa.`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Test handle: the play-test drives clicks and reads state through this.
window.__game = game;
window.__sfx = sfx;
