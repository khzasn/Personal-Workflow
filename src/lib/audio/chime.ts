/**
 * src/lib/audio/chime.ts
 * Generator suara bel pengingat (Zen Chime) menggunakan Web Audio API.
 * Menghasilkan dua nada harmonis lembut (D5: 587Hz & A5: 880Hz).
 * Tidak memerlukan berkas mp3 eksternal dan bekerja 100% offline.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    const AudioContextClass =
      window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioContextClass();
    }

    if (sharedAudioCtx.state === "suspended") {
      void sharedAudioCtx.resume();
    }

    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Memainkan nada bel zen dua ketukan lembut (D5 lalu A5).
 */
export function playZenChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Nada 1: D5 (587.33 Hz)
  playTone(ctx, 587.33, now, 0.22, 0.25);

  // Nada 2: A5 (880 Hz) - interval fifth di atasnya, dimulai 120ms kemudian
  playTone(ctx, 880.0, now + 0.12, 0.55, 0.3);
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);

  // Envelope lembut (Attack -> Decay)
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}
