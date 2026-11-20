/**
 * Audio Alert Utility for AuraStay PMS
 * Uses Web Audio API to synthesize a pleasant, realistic hotel reception desk bell chime ("Ding-Dong")
 * with acoustic overtones that ring and smoothly decay over exactly 3 seconds.
 * 
 * Benefits:
 * - 100% client-side Web Audio API: 0 network requests, 0 external assets, 0 Supabase bandwidth.
 * - Handles browser autoplay policies gracefully.
 */

let sharedAudioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContextClass();
  }

  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }

  return sharedAudioCtx;
}

/**
 * Plays a resonant hotel desk bell chime for 3 seconds
 */
export function playBookingBellSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const duration = 3.0; // Rings for 3 seconds

    // Master Gain for smooth 3s envelope
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.75, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    masterGain.connect(ctx.destination);

    /**
     * Synthesizes a physical bell strike with fundamental + harmonic overtones
     */
    const playBellStrike = (startTime, fundamentalFreq, baseGain = 0.5) => {
      // Harmonic partials typical of a brass service bell
      const partials = [
        { ratio: 1.0, gain: 1.0 },     // Fundamental
        { ratio: 2.02, gain: 0.5 },    // Second partial (octave + slight detune)
        { ratio: 3.03, gain: 0.25 },   // Third partial
        { ratio: 4.22, gain: 0.12 },   // Ringing shimmer
        { ratio: 5.41, gain: 0.06 }    // High bell overtone
      ];

      partials.forEach(({ ratio, gain }) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamentalFreq * ratio, startTime);

        // Strike impulse: instant attack, exponential decay over the remaining time
        const remainingTime = Math.max(0.1, duration - (startTime - now));
        oscGain.gain.setValueAtTime(baseGain * gain, startTime);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + remainingTime);

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + remainingTime);
      });
    };

    // Strike 1: Primary desk bell tone (High C: 1046.5 Hz)
    playBellStrike(now, 1046.5, 0.5);

    // Strike 2: Second chime (E6: 1318.5 Hz) at +0.16s for standard "Ding-Dong" bell chime
    playBellStrike(now + 0.16, 1318.5, 0.45);

  } catch (err) {
    console.warn('[audioAlert] Web Audio bell error:', err);
  }
}
