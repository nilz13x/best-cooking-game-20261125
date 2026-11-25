// Dapur Kilat — sound effects. Original WebAudio synth blips: no audio files,
// no network, and every call is guarded so the game plays fine when audio
// is unavailable or the browser blocks it.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.unlocked = false;
  }

  // Create (or resume) the context on the first user gesture. Safe to call anytime.
  unlock() {
    if (this.unlocked) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.unlocked = true;
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _tone(freq, dur, type = 'sine', vol = 0.12, delay = 0, slideTo = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      // Audio must never break the game.
    }
  }

  _noise(dur, vol = 0.1, filterFreq = 1800, delay = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter).connect(gain).connect(this.ctx.destination);
      src.start(t0);
    } catch {
      // Audio must never break the game.
    }
  }

  pick() {
    this._tone(520, 0.07, 'triangle', 0.09, 0, 760);
  }

  chop() {
    this._noise(0.06, 0.16, 2600);
    this._noise(0.06, 0.14, 2200, 0.09);
    this._noise(0.07, 0.16, 2800, 0.18);
  }

  sizzle() {
    this._noise(0.35, 0.07, 5200);
  }

  done() {
    this._tone(660, 0.09, 'sine', 0.1);
    this._tone(880, 0.12, 'sine', 0.1, 0.08);
  }

  plate() {
    this._tone(440, 0.06, 'triangle', 0.09, 0, 560);
  }

  serve() {
    this._tone(523, 0.12, 'sine', 0.12);
    this._tone(659, 0.12, 'sine', 0.12, 0.07);
    this._tone(784, 0.2, 'sine', 0.13, 0.14);
    this._tone(1047, 0.16, 'triangle', 0.08, 0.14);
  }

  coin() {
    this._tone(988, 0.07, 'square', 0.05);
    this._tone(1319, 0.14, 'square', 0.05, 0.06);
  }

  error() {
    this._tone(160, 0.16, 'square', 0.07, 0, 110);
  }

  tick() {
    this._tone(1200, 0.04, 'square', 0.04);
  }

  expire() {
    this._tone(392, 0.14, 'sawtooth', 0.06, 0, 262);
    this._tone(262, 0.22, 'sawtooth', 0.06, 0.12, 196);
  }
}
