"use client";

/**
 * Original game-show style countdown music for the LED screen, synthesised live with the
 * Web Audio API (no audio files, no licensed music). An upbeat 124 BPM loop of bass,
 * drums and arpeggio that builds in the last 30 s, ducks under per-second ticks in the
 * last 10 s, then a "time's up" hit and a fanfare for the winner.
 *
 * Browsers only allow audio after a user gesture: call unlock() from a click.
 */

const BPM = 124;
const STEP = 60 / BPM / 4; // one 16th note
const LOOKAHEAD = 0.15; // seconds scheduled ahead
const TICK_MS = 25;

// Am – F – C – G, one bar each.
const PROGRESSION = [
  { root: 110.0, chord: [440.0, 523.25, 659.25] },
  { root: 87.31, chord: [349.23, 440.0, 523.25] },
  { root: 130.81, chord: [523.25, 659.25, 783.99] },
  { root: 98.0, chord: [392.0, 493.88, 587.33] },
];
const BASS_STEPS = new Set([0, 3, 6, 8, 10, 11, 14]);
const ARP_ORDER = [0, 1, 2, 1];

export type Urgency = 0 | 1 | 2;

export class ArenaSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private step = 0;
  private urgency: Urgency = 0;
  private enabled = true;

  get unlocked(): boolean {
    return this.ctx?.state === "running";
  }

  get playing(): boolean {
    return this.timer !== null;
  }

  /** Must be called from a user gesture (click / key). Safe to call repeatedly. */
  async unlock(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.8 : 0;
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);
      this.master.connect(comp).connect(this.ctx.destination);
      this.noise = this.makeNoise();
    }
    if (this.ctx.state !== "running") await this.ctx.resume().catch(() => undefined);
    return this.unlocked;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(on ? 0.8 : 0, this.ctx.currentTime, 0.05);
  }

  setUrgency(level: Urgency) {
    if (level === this.urgency || !this.ctx || !this.musicBus) {
      this.urgency = level;
      return;
    }
    this.urgency = level;
    // Duck the loop under the final-seconds ticks.
    const target = level === 2 ? 0.32 : 0.55;
    this.musicBus.gain.setTargetAtTime(target, this.ctx.currentTime, 0.2);
  }

  startMusic() {
    if (!this.ctx || !this.musicBus || this.timer) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setValueAtTime(0, this.ctx.currentTime);
    this.musicBus.gain.linearRampToValueAtTime(this.urgency === 2 ? 0.32 : 0.55, this.ctx.currentTime + 1.2);
    this.timer = setInterval(() => this.schedule(), TICK_MS);
  }

  stopMusic(fade = 0.4) {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.ctx && this.musicBus) {
      const t = this.ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(t);
      this.musicBus.gain.setTargetAtTime(0, t, fade / 3);
    }
  }

  /** Countdown tick for the last seconds; higher and brighter as zero approaches. */
  tick(secondsLeft: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const freq = 880 + (10 - Math.min(10, secondsLeft)) * 55;
    this.tone(freq, t, 0.09, "square", 0.22, this.master);
    this.tone(freq * 2, t, 0.05, "sine", 0.1, this.master);
    if (secondsLeft <= 3) this.tone(freq * 1.5, t + 0.12, 0.08, "square", 0.16, this.master);
  }

  /** Deep hit + swell when the timer reaches zero. */
  timeUp() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    this.stopMusic(0.15);
    const t = ctx.currentTime + 0.02;
    for (const [f, g] of [
      [55, 0.55],
      [110, 0.35],
      [164.8, 0.18],
      [233, 0.08],
    ] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f * 1.04, t);
      osc.frequency.exponentialRampToValueAtTime(f, t + 0.3);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(g, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      osc.connect(gain).connect(this.master);
      osc.start(t);
      osc.stop(t + 2.5);
    }
    this.noiseHit(t, 1.2, 0.25, 900, "lowpass");
  }

  /** Brass-style fanfare for the winner reveal. */
  fanfare() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + 0.05;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.brass(f, t + i * 0.13, 0.16, 0.18));
    for (const f of [523.25, 659.25, 783.99, 1046.5, 261.63]) this.brass(f, t + 0.55, 1.6, 0.14);
    this.noiseHit(t + 0.55, 1.8, 0.18, 6000, "highpass");
  }

  dispose() {
    this.stopMusic(0.05);
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }

  // ---------------------------------------------------------------------------

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step = (this.step + 1) % 64;
    }
  }

  private playStep(step: number, t: number) {
    const bus = this.musicBus!;
    const bar = PROGRESSION[Math.floor(step / 16) % PROGRESSION.length]!;
    const s = step % 16;
    const hot = this.urgency >= 1;

    if (s % 4 === 0) this.kick(t, bus);
    if (s === 4 || s === 12) this.noiseHit(t, 0.12, 0.28, 1800, "bandpass", bus);
    if (s % 4 === 2 || (hot && s % 2 === 1)) this.noiseHit(t, 0.04, hot ? 0.13 : 0.1, 8000, "highpass", bus);

    if (BASS_STEPS.has(s)) {
      const f = s === 10 || s === 14 ? bar.root * 2 : bar.root;
      this.bass(f, t, STEP * 1.6, bus, hot ? 1400 : 900);
    }

    if (s % 2 === 0 || hot) {
      const idx = ARP_ORDER[(s >> (hot ? 0 : 1)) % ARP_ORDER.length]!;
      const octave = s >= 8 ? 2 : 1;
      this.tone(bar.chord[idx]! * octave, t, STEP * 0.9, "triangle", hot ? 0.07 : 0.055, bus);
    }
  }

  private kick(t: number, out: AudioNode) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.9, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  private bass(freq: number, t: number, dur: number, out: AudioNode, cutoff: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.Q.value = 6;
    filter.frequency.setValueAtTime(cutoff, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.32, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filter).connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private tone(freq: number, t: number, dur: number, type: OscillatorType, level: number, out: AudioNode) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private brass(freq: number, t: number, dur: number, level: number) {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.06);
    filter.frequency.exponentialRampToValueAtTime(1400, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.03);
    gain.gain.setTargetAtTime(level * 0.7, t + 0.08, 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    filter.connect(gain).connect(this.master!);
    for (const detune of [-7, 7]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
  }

  private noiseHit(
    t: number,
    dur: number,
    level: number,
    freq: number,
    type: BiquadFilterType,
    out: AudioNode = this.master!,
  ) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = this.noise;
    filter.type = type;
    filter.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(out);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private makeNoise(): AudioBuffer {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}
