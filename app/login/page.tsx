"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-display text-2xl font-bold">
            Website Watchdog
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Sign in with a magic link — no password needed.
          </p>
        </div>

        {status === "sent" ? (
          <p className="rounded-lg border border-[var(--border)] bg-white p-4 text-center text-sm">
            Check <strong>{email}</strong> for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@youragency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {status === "sending" ? "Sending link…" : "Send magic link"}
            </button>
            {status === "error" && (
              <p className="text-center text-sm text-red-600">
                Something went wrong — try again.
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
