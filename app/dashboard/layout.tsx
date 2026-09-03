import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-8 py-4">
        <Link href="/dashboard" className="font-display text-lg font-bold">
          Website Watchdog
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard/billing"
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            Billing
          </Link>
          <span className="text-sm text-[var(--text-muted)]">{user?.email}</span>
          <SignOutButton />
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-8 py-10">{children}</main>
    </div>
  );
}
