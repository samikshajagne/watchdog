import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { stripePriceIdForPlan, type PlanTier } from "@/lib/plans";

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

  const priceId = stripePriceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price ID for "${plan}" is not configured yet.` },
      { status: 500 }
    );
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: agency?.stripe_customer_id || undefined,
    customer_email: agency?.stripe_customer_id ? undefined : user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/dashboard?upgraded=1`,
    cancel_url: `${siteUrl}/dashboard/billing`,
    client_reference_id: user.id,
    metadata: { agency_id: user.id, plan },
    subscription_data: { metadata: { agency_id: user.id, plan } },
  });

  return NextResponse.json({ url: session.url });
}
