import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay, SUBSCRIPTION_TOTAL_COUNT } from "@/lib/razorpay";
import { razorpayPlanIdForPlan, type PlanTier } from "@/lib/plans";

// Creates a Razorpay Subscription and hands the client back a
// subscription_id to open in Checkout.js. Nothing is charged yet — the
// subscription sits in "created" status until the customer completes the
// authorization payment in the checkout modal, and the webhook is what
// actually flips the agency's plan_tier once Razorpay confirms it.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const plan = body?.plan as Exclude<PlanTier, "free"> | undefined;
  if (!plan || !["starter", "agency", "scale"].includes(plan)) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const planId = razorpayPlanIdForPlan(plan);
  if (!planId) {
    return NextResponse.json(
      { error: `Razorpay plan ID for "${plan}" is not configured yet.` },
      { status: 500 }
    );
  }

  const razorpay = getRazorpay();
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: SUBSCRIPTION_TOTAL_COUNT,
    customer_notify: 1,
    notes: { agency_id: user.id, plan },
  });

  // Record it against the agency right away so we can cancel/look it up
  // later even before the customer finishes paying.
  await supabase
    .from("agencies")
    .update({ razorpay_subscription_id: subscription.id })
    .eq("id", user.id);

  return NextResponse.json({
    subscriptionId: subscription.id,
    keyId: process.env.RAZORPAY_KEY_ID,
    prefillEmail: user.email,
  });
}
