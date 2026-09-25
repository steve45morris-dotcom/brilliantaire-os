// Plans IcyOS knows about. Amounts live in Stripe; each plan maps to a Stripe
// price id supplied through the environment, so pricing changes need no deploy.

export type Plan = 'starter' | 'pro' | 'team';

export interface PlanDefinition {
  plan: Plan;
  name: string;
  /** Team is billed per seat; the others are one flat quantity. */
  perSeat: boolean;
  priceEnv: string;
}

export const PLANS: readonly PlanDefinition[] = [
  { plan: 'starter', name: 'Starter', perSeat: false, priceEnv: 'STRIPE_PRICE_STARTER' },
  { plan: 'pro', name: 'Pro', perSeat: false, priceEnv: 'STRIPE_PRICE_PRO' },
  { plan: 'team', name: 'Team', perSeat: true, priceEnv: 'STRIPE_PRICE_TEAM' },
];

export const MAX_SEATS = 500;

type Env = Record<string, string | undefined>;

export function isPlan(value: unknown): value is Plan {
  return PLANS.some((p) => p.plan === value);
}

export function planDefinition(plan: Plan): PlanDefinition {
  return PLANS.find((p) => p.plan === plan)!;
}

export function priceIdFor(plan: Plan, env: Env = process.env): string | null {
  return env[planDefinition(plan).priceEnv] || null;
}

export function planForPriceId(priceId: string | null | undefined, env: Env = process.env): Plan | null {
  if (!priceId) return null;
  return PLANS.find((p) => env[p.priceEnv] === priceId)?.plan ?? null;
}

/** Quantity to bill: the requested seats for per-seat plans, otherwise 1. */
export function quantityFor(plan: Plan, seats: unknown): number | null {
  if (!planDefinition(plan).perSeat) return 1;
  if (seats === undefined) return 1;
  return Number.isInteger(seats) && (seats as number) >= 1 && (seats as number) <= MAX_SEATS
    ? (seats as number)
    : null;
}
