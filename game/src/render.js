// Dapur Kilat — rendering. Every pixel of the kitchen, drawn as original
// flat vector art on canvas: no images, no external assets. Reads the state
// from state.js and the layout from config.js; it never mutates the game.

import { FONT, INGREDIENT_BY_ID, INGREDIENTS, LAYOUT, PALETTE, RECIPES, TIMING } from './config.js';
import { binBox, hitRegions, trayBox } from './input.js';
import { plateMatches, recipeOf, servableTicket } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 700, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function mmss(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- food icons: small flat vector drawings, one per ingredient kind ----
function drawIcon(ctx, kind, cx, cy, s) {
  const u = s / 40;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = 2 * u;
  ctx.lineJoin = 'round';
  if (kind === 'rice') {
    ctx.fillStyle = '#FFF6E0';
    ctx.strokeStyle = '#D9C48A';
    ctx.beginPath();
    ctx.ellipse(0, 4 * u, 16 * u, 10 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F3DFBC';
    for (const [gx, gy] of [[-8, -2], [0, -6], [8, -1], [-3, 2], [5, 4]]) {
      ctx.beginPath();
      ctx.ellipse(gx * u, gy * u, 2.4 * u, 1.4 * u, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#58B368';
    ctx.beginPath();
    ctx.ellipse(10 * u, -8 * u, 4 * u, 2 * u, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'noodle') {
    ctx.strokeStyle = '#F7C948';
    ctx.lineWidth = 4 * u;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      for (let px = -16; px <= 16; px += 4) {
        const py = i * 7 * u + Math.sin((px / 16) * Math.PI * 2 + i) * 3 * u;
        if (px === -16) ctx.moveTo(px * u, py);
        else ctx.lineTo(px * u, py);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#D92B1F';
    ctx.beginPath();
    ctx.arc(8 * u, -10 * u, 3 * u, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'drumstick') {
    ctx.fillStyle = '#D98E4A';
    ctx.strokeStyle = '#A8662E';
    ctx.beginPath();
    ctx.ellipse(-2 * u, 2 * u, 13 * u, 11 * u, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F3DFBC';
    ctx.beginPath();
    ctx.ellipse(6 * u, -4 * u, 5 * u, 3.5 * u, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFF6E0';
    ctx.lineWidth = 4 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(12 * u, 10 * u);
    ctx.lineTo(18 * u, 16 * u);
    ctx.stroke();
    ctx.fillStyle = '#FFF6E0';
    ctx.beginPath();
    ctx.arc(19 * u, 17 * u, 3.4 * u, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'egg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E8D9A8';
    ctx.beginPath();
    ctx.ellipse(0, 2 * u, 16 * u, 12 * u, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F7C948';
    ctx.strokeStyle = '#E0A800';
    ctx.beginPath();
    ctx.arc(-1 * u, 1 * u, 7 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FBE07A';
    ctx.beginPath();
    ctx.arc(-3 * u, -1 * u, 2.4 * u, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'leaf') {
    ctx.fillStyle = '#58B368';
    ctx.strokeStyle = '#2F7D3D';
    for (const rot of [-0.5, 0.4]) {
      ctx.save();
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, -6 * u, 7 * u, 13 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = '#2F7D3D';
    ctx.beginPath();
    ctx.moveTo(0, 14 * u);
    ctx.lineTo(0, -16 * u);
    ctx.stroke();
  } else if (kind === 'chili') {
    ctx.fillStyle = '#D92B1F';
    ctx.strokeStyle = '#A81F16';
    ctx.beginPath();
    ctx.moveTo(-14 * u, -6 * u);
    ctx.quadraticCurveTo(0, 16 * u, 15 * u, -10 * u);
    ctx.quadraticCurveTo(4 * u, 2 * u, -14 * u, -6 * u);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#2F7D3D';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(13 * u, -9 * u);
    ctx.quadraticCurveTo(18 * u, -14 * u, 16 * u, -18 * u);
    ctx.stroke();
  } else if (kind === 'bottle') {
    ctx.fillStyle = '#5B2E1E';
    ctx.strokeStyle = '#3A1C11';
    rr(ctx, -7 * u, -12 * u, 14 * u, 26 * u, 4 * u);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-4 * u, -18 * u, 8 * u, 7 * u);
    ctx.fillStyle = '#F2A007';
    ctx.fillRect(-7 * u, -2 * u, 14 * u, 9 * u);
    ctx.fillStyle = '#5B2E1E';
    ctx.font = `700 ${7 * u}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('KECAP', 0, 5 * u);
  } else if (kind === 'glass') {
    ctx.fillStyle = '#E8B34B';
    ctx.strokeStyle = '#A8761F';
    ctx.beginPath();
    ctx.moveTo(-11 * u, -14 * u);
    ctx.lineTo(11 * u, -14 * u);
    ctx.lineTo(8 * u, 14 * u);
    ctx.lineTo(-8 * u, 14 * u);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#C98A2E';
    ctx.fillRect(-11 * u, -14 * u, 22 * u, 5 * u);
    ctx.strokeStyle = '#D92B1F';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(6 * u, -14 * u);
    ctx.lineTo(12 * u, -22 * u);
    ctx.stroke();
  } else if (kind === 'ice') {
    ctx.fillStyle = '#9FE0F0';
    ctx.strokeStyle = '#4FA8C4';
    for (const [ox, oy, rot] of [[-6, -4, 0.3], [7, 5, -0.2]]) {
      ctx.save();
      ctx.translate(ox * u, oy * u);
      ctx.rotate(rot);
      rr(ctx, -8 * u, -8 * u, 16 * u, 16 * u, 3 * u);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.moveTo(-5 * u, -5 * u);
      ctx.lineTo(2 * u, 2 * u);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawIngredientIcon(ctx, id, cx, cy, s) {
  drawIcon(ctx, INGREDIENT_BY_ID[id].icon, cx, cy, s);
}

// ---- pieces of the kitchen ----

function drawTopBar(ctx, game) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = PALETTE.tealDark;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  // Chef hat mark + wordmark.
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.arc(44, 26, 12, Math.PI, 0);
  ctx.arc(58, 26, 9, Math.PI, 0);
  ctx.arc(32, 26, 9, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(30, 26, 30, 8);
  text(ctx, 'DAPUR KILAT', 74, 38, 26, PALETTE.cream, 800);
  // Shift timer, centre.
  const tx = 640;
  text(ctx, 'SHIFT', tx - 150, 24, 12, PALETTE.tealSoft, 700);
  text(ctx, mmss(game.shiftLeft), tx - 150, 50, 30, game.shiftLeft <= 30 ? PALETTE.chili : PALETTE.cream, 800);
  // Score, coins, combo, patience.
  text(ctx, 'SKOR', 860, 22, 11, PALETTE.tealSoft, 700);
  text(ctx, String(game.score), 860, 48, 24, PALETTE.cream, 800);
  text(ctx, 'KOIN', 990, 22, 11, PALETTE.tealSoft, 700);
  text(ctx, `◉ ${game.coins}`, 990, 48, 24, PALETTE.gold, 800);
  text(ctx, 'KOMBO', 1100, 22, 11, PALETTE.tealSoft, 700);
  text(ctx, game.combo > 1 ? `x${game.combo}` : '—', 1100, 48, 24, game.combo > 1 ? PALETTE.gold : PALETTE.cream, 800);
  let hx = 1196;
  for (let i = 0; i < TIMING.patience; i++) {
    ctx.fillStyle = i < game.patience ? PALETTE.chili : 'rgba(255,255,255,0.25)';
    ctx.font = `700 22px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('♥', hx, 42);
    hx -= 26;
  }
}

function drawTicket(ctx, ticket, box, game, now) {
  const recipe = recipeOf(ticket);
  const urgent = ticket.left <= 10;
  const warn = ticket.left <= 20 && !urgent;
  const matched = plateMatches(game, ticket);
  const pulse = urgent ? 0.75 + 0.25 * Math.sin(now * 8) : 1;
  ctx.save();
  if (urgent) ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.cream;
  ctx.strokeStyle = matched ? PALETTE.gold : urgent ? PALETTE.chili : warn ? PALETTE.amber : PALETTE.boardEdge;
  ctx.lineWidth = matched ? 4 : 2.5;
  rr(ctx, box.x, box.y, box.w, box.h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // Ticket number + dish name.
  text(ctx, `#${ticket.id}`, box.x + 12, box.y + 20, 11, PALETTE.inkSoft, 700);
  text(ctx, recipe.name, box.x + 12, box.y + 42, 19, PALETTE.ink, 800);
  // Needed ingredients as mini icons.
  recipe.needs.forEach((id, i) => {
    const cx = box.x + 26 + i * 34;
    const cy = box.y + 68;
    const onPlate = game.plate.includes(id);
    ctx.globalAlpha = onPlate ? 0.35 : 1;
    drawIngredientIcon(ctx, id, cx, cy, 26);
    ctx.globalAlpha = 1;
    if (onPlate) {
      ctx.strokeStyle = PALETTE.teal;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy);
      ctx.lineTo(cx - 2, cy + 6);
      ctx.lineTo(cx + 8, cy - 6);
      ctx.stroke();
    }
  });
  // Countdown bar + seconds.
  const frac = Math.max(0, ticket.left / ticket.total);
  const barX = box.x + 12;
  const barY = box.y + box.h - 16;
  const barW = box.w - 24;
  ctx.fillStyle = '#E5D9BE';
  rr(ctx, barX, barY, barW, 8, 4);
  ctx.fill();
  ctx.fillStyle = urgent ? PALETTE.chili : warn ? PALETTE.amber : PALETTE.teal;
  if (frac > 0) {
    rr(ctx, barX, barY, Math.max(8, barW * frac), 8, 4);
    ctx.fill();
  }
  text(ctx, `${Math.ceil(ticket.left)} dtk`, box.x + box.w - 12, box.y + 20, 13, urgent ? PALETTE.chili : PALETTE.inkSoft, 800, 'right');
  if (matched) {
    ctx.fillStyle = PALETTE.gold;
    rr(ctx, box.x + box.w - 78, box.y + 30, 66, 20, 10);
    ctx.fill();
    text(ctx, 'SIAP!', box.x + box.w - 45, box.y + 45, 12, PALETTE.ink, 800, 'center');
  }
}

function drawBoard(ctx, game, now) {
  const b = LAYOUT.board;
  ctx.fillStyle = PALETTE.board;
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.lineWidth = 3;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.stroke();
  const { w, gap } = LAYOUT.ticket;
  game.tickets.forEach((t, i) => {
    drawTicket(ctx, t, { x: b.x + 12 + i * (w + gap), y: b.y + 6, w, h: 96 }, game, now);
  });
  for (let i = game.tickets.length; i < TIMING.maxTickets; i++) {
    const x = b.x + 12 + i * (w + gap);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    rr(ctx, x, b.y + 6, w, 96, 10);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'menunggu pesanan…', x + w / 2, b.y + 58, 14, 'rgba(255,255,255,0.45)', 600, 'center');
  }
}

function drawBins(ctx, game) {
  text(ctx, 'KONTER BAHAN — klik untuk ambil', LAYOUT.bins.x, LAYOUT.labels.y + 12, 13, PALETTE.teal, 800);
  const regions = hitRegions();
  regions.bins.forEach((box, i) => {
    const g = INGREDIENTS[i];
    const held = game.hand && game.hand.id === g.id;
    ctx.fillStyle = held ? PALETTE.gold : PALETTE.counter;
    ctx.strokeStyle = held ? PALETTE.terracottaDark : PALETTE.counterEdge;
    ctx.lineWidth = held ? 4 : 2;
    rr(ctx, box.x, box.y, box.w, box.h, 12);
    ctx.fill();
    ctx.stroke();
    drawIngredientIcon(ctx, g.id, box.x + box.w / 2, box.y + 38, 44);
    text(ctx, g.name, box.x + box.w / 2, box.y + 78, 14, PALETTE.ink, 800, 'center');
    text(ctx, g.key, box.x + 8, box.y + 18, 11, PALETTE.inkSoft, 700);
    const prep = { chop: 'cincang', wok: 'masak', none: 'langsung' }[g.prep];
    text(ctx, prep, box.x + box.w / 2, box.y + 94, 10, PALETTE.inkSoft, 600, 'center');
  });
}

function progressRing(ctx, cx, cy, r, frac, color) {
  ctx.strokeStyle = '#E5D9BE';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac));
  ctx.stroke();
}

function drawChop(ctx, game, now) {
  const b = LAYOUT.chop;
  ctx.fillStyle = PALETTE.tealSoft;
  ctx.strokeStyle = PALETTE.teal;
  ctx.lineWidth = 2;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'TALENAN — cincang ayam & sayur', b.x + 14, b.y + 22, 13, PALETTE.teal, 800);
  // Wooden board.
  ctx.fillStyle = '#E8C89A';
  ctx.strokeStyle = '#B98A4E';
  ctx.lineWidth = 2;
  rr(ctx, b.x + 16, b.y + 36, 150, 106, 10);
  ctx.fill();
  ctx.stroke();
  const job = game.chop;
  if (job) {
    const wobble = Math.sin(now * 22) * 3;
    drawIngredientIcon(ctx, job.id, b.x + 91, b.y + 88 + wobble * 0.3, 52);
    // Knife.
    ctx.save();
    ctx.translate(b.x + 130, b.y + 62 + wobble);
    ctx.rotate(-0.5);
    ctx.fillStyle = PALETTE.steel;
    rr(ctx, -4, -26, 8, 44, 3);
    ctx.fill();
    ctx.fillStyle = '#5B2E1E';
    ctx.fillRect(-4, 18, 8, 16);
    ctx.restore();
    const done = job.progress >= job.total;
    progressRing(ctx, b.x + 222, b.y + 88, 34, job.progress / job.total, done ? PALETTE.gold : PALETTE.teal);
    text(ctx, done ? 'SIAP!' : `${Math.ceil(job.total - job.progress)} dtk`, b.x + 222, b.y + 93, 13, PALETTE.ink, 800, 'center');
    if (done) text(ctx, 'klik untuk ambil', b.x + 222, b.y + 128, 11, PALETTE.terracottaDark, 700, 'center');
  } else {
    text(ctx, 'kosong', b.x + 145, b.y + 88, 14, PALETTE.inkSoft, 600, 'center');
    text(ctx, 'bawa ayam / sayur ke sini', b.x + 145, b.y + 110, 12, PALETTE.inkSoft, 600, 'center');
  }
}

function drawWok(ctx, game, now) {
  const b = LAYOUT.wok;
  ctx.fillStyle = PALETTE.tealSoft;
  ctx.strokeStyle = PALETTE.teal;
  ctx.lineWidth = 2;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'WOK — masak nasi, mie & telur', b.x + 14, b.y + 22, 13, PALETTE.teal, 800);
  // Two burners.
  game.wok.forEach((slot, i) => {
    const cx = b.x + 78 + i * 134;
    const cy = b.y + 62;
    // Flame.
    const flick = 0.8 + 0.2 * Math.sin(now * 9 + i * 2);
    ctx.fillStyle = slot ? `rgba(242,160,7,${0.85 * flick})` : 'rgba(242,160,7,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 26, 34 * flick, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wok pan.
    ctx.fillStyle = '#3A4442';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, 52, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#55635F';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 52, 18, 0, Math.PI, 0);
    ctx.fill();
    if (slot) {
      drawIngredientIcon(ctx, slot.id, cx, cy - 2, 40);
      const done = slot.progress >= slot.total;
      progressRing(ctx, cx + 44, cy - 22, 13, slot.progress / slot.total, done ? PALETTE.gold : PALETTE.amber);
      if (done) text(ctx, 'SIAP!', cx, cy + 34, 11, PALETTE.terracottaDark, 800, 'center');
    } else {
      text(ctx, 'kosong', cx, cy + 2, 11, 'rgba(255,255,255,0.6)', 700, 'center');
    }
  });
  // Ready tray strip along the bottom of the wok box.
  text(ctx, 'NAMPAN', b.x + 14, b.y + b.h - 44, 11, PALETTE.teal, 800);
  for (let i = 0; i < 4; i++) {
    const tb = trayBox(i);
    ctx.fillStyle = '#FFF9EE';
    ctx.strokeStyle = game.tray[i] ? PALETTE.teal : '#D8CDB4';
    ctx.lineWidth = 2;
    rr(ctx, tb.x, tb.y, tb.w, tb.h, 8);
    ctx.fill();
    ctx.stroke();
    if (game.tray[i]) drawIngredientIcon(ctx, game.tray[i].id, tb.x + tb.w / 2, tb.y + tb.h / 2, 34);
  }
}

function drawTrashHelp(ctx, game) {
  const t = LAYOUT.trash;
  ctx.fillStyle = '#D8CDB4';
  ctx.strokeStyle = '#A89B7E';
  ctx.lineWidth = 2;
  rr(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.fill();
  ctx.stroke();
  // Bin glyph.
  ctx.fillStyle = '#8A7D63';
  ctx.beginPath();
  ctx.moveTo(t.x + 44, t.y + 18);
  ctx.lineTo(t.x + 88, t.y + 18);
  ctx.lineTo(t.x + 84, t.y + 64);
  ctx.lineTo(t.x + 48, t.y + 64);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(t.x + 40, t.y + 12, 52, 6);
  text(ctx, 'SAMPAH (T)', t.x + t.w / 2, t.y + t.h - 8, 10, PALETTE.inkSoft, 700, 'center');
  const h = LAYOUT.help;
  ctx.fillStyle = PALETTE.cream;
  ctx.strokeStyle = PALETTE.teal;
  ctx.lineWidth = 2;
  rr(ctx, h.x, h.y, h.w, h.h, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, '?', h.x + h.w / 2, h.y + 44, 30, PALETTE.teal, 800, 'center');
  text(ctx, 'CARA MAIN (H)', h.x + h.w / 2, h.y + h.h - 8, 10, PALETTE.inkSoft, 700, 'center');
}

function drawPlate(ctx, game, now) {
  const p = LAYOUT.plate;
  const servable = servableTicket(game);
  ctx.fillStyle = PALETTE.tealSoft;
  ctx.strokeStyle = PALETTE.teal;
  ctx.lineWidth = 2;
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'PIRING RAKIT', p.x + 16, p.y + 24, 13, PALETTE.teal, 800);
  // Plate.
  ctx.save();
  if (servable) {
    const glow = 0.5 + 0.3 * Math.sin(now * 6);
    ctx.shadowColor = PALETTE.gold;
    ctx.shadowBlur = 26 * glow;
  }
  ctx.fillStyle = PALETTE.plate;
  ctx.strokeStyle = '#D8CDB4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#EFE6CF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.cx, p.cy, p.r - 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  if (game.plate.length === 0) {
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#C9BFA5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, p.r - 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'klik bahan olahan', p.cx, p.cy - 6, 14, PALETTE.inkSoft, 600, 'center');
    text(ctx, 'untuk merakit', p.cx, p.cy + 14, 14, PALETTE.inkSoft, 600, 'center');
  } else {
    const n = game.plate.length;
    game.plate.forEach((id, i) => {
      const ang = -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2;
      const rad = n === 1 ? 0 : 58;
      drawIngredientIcon(ctx, id, p.cx + Math.cos(ang) * rad, p.cy + Math.sin(ang) * rad, 52);
    });
  }
  // Plate contents as a checklist.
  const target = servable ? recipeOf(servable) : null;
  const label = target ? `${target.name} — lengkap!` : game.plate.length > 0 ? 'merakit…' : 'piring kosong';
  text(ctx, label, p.cx, p.y + p.h - 12, 13, servable ? PALETTE.teal : PALETTE.inkSoft, 800, 'center');
}

function drawServe(ctx, game, now) {
  const s = LAYOUT.serve;
  const servable = servableTicket(game);
  ctx.save();
  if (servable) {
    const glow = 0.5 + 0.3 * Math.sin(now * 6);
    ctx.shadowColor = PALETTE.gold;
    ctx.shadowBlur = 22 * glow;
  }
  ctx.fillStyle = servable ? '#1E9E6A' : '#9AA8A4';
  ctx.strokeStyle = servable ? '#14663F' : '#7A8884';
  ctx.lineWidth = 3;
  rr(ctx, s.x, s.y, s.w, s.h, 16);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  text(ctx, servable ? 'SAJIKAN!' : 'SAJIKAN', s.x + s.w / 2, s.y + 40, 30, '#FFFFFF', 800, 'center');
  text(ctx, servable ? 'piring cocok dengan pesanan' : 'lengkapi piring sesuai pesanan', s.x + s.w / 2, s.y + 64, 12, 'rgba(255,255,255,0.85)', 600, 'center');
}

function drawRecipes(ctx, game) {
  const r = LAYOUT.recipes;
  ctx.fillStyle = PALETTE.tealSoft;
  ctx.strokeStyle = PALETTE.teal;
  ctx.lineWidth = 2;
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'BUKU RESEP', r.x + 14, r.y + 24, 13, PALETTE.teal, 800);
  RECIPES.forEach((recipe, i) => {
    const y = r.y + 36 + i * 72;
    ctx.fillStyle = '#FFF9EE';
    rr(ctx, r.x + 10, y, r.w - 20, 62, 8);
    ctx.fill();
    text(ctx, recipe.name, r.x + 20, y + 20, 14, PALETTE.ink, 800);
    recipe.needs.forEach((id, j) => {
      drawIngredientIcon(ctx, id, r.x + 30 + j * 30, y + 42, 24);
    });
    text(ctx, `${recipe.base} pts`, r.x + r.w - 20, y + 20, 12, PALETTE.terracottaDark, 800, 'right');
  });
}

function drawHand(ctx, game) {
  const h = LAYOUT.hand;
  ctx.fillStyle = '#FFF9EE';
  ctx.strokeStyle = game.hand ? PALETTE.gold : PALETTE.teal;
  ctx.lineWidth = game.hand ? 3 : 2;
  rr(ctx, h.x, h.y, h.w, h.h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'DI TANGAN', h.x + 14, h.y + 22, 11, PALETTE.inkSoft, 700);
  if (game.hand) {
    const g = INGREDIENT_BY_ID[game.hand.id];
    drawIngredientIcon(ctx, game.hand.id, h.x + 46, h.y + 52, 44);
    text(ctx, g.name, h.x + 78, h.y + 44, 16, PALETTE.ink, 800);
    const stateLabel = { raw: 'mentah', chopped: 'cincang ✓', cooked: 'matang ✓', ready: 'siap ✓' }[game.hand.state];
    text(ctx, stateLabel, h.x + 78, h.y + 64, 12, PALETTE.teal, 700);
  } else {
    text(ctx, 'tangan kosong', h.x + 14, h.y + 54, 15, PALETTE.inkSoft, 600);
    text(ctx, 'klik bahan di konter', h.x + 14, h.y + 72, 11, PALETTE.inkSoft, 600);
  }
}

function drawBottomBar(ctx, game) {
  const b = LAYOUT.bottomBar;
  ctx.fillStyle = PALETTE.tealDark;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  text(ctx, 'Klik bahan → cincang / masak → rakit di piring → SAJIKAN sebelum tiket habis', 24, b.y + 24, 15, PALETTE.cream, 700);
  text(ctx, '1–9 bahan · Spasi sajikan · T buang · P jeda · M suara', 24, b.y + 46, 12, PALETTE.tealSoft, 600);
  text(ctx, game.muted ? 'SUARA: MATI (M)' : 'SUARA: HIDUP (M)', 1256, b.y + 24, 12, PALETTE.tealSoft, 700, 'right');
  text(ctx, game.paused ? 'JEDA (P)' : '', 1256, b.y + 46, 12, PALETTE.gold, 700, 'right');
  // Shift progress.
  const sb = LAYOUT.shiftBar;
  const frac = game.time / TIMING.shiftSeconds;
  ctx.fillStyle = '#E5D9BE';
  rr(ctx, sb.x, sb.y, sb.w, sb.h, 7);
  ctx.fill();
  ctx.fillStyle = PALETTE.terracotta;
  if (frac > 0) {
    rr(ctx, sb.x, sb.y, Math.max(14, sb.w * frac), sb.h, 7);
    ctx.fill();
  }
  text(ctx, 'kemajuan shift', sb.x, sb.y - 8, 11, PALETTE.inkSoft, 700);
  text(ctx, `${Math.floor(game.time / 60)}:${String(Math.floor(game.time % 60)).padStart(2, '0')} / 3:00`, sb.x + sb.w, sb.y - 8, 11, PALETTE.inkSoft, 700, 'right');
}

function drawFloaters(ctx, game) {
  for (const f of game.floaters) {
    const a = Math.min(1, f.life / 0.7);
    const rise = (1.4 - f.life) * 34;
    ctx.globalAlpha = a;
    text(ctx, f.text, f.x, f.y - rise, 34, f.color, 800, 'center');
    if (f.sub) text(ctx, f.sub, f.x, f.y - rise + 24, 14, PALETTE.ink, 700, 'center');
    ctx.globalAlpha = 1;
  }
}

function drawHelp(ctx, game) {
  ctx.fillStyle = 'rgba(12,74,66,0.72)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = PALETTE.cream;
  rr(ctx, 340, 130, 600, 500, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.teal;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'CARA MAIN', 640, 176, 30, PALETTE.tealDark, 800, 'center');
  const steps = [
    '1. Klik bahan di konter untuk mengambilnya.',
    '2. Ayam & sayur dicincang di talenan (2 dtk);',
    '    nasi, mie & telur dimasak di wok (3 dtk).',
    '3. Bahan olahan diklik ke piring rakit.',
    '4. Kalau piring cocok dengan pesanan, tekan',
    '    SAJIKAN sebelum tiket habis. Pesanan',
    '    hangus = satu hati hilang.',
  ];
  steps.forEach((s, i) => text(ctx, s, 380, 220 + i * 26, 16, PALETTE.ink, 600));
  text(ctx, 'Kombo: sajikan beruntun dalam 12 detik untuk bonus.', 380, 410, 15, PALETTE.terracottaDark, 700);
  text(ctx, 'Tombol: 1–9 bahan · Spasi sajikan · T buang · P jeda · M suara', 380, 442, 14, PALETTE.inkSoft, 600);
  text(ctx, 'Klik di mana saja untuk kembali', 640, 590, 14, PALETTE.inkSoft, 700, 'center');
}

function drawDone(ctx, game) {
  ctx.fillStyle = 'rgba(12,74,66,0.78)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = PALETTE.cream;
  rr(ctx, 340, 140, 600, 480, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.teal;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'SHIFT SELESAI!', 640, 200, 34, PALETTE.tealDark, 800, 'center');
  const rows = [
    ['Skor akhir', String(game.score)],
    ['Koin', `◉ ${game.coins}`],
    ['Pesanan tersaji', String(game.served)],
    ['Pesanan hangus', String(game.expired)],
    ['Kombo terbaik', `x${Math.max(1, game.stats.bestCombo)}`],
  ];
  rows.forEach(([k, v], i) => {
    const y = 258 + i * 40;
    text(ctx, k, 400, y, 18, PALETTE.inkSoft, 600);
    text(ctx, v, 880, y, 20, PALETTE.ink, 800, 'right');
  });
  const verdict = game.score >= 1500 ? 'Dapur menyala! Kamu layak jadi juru masak kilat.'
    : game.score >= 800 ? 'Shift yang solid — dapur tetap berjalan.'
    : 'Shift berat — coba lagi, rencanakan rutenya.';
  text(ctx, verdict, 640, 486, 16, PALETTE.terracottaDark, 700, 'center');
  text(ctx, 'Klik atau tekan R untuk main lagi', 640, 560, 15, PALETTE.inkSoft, 700, 'center');
}

export function render(ctx, game, now) {
  ctx.save();
  if (game.shake > 0) {
    const s = game.shake * 18;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  // Wall + counter band.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(-20, -20, 1320, 840);
  ctx.fillStyle = PALETTE.wallShadow;
  ctx.fillRect(-20, 172, 1320, 8);
  // Hanging lamps for warmth.
  for (const lx of [200, 640, 1080]) {
    ctx.strokeStyle = '#8A7D63';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 26);
    ctx.stroke();
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.arc(lx, 34, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  drawTopBar(ctx, game);
  drawBoard(ctx, game, now);
  drawBins(ctx, game);
  drawChop(ctx, game, now);
  drawWok(ctx, game, now);
  drawTrashHelp(ctx, game);
  drawPlate(ctx, game, now);
  drawServe(ctx, game, now);
  drawRecipes(ctx, game);
  drawHand(ctx, game);
  drawBottomBar(ctx, game);
  drawFloaters(ctx, game);
  if (game.flash) {
    ctx.fillStyle = game.flash.color;
    ctx.fillRect(-20, -20, 1320, 840);
  }
  if (game.showHelp) drawHelp(ctx, game);
  if (game.paused && game.phase === 'playing') {
    ctx.fillStyle = 'rgba(12,74,66,0.6)';
    ctx.fillRect(0, 0, 1280, 800);
    text(ctx, 'JEDA', 640, 380, 54, PALETTE.cream, 800, 'center');
    text(ctx, 'klik untuk lanjut', 640, 420, 18, PALETTE.tealSoft, 600, 'center');
  }
  if (game.phase === 'done') drawDone(ctx, game);
  ctx.restore();
}
