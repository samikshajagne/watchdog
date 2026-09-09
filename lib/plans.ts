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

// Priced in INR (Razorpay's native currency for Indian merchants — no
// extra cross-border approval needed). These are a starting point, not
// gospel — roughly tracking the original $9/$25/$60 positioning. Change
// them here AND in the matching Razorpay Plan's amount (see README).
export const PLAN_PRICE_INR: Record<PlanTier, number> = {
  free: 0,
  starter: 699,
  agency: 1999,
  scale: 4999,
};

/** Maps a plan tier to the Razorpay Plan ID env var that sells it. */
export function razorpayPlanIdForPlan(plan: Exclude<PlanTier, "free">) {
  const map: Record<Exclude<PlanTier, "free">, string | undefined> = {
    starter: process.env.RAZORPAY_PLAN_STARTER,
    agency: process.env.RAZORPAY_PLAN_AGENCY,
    scale: process.env.RAZORPAY_PLAN_SCALE,
  };
  return map[plan];
}
