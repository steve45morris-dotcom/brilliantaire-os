import { Manrope, Playfair_Display } from 'next/font/google';

// Daylight type: Playfair Display for headlines and numbers, Manrope for UI.
// JetBrains Mono is already loaded app-wide in globals.css.
export const serif = Playfair_Display({ subsets: ['latin'], weight: ['700', '800'], style: ['normal', 'italic'], variable: '--dl-serif', display: 'swap' });
export const sans = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--dl-sans', display: 'swap' });
