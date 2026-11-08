import localFont from 'next/font/local';

// Glass theme type, from the JARVIS concepts: Instrument Serif for headlines,
// Geist for UI and Geist Mono for counts and ids. Self-hosted (Latin subset, SIL OFL,
// licences beside the files): next/font/google fetches at build time and Next 15.5's
// loader crashes when Google answers with an extensionless file URL, which it does
// intermittently, so a Google font could fail any deploy.
export const title = localFont({
  src: [
    { path: './fonts/instrument-serif.woff2', weight: '400', style: 'normal' },
    { path: './fonts/instrument-serif-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--dl-title',
  display: 'swap',
});
export const text = localFont({ src: './fonts/geist.woff2', weight: '400 700', variable: '--dl-text', display: 'swap' });
export const mono = localFont({ src: './fonts/geist-mono.woff2', weight: '400 500', variable: '--dl-mono', display: 'swap' });
