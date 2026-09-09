import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RazorpaySubscriptionEntity = {
  id: string;
  status: string;
  customer_id: string | null;
  notes?: { agency_id?: string; plan?: string };
};

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();

  const valid =
    signature &&
    Razorpay.validateWebhookSignature(
      rawBody,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    );

  if (!valid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload: { subscription?: { entity: RazorpaySubscriptionEntity } };
  };

  const supabase = createAdminClient();
  const subscription = event.payload.subscription?.entity;
  const agencyId = subscription?.notes?.agency_id;
  const plan = subscription?.notes?.plan;

  switch (event.event) {
    // The customer completed the authorization payment, or a recurring
    // charge succeeded — either way the plan is (still) active.
    case "subscription.activated":
    case "subscription.charged": {
      if (agencyId && plan) {
        await supabase
          .from("agencies")
          .update({
            plan_tier: plan,
            razorpay_customer_id: subscription?.customer_id ?? undefined,
            razorpay_subscription_id: subscription?.id,
          })
          .eq("id", agencyId);
      }
      break;
    }

    // Definitive endings — drop back to the free plan.
    case "subscription.cancelled":
    case "subscription.completed": {
      if (agencyId) {
        await supabase.from("agencies").update({ plan_tier: "free" }).eq("id", agencyId);
      }
      break;
    }

    // "halted" means repeated charge failures. We deliberately don't
    // downgrade automatically here — could be a transient card issue —
    // but this is a reasonable place to send yourself a "billing at risk"
    // alert once you have real customers to watch for it.
    case "subscription.halted":
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
