/**
 * Utility for audio completion chimes and background tab notifications.
 * Uses Web Audio API synthesizer (0 bytes external audio dependencies).
 */

const ORIGINAL_DOCUMENT_TITLE = 'CutPulse — Fast & Free Client-Side Video Splitter';

/**
 * Plays a pleasant, gentle two-tone chime via Web Audio API.
 * Gracefully silent if Web Audio is unsupported or audio context is blocked.
 */
export function playCompletionChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First note: C6 (1046.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.16);

    // Second note: E6 (1318.5 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.12);

    gain2.gain.setValueAtTime(0.001, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.12);
    osc2.stop(now + 0.46);

    // Close audio context after chime finishes to release hardware resources
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }, 600);
  } catch (err) {
    // Autoplay policy or unsupported audio environment — safely ignore
    console.debug('Audio chime skipped:', err);
  }
}

/**
 * Alerts user that video splitting finished, especially if they are on another browser tab.
 */
export function notifyCompletion(clipCount: number): void {
  // 1. Play audio chime
  playCompletionChime();

  // 2. Dynamic document title alert
  if (document.hidden) {
    document.title = `🔔 (${clipCount} Clips Ready) CutPulse Splitter`;

    const handleFocus = () => {
      document.title = ORIGINAL_DOCUMENT_TITLE;
      window.removeEventListener('focus', handleFocus);
    };

    window.addEventListener('focus', handleFocus);
  }

  // 3. Optional Native Web Notification if granted
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('CutPulse Video Splitter', {
        body: `Done! ${clipCount} clips generated and ready to download.`,
        icon: '/favicon.svg',
      });
    }
  } catch {
    // Notification error guard
  }
}
