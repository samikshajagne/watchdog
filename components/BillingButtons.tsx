"use client";

import Script from "next/script";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanTier } from "@/lib/plans";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/** Loads Razorpay's Checkout.js once, wherever this is rendered. */
export function RazorpayCheckoutScript() {
  return <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />;
}

export function UpgradeButton({ plan, label }: { plan: Exclude<PlanTier, "free">; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/razorpay/create-subscription", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok || !body.subscriptionId) {
      alert(body.error || "Something went wrong.");
      return;
    }

    if (typeof window.Razorpay !== "function") {
      alert("Payment checkout is still loading — try again in a moment.");
      return;
    }

    const rzp = new window.Razorpay({
      key: body.keyId,
      subscription_id: body.subscriptionId,
      name: "Website Watchdog",
      description: `${label}`,
      prefill: { email: body.prefillEmail },
      theme: { color: "#4F46E5" },
      handler: () => {
        // The webhook is the source of truth for plan_tier — this just
        // refreshes the page so the change shows up once it lands.
        router.refresh();
      },
    });
    rzp.open();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
    >
      {loading ? "Preparing…" : label}
    </button>
  );
}

export function CancelSubscriptionButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("Cancel your subscription? You'll drop to the Free plan immediately.")) return;
    setLoading(true);
    const res = await fetch("/api/razorpay/cancel", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      alert(body.error || "Something went wrong.");
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold hover:bg-[var(--bg)] disabled:opacity-60"
    >
      {loading ? "Cancelling…" : "Cancel subscription"}
    </button>
  );
}
