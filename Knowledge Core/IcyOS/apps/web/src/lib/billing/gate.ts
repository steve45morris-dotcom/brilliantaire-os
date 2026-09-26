// Which requests need an active subscription or trial. Everything a locked-out
// user needs to subscribe stays reachable.

const EXEMPT_PREFIXES = ['/billing', '/api/billing/', '/api/health', '/login', '/auth/', '/terms', '/privacy'];

export function requiresSubscription(pathname: string): boolean {
  return !EXEMPT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`));
}

/** On unless BILLING_ENFORCEMENT=off, e.g. before migration 19 or Stripe keys are in place. */
export function billingEnforced(env: Record<string, string | undefined> = process.env): boolean {
  return env.BILLING_ENFORCEMENT !== 'off';
}
