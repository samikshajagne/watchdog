"use client";

import { useState } from "react";

export default function WaitlistForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "sent" : "error");
  }

  if (status === "sent") {
    return (
      <p className={`text-sm font-medium ${dark ? "text-white" : "text-[var(--text)]"}`}>
        You're on the list — we'll email you when it's ready.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2.5">
      <input
        type="email"
        required
        placeholder="you@youragency.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
          dark
            ? "border-[#3a3f52] bg-[#1e2233] text-white placeholder:text-[#8b90a3]"
            : "border-[var(--border-strong)] bg-white text-[var(--text)]"
        }`}
        style={{ width: 280 }}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? "Joining…" : "Join the waitlist"}
      </button>
      {status === "error" && (
        <span className="self-center text-sm text-red-500">Try again</span>
      )}
    </form>
  );
}
