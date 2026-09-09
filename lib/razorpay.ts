import Razorpay from "razorpay";

export function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

// Razorpay subscriptions require a fixed number of billing cycles — there's
// no "bill forever" flag like Stripe's. 120 monthly cycles = 10 years, which
// is effectively indefinite for a customer-facing subscription; well before
// then you'd extend this or move to a renewal flow.
export const SUBSCRIPTION_TOTAL_COUNT = 120;
