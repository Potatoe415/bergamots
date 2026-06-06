let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playNote(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration);
}

export function playTurnSound() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // AudioContext unavailable (SSR / old browser)
  }
}

// Ascending arpeggio: C5 – E5 – G5 – C6
export function playWinSound() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const notes = [523.25, 659.25, 784, 1046.5];
    notes.forEach((freq, i) => playNote(ctx, freq, ctx.currentTime + i * 0.13, 0.35, 0.28, 'sine'));
  } catch {
    // AudioContext unavailable (SSR / old browser)
  }
}

// Descending minor fall: A4 – F4 – D4
export function playLoseSound() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const notes = [440, 349.23, 293.66];
    notes.forEach((freq, i) => playNote(ctx, freq, ctx.currentTime + i * 0.32, 0.5, 0.28, 'triangle'));
  } catch {
    // AudioContext unavailable (SSR / old browser)
  }
}
