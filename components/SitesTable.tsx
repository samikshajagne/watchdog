"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import type { SiteWithStatus } from "@/lib/dashboard-data";

function formatRelative(iso: string | null) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function SitesTable({ sites }: { sites: SiteWithStatus[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Stop monitoring this site?")) return;
    await fetch(`/api/sites/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (sites.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--border-strong)] p-8 text-center text-sm text-[var(--text-muted)]">
        No sites yet — add your first client site above.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
      <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-3 border-b border-[var(--border)] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        <span>Site</span>
        <span>Status</span>
        <span>Uptime (30d)</span>
        <span>Last checked</span>
        <span />
      </div>
      {sites.map((site) => (
        <div
          key={site.id}
          className="grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] items-center gap-3 border-b border-[var(--border)] px-5 py-4 text-sm last:border-b-0"
        >
          <Link href={`/dashboard/sites/${site.id}`} className="flex flex-col hover:underline">
            <span className="font-medium">{site.label || site.url}</span>
            {site.label && <span className="text-xs text-[var(--text-muted)]">{site.url}</span>}
          </Link>
          <StatusBadge status={site.latestStatus} />
          <span className="text-[var(--text-muted)]">
            {site.uptime30d !== null ? `${site.uptime30d}%` : "—"}
          </span>
          <span className="text-[var(--text-muted)]">{formatRelative(site.latestCheckedAt)}</span>
          <button
            onClick={() => handleDelete(site.id)}
            className="text-xs font-medium text-[var(--text-muted)] hover:text-red-600"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
