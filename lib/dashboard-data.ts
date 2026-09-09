import { createClient } from "@/lib/supabase/server";

export type SiteWithStatus = {
  id: string;
  url: string;
  label: string | null;
  created_at: string;
  latestStatus: "up" | "down" | null;
  latestCheckedAt: string | null;
  uptime30d: number | null;
  sslExpiresAt: string | null;
  openDowntimeIncident: boolean;
  openSslIncident: boolean;
  openBrokenLinkIncident: boolean;
};

/**
 * Fetches this agency's sites plus a lightweight status summary for each.
 * Runs one extra query per site — fine at MVP scale (dozens of sites per
 * agency); worth collapsing into a Postgres view/RPC if that grows.
 */
export async function getSitesWithStatus(): Promise<SiteWithStatus[]> {
  const supabase = await createClient();
  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false });

  if (!sites || sites.length === 0) return [];

  const results: SiteWithStatus[] = [];
  for (const site of sites) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: latestCheck }, { count: totalChecks }, { count: upChecks }, { data: ssl }, { data: openIncidents }] =
      await Promise.all([
        supabase
          .from("checks")
          .select("status, checked_at")
          .eq("site_id", site.id)
          .order("checked_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("checks")
          .select("id", { count: "exact", head: true })
          .eq("site_id", site.id)
          .gte("checked_at", since),
        supabase
          .from("checks")
          .select("id", { count: "exact", head: true })
          .eq("site_id", site.id)
          .eq("status", "up")
          .gte("checked_at", since),
        supabase.from("ssl_status").select("expires_at").eq("site_id", site.id).maybeSingle(),
        // All open incidents, any type — the dashboard's headline status
        // needs to reflect SSL and broken-link problems too, not just
        // downtime, otherwise a site with real issues still shows "Operational".
        supabase.from("incidents").select("type").eq("site_id", site.id).is("resolved_at", null),
      ]);

    const openTypes = new Set((openIncidents ?? []).map((i) => i.type as string));

    results.push({
      id: site.id,
      url: site.url,
      label: site.label,
      created_at: site.created_at,
      latestStatus: (latestCheck?.status as "up" | "down" | undefined) ?? null,
      latestCheckedAt: latestCheck?.checked_at ?? null,
      uptime30d:
        totalChecks && totalChecks > 0 ? Math.round(((upChecks ?? 0) / totalChecks) * 10000) / 100 : null,
      sslExpiresAt: ssl?.expires_at ?? null,
      openDowntimeIncident: openTypes.has("downtime"),
      openSslIncident: openTypes.has("ssl"),
      openBrokenLinkIncident: openTypes.has("broken_link"),
    });
  }

  return results;
}
