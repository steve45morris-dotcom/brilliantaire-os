/**
 * Audio triggering utilities for Sentinel OS.
 * Designed under Architect-Core to avoid server-side execution failures in Next.js.
 */

export function playSound(path: string, volume: number = 0.35) {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.play().catch((err) => {
      // Silent catch for browser autoplay blockages before first user interaction
    });
  } catch (error) {
    console.warn("[Sounds] Failed to play audio:", path, error);
  }
}

export function playClick() {
  playSound("/sounds/click.wav", 0.25);
}

export function playFocus() {
  playSound("/sounds/focus.wav", 0.15);
}

export function playSuccess() {
  playSound("/sounds/success.wav", 0.3);
}
