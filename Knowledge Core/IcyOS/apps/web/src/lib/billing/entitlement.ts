// Whether a user's subscription row grants access to the app. Pure, so the
// middleware and the billing page agree on one rule.

export interface SubscriptionState {
  status: string;
  trial_ends_at: string | null;
}

const DAY_MS = 86_400_000;

export function hasAccess(sub: SubscriptionState | null | undefined, now = Date.now()): boolean {
  if (!sub) return false;
  switch (sub.status) {
    case 'active':
      return true;
    // Stripe keeps retrying the card while past_due; access continues until it
    // gives up and the subscription moves to canceled or unpaid.
    case 'past_due':
      return true;
    case 'trialing':
      return sub.trial_ends_at !== null && Date.parse(sub.trial_ends_at) > now;
    default:
      return false;
  }
}

/** Whole days left in the trial (rounded up), or 0 when not trialing or expired. */
export function trialDaysLeft(sub: SubscriptionState | null | undefined, now = Date.now()): number {
  if (!sub || sub.status !== 'trialing' || !sub.trial_ends_at) return 0;
  return Math.max(0, Math.ceil((Date.parse(sub.trial_ends_at) - now) / DAY_MS));
}
