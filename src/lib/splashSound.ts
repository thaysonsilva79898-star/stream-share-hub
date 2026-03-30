// Generates a cinematic splash sound effect using Web Audio API
// Singleton guard: ensures sound plays exactly once, never overlaps

let hasPlayed = false;
let isPlaying = false;
let audioCtx: AudioContext | null = null;

export function playSplashSound() {
  // Guard: never play twice
  if (hasPlayed || isPlaying) return;
  isPlaying = true;
  hasPlayed = true;

  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx;

    // Deep bass hit
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = "sine";
    bassOsc.frequency.setValueAtTime(80, ctx.currentTime);
    bassOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8);
    bassGain.gain.setValueAtTime(0.5, ctx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(ctx.currentTime);
    bassOsc.stop(ctx.currentTime + 0.8);

    // Bright shimmer
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = "triangle";
    shimmerOsc.frequency.setValueAtTime(2000, ctx.currentTime + 0.1);
    shimmerOsc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 1.2);
    shimmerGain.gain.setValueAtTime(0, ctx.currentTime);
    shimmerGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.15);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmerOsc.start(ctx.currentTime + 0.1);
    shimmerOsc.stop(ctx.currentTime + 1.2);

    // Clean up
    setTimeout(() => {
      isPlaying = false;
      if (audioCtx) {
        audioCtx.close().catch(() => {});
        audioCtx = null;
      }
    }, 2000);
  } catch {
    isPlaying = false;
  }
}
