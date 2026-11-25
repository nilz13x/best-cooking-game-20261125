# Dapur Kilat — warung cepat saji

[![Dapur Kilat](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

**Dapur Kilat** (Lightning Kitchen) is an original single-screen time-management cooking game: a three-minute shift in a small Indonesian warung. Order tickets land on the board with a countdown, you grab ingredients off the counter, chop them on the board or fry them in the wok, assemble the dish on the plate, and serve it before the ticket burns out. Serve in a streak to build a combo; let a ticket expire and you lose one of three patience hearts.

## How to play

1. Click an ingredient bin (or press 1–9) to pick it up.
2. Ayam and sayur go on the **talenan** to be chopped (2 s); nasi, mie and telur go in the **wok** (3 s). Sambal, kecap, teh and es go straight to the plate.
3. Click the **piring rakit** to add a prepared ingredient. The plate only accepts what an active order needs.
4. When the plate matches an order exactly, **SAJIKAN!** lights up — serve before the ticket runs out. `Space` serves, `T` throws away what is in hand, `P` pauses, `M` mutes, `H` shows how to play.

## Recipes

- **Nasi Goreng Kilat** (120 pts) — nasi, telur, ayam, kecap
- **Mie Ayam Geprek** (100 pts) — mie, ayam, sambal
- **Sate Kilat** (110 pts) — ayam, sayur, kecap
- **Es Teh Melati** (50 pts) — teh, es (fast, no cooking)

Points grow with the time left on the ticket and with your combo (up to +50%).

## Tech

- Plain static files under `game/`: one HTML page and ES modules on canvas 2D — no libraries, no network requests, no build step. Open `game/index.html` in desktop Chrome and play.
- Original flat vector art drawn in code, and original WebAudio synth sounds (chop, sizzle, ding, serve) that fail safe when audio is unavailable.
- `?shot=1/2/3/4` stages real renders of the game's own code for screenshots (cover, assembly, serve, rush).
- `main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library: `MAKEFUN_OUTPUT_DIR=out node main.ts`.

<sub>Entered on [make.fun](https://make.fun/?ref=wez2e129&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
