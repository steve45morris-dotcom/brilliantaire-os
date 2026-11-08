import { Inter, Manrope, Outfit, Playfair_Display } from 'next/font/google';

// Daylight type: Playfair Display for headlines and numbers, Manrope for UI.
// JetBrains Mono is already loaded app-wide in globals.css.
export const serif = Playfair_Display({ subsets: ['latin'], weight: ['700', '800'], style: ['normal', 'italic'], variable: '--dl-serif', display: 'swap' });
export const sans = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--dl-sans', display: 'swap' });

// Glass theme type, from the Supernova design system: Outfit for titles, Inter for UI.
export const title = Outfit({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--dl-title', display: 'swap' });
export const text = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--dl-text', display: 'swap' });
