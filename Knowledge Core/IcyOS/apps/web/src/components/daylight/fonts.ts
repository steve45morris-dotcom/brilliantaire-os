import { Geist, Geist_Mono, Instrument_Serif, Manrope, Playfair_Display } from 'next/font/google';

// Daylight type: Playfair Display for headlines and numbers, Manrope for UI.
// JetBrains Mono is already loaded app-wide in globals.css.
export const serif = Playfair_Display({ subsets: ['latin'], weight: ['700', '800'], style: ['normal', 'italic'], variable: '--dl-serif', display: 'swap' });
export const sans = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--dl-sans', display: 'swap' });

// Glass theme type, from the JARVIS concepts: Instrument Serif for headlines,
// Geist for UI and Geist Mono for counts and ids.
export const title = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--dl-title', display: 'swap' });
export const text = Geist({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--dl-text', display: 'swap' });
export const mono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--dl-mono', display: 'swap' });
