import { createClient } from "@/lib/supabase/server";
import { PLAN_LABELS, PLAN_PRICE_INR, PLAN_SITE_LIMITS, type PlanTier } from "@/lib/plans";
import { UpgradeButton, CancelSubscriptionButton, RazorpayCheckoutScript } from "@/components/BillingButtons";

const PAID_PLANS: Exclude<PlanTier, "free">[] = ["starter", "agency", "scale"];

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: agency } = await supabase
    .from("agencies")
    .select("plan_tier, razorpay_subscription_id")
    .eq("id", user!.id)
    .single();
  const plan = (agency?.plan_tier ?? "free") as PlanTier;

  return (
    <div className="flex flex-col gap-8">
      <RazorpayCheckoutScript />
      <div>
        <h1 className="font-display text-2xl font-bold">Billing</h1>
        <p className="text-sm text-[var(--text-muted)]">
          You're on the <strong>{PLAN_LABELS[plan]}</strong> plan — up to {PLAN_SITE_LIMITS[plan]} sites.
        </p>
      </div>

      {plan !== "free" && agency?.razorpay_subscription_id && (
        <div>
          <CancelSubscriptionButton />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PAID_PLANS.map((p) => (
          <div key={p} className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-white p-5">
            <div>
              <p className="text-sm font-semibold text-[var(--text-muted)]">{PLAN_LABELS[p]}</p>
              <p className="font-display text-2xl font-bold">
                ₹{PLAN_PRICE_INR[p]}
                <span className="text-sm font-normal text-[var(--text-muted)]">/month</span>
              </p>
              <p className="text-xs text-[var(--text-muted)]">Up to {PLAN_SITE_LIMITS[p]} sites</p>
            </div>
            {plan === p ? (
              <span className="text-sm text-[var(--text-muted)]">Current plan</span>
            ) : (
              <UpgradeButton plan={p} label={`Switch to ${PLAN_LABELS[p]}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
