import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: agency } = await supabase
    .from("agencies")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!agency?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account yet — subscribe to a paid plan first." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: agency.stripe_customer_id,
    return_url: `${siteUrl}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
