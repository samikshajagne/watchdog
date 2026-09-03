"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddSiteForm({ atLimit }: { atLimit: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, label }),
    });
    const body = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(body.error || "Something went wrong.");
      return;
    }
    setUrl("");
    setLabel("");
    router.refresh();
  }

  if (atLimit) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm">
        You've reached your plan's site limit.{" "}
        <a href="/dashboard/billing" className="font-semibold text-accent hover:underline">
          Upgrade your plan
        </a>{" "}
        to monitor more sites.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-white p-4 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-xs font-medium text-[var(--text-muted)]">Site URL</label>
        <input
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="clientsite.com"
          className="rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-xs font-medium text-[var(--text-muted)]">Label (optional)</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Client name"
          className="rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Adding…" : "Add site"}
      </button>
      {error && <p className="text-sm text-red-600 sm:basis-full">{error}</p>}
    </form>
  );
}
