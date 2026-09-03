export type PlanTier = "free" | "starter" | "agency" | "scale";

export const PLAN_SITE_LIMITS: Record<PlanTier, number> = {
  free: 2,
  starter: 10,
  agency: 50,
  scale: 150,
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Free",
  starter: "Starter",
  agency: "Agency",
  scale: "Scale",
};

export const PLAN_PRICE_USD: Record<PlanTier, number> = {
  free: 0,
  starter: 9,
  agency: 25,
  scale: 60,
};

/** Maps a plan tier to the Stripe Price ID env var that sells it. */
export function stripePriceIdForPlan(plan: Exclude<PlanTier, "free">) {
  const map: Record<Exclude<PlanTier, "free">, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    agency: process.env.STRIPE_PRICE_AGENCY,
    scale: process.env.STRIPE_PRICE_SCALE,
  };
  return map[plan];
}
