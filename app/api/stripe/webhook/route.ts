import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const agencyId = session.client_reference_id || session.metadata?.agency_id;
      const plan = session.metadata?.plan;
      if (agencyId && plan) {
        await supabase
          .from("agencies")
          .update({
            stripe_customer_id: session.customer as string,
            plan_tier: plan,
          })
          .eq("id", agencyId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const agencyId = subscription.metadata?.agency_id;
      const plan = subscription.metadata?.plan;
      if (agencyId && plan && subscription.status === "active") {
        await supabase.from("agencies").update({ plan_tier: plan }).eq("id", agencyId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const agencyId = subscription.metadata?.agency_id;
      if (agencyId) {
        await supabase.from("agencies").update({ plan_tier: "free" }).eq("id", agencyId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
