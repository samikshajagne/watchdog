"use client";

import { useState } from "react";
import type { PlanTier } from "@/lib/plans";

export function UpgradeButton({ plan, label }: { plan: Exclude<PlanTier, "free">; label: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (body.url) window.location.href = body.url;
    else alert(body.error || "Something went wrong.");
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
    >
      {loading ? "Redirecting…" : label}
    </button>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (body.url) window.location.href = body.url;
    else alert(body.error || "No billing account yet.");
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold hover:bg-[var(--bg)] disabled:opacity-60"
    >
      {loading ? "Loading…" : "Manage billing"}
    </button>
  );
}
