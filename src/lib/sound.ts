import { Platform } from 'react-native';

// Crystal clear, pleasant luxury success chime URL
const SUCCESS_CHIME_URL = 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3';

export async function playTransactionSuccessSound() {
  try {
    if (Platform.OS === 'web') {
      // Use Web Audio API for zero latency immediate bell chime
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContext();

          // Harmonic Chime 1 (F#5)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(739.99, ctx.currentTime);
          gain1.gain.setValueAtTime(0.35, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start();
          osc1.stop(ctx.currentTime + 0.45);

          // Harmonic Chime 2 (C#6 - delayed by 80ms)
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.08);
          gain2.gain.setValueAtTime(0.001, ctx.currentTime);
          gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.08);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(ctx.currentTime + 0.08);
          osc2.stop(ctx.currentTime + 0.75);
          return;
        } catch (e) {
          console.warn('Web Audio synthesis fallback:', e);
        }
      }

      if (typeof window !== 'undefined' && (window as any).Audio) {
        const audio = new (window as any).Audio(SUCCESS_CHIME_URL);
        audio.volume = 0.6;
        audio.play().catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Could not play success sound:', err);
  }
}
