import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay } from "@/lib/razorpay";

// Razorpay has no hosted "billing portal" like Stripe's, so cancellation
// is a plain button in our own dashboard that calls Razorpay's API
// directly. Cancels immediately (not at cycle end) — good enough for MVP.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: agency } = await supabase
    .from("agencies")
    .select("razorpay_subscription_id")
    .eq("id", user.id)
    .single();

  if (!agency?.razorpay_subscription_id) {
    return NextResponse.json({ error: "No active subscription to cancel." }, { status: 400 });
  }

  const razorpay = getRazorpay();
  await razorpay.subscriptions.cancel(agency.razorpay_subscription_id, false);

  // The webhook will also flip this to "free" once Razorpay confirms the
  // cancellation, but we set it here too so the UI updates immediately.
  await supabase.from("agencies").update({ plan_tier: "free" }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
