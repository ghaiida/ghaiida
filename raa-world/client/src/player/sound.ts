// Gentle synthesized sound effects (no audio files). Created on the first user tap.
export interface Sfx {
  correct(): void;
  wrong(): void;
  unlock(): void;
  win(): void;
  step(): void;
  setMuted(m: boolean): void;
  muted(): boolean;
}

export function createSfx(initiallyMuted: boolean): Sfx {
  let ctx: AudioContext | null = null;
  let muted = initiallyMuted;
  const audio = () => {
    if (muted) return null;
    try {
      ctx ??= new AudioContext();
      if (ctx.state === 'suspended') void ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  };
  const tone = (freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.08) => {
    const c = audio();
    if (!c) return;
    const t = c.currentTime + start;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  };
  return {
    correct: () => {
      tone(660, 0, 0.16);
      tone(880, 0.1, 0.22);
    },
    wrong: () => tone(240, 0, 0.25, 'triangle', 0.06),
    unlock: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.2)),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'sine', 0.09)),
    step: () => tone(1250, 0, 0.03, 'sine', 0.015),
    setMuted: (m) => {
      muted = m;
    },
    muted: () => muted,
  };
}
