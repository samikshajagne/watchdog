import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatusBadge from "@/components/StatusBadge";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS scopes every one of these to sites owned by the signed-in agency.
  const { data: site } = await supabase.from("sites").select("*").eq("id", id).maybeSingle();
  if (!site) notFound();

  const [{ data: checks }, { data: ssl }, { data: incidents }, { data: brokenLinks }] = await Promise.all([
    supabase
      .from("checks")
      .select("status, checked_at, latency_ms, http_code")
      .eq("site_id", site.id)
      .order("checked_at", { ascending: false })
      .limit(20),
    supabase.from("ssl_status").select("expires_at, last_checked_at").eq("site_id", site.id).maybeSingle(),
    supabase
      .from("incidents")
      .select("*")
      .eq("site_id", site.id)
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("broken_links")
      .select("*")
      .eq("site_id", site.id)
      .order("checked_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold">{site.label || site.url}</h1>
        <p className="text-sm text-[var(--text-muted)]">{site.url}</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Current status</p>
          <div className="mt-2">
            <StatusBadge status={(checks?.[0]?.status as "up" | "down" | undefined) ?? null} />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">SSL expires</p>
          <p className="mt-2 text-sm">
            {ssl?.expires_at ? new Date(ssl.expires_at).toDateString() : "Not checked yet"}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Broken links (last scan)</p>
          <p className="mt-2 text-sm">{brokenLinks?.length ?? 0}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Recent incidents</h2>
        {!incidents || incidents.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No incidents recorded yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3 text-sm last:border-b-0"
              >
                <span className="capitalize">{incident.type}</span>
                <span className="text-[var(--text-muted)]">
                  {new Date(incident.started_at).toLocaleString()}
                  {incident.resolved_at ? ` → resolved ${new Date(incident.resolved_at).toLocaleString()}` : " (open)"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Recent checks</h2>
        {!checks || checks.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No checks recorded yet — the next cron run will add one.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
            {checks.map((check, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-[var(--border)] px-5 py-2.5 text-sm last:border-b-0"
              >
                <StatusBadge status={check.status as "up" | "down"} />
                <span className="text-[var(--text-muted)]">
                  {check.http_code ?? "—"} · {check.latency_ms ? `${check.latency_ms}ms` : "—"}
                </span>
                <span className="text-[var(--text-muted)]">{new Date(check.checked_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {brokenLinks && brokenLinks.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold">Broken links found</h2>
          <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
            {brokenLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between border-b border-[var(--border)] px-5 py-2.5 text-sm last:border-b-0"
              >
                <span className="truncate">{link.broken_url}</span>
                <span className="text-[var(--text-muted)]">{link.status_code ?? "no response"}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
