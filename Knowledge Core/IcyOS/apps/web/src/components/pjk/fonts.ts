import localFont from 'next/font/local';

// P.J.K. Reactor type, deliberately unlike IcyOS: Rajdhani for display and text,
// IBM Plex Mono for telemetry. Self-hosted (Latin subset, SIL OFL, licences beside
// the files), for the same reason as daylight/fonts.ts.
export const display = localFont({
  src: [
    { path: './fonts/rajdhani-500.woff2', weight: '500' },
    { path: './fonts/rajdhani-600.woff2', weight: '600' },
    { path: './fonts/rajdhani-700.woff2', weight: '700' },
  ],
  variable: '--pjk-display',
  display: 'swap',
});
export const mono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-400.woff2', weight: '400' },
    { path: './fonts/ibm-plex-mono-500.woff2', weight: '500' },
    { path: './fonts/ibm-plex-mono-600.woff2', weight: '600' },
  ],
  variable: '--pjk-mono',
  display: 'swap',
});
