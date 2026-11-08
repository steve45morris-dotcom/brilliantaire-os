import localFont from 'next/font/local';

// P.J.K.'s own type, deliberately unlike IcyOS: Unbounded for display, Sora for text,
// JetBrains Mono for telemetry. Self-hosted variable fonts (Latin subset, SIL OFL,
// licences beside the files), for the same reason as daylight/fonts.ts.
export const display = localFont({ src: './fonts/unbounded.woff2', weight: '200 900', variable: '--pjk-display', display: 'swap' });
export const text = localFont({ src: './fonts/sora.woff2', weight: '100 800', variable: '--pjk-text', display: 'swap' });
export const mono = localFont({ src: './fonts/jetbrains-mono.woff2', weight: '100 800', variable: '--pjk-mono', display: 'swap' });
