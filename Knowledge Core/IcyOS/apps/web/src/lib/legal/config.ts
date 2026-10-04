// Facts the Terms and Privacy Policy depend on. Unset values render as
// [PLACEHOLDER] and put the pages in draft mode until they are filled in.

export const LEGAL = {
  product: 'IcyOS',
  entity: 'Supernova Systems',
  governingLaw: 'the State of Delaware, United States',
  courts: 'the state and federal courts located in Delaware',
  contactEmail: process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL || '[CONTACT_EMAIL]',
  hostingProvider: process.env.NEXT_PUBLIC_HOSTING_PROVIDER || '[HOSTING_PROVIDER]',
  lastUpdated: 'September 25, 2026',
  trialDays: 14,
  minimumAge: 18,
} as const;

const PLACEHOLDER = /\[[A-Z_]+\]/g;

/** Unfilled placeholders in the given text, e.g. ["[CONTACT_EMAIL]"]. */
export function placeholdersIn(text: string): string[] {
  return [...new Set(text.match(PLACEHOLDER) ?? [])];
}
