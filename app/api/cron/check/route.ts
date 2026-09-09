import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkUptime, checkSslExpiry, crawlBrokenLinks } from "@/lib/monitoring";
import {
  sendDowntimeAlert,
  sendRecoveryAlert,
  sendSslExpiryAlert,
  sendBrokenLinksAlert,
} from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds — raise if you're on a Vercel plan that allows it

const SSL_RECHECK_HOURS = 20;
const BROKEN_LINK_RECHECK_DAYS = 7;
const SSL_TIERS = [30, 14, 3]; // days-before-expiry alert thresholds

function daysBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: sites, error } = await supabase
    .from("sites")
    .select("id, url, agency_id, agencies(owner_email)");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Record<string, unknown>[] = [];

  for (const site of sites ?? []) {
    // supabase-js can return a to-one embedded relation as either an object
    // or a single-element array depending on how PostgREST infers the
    // relationship — handle both so ownerEmail doesn't silently end up
    // undefined (which was skipping every alert email with no error at all).
    const agencyRel = (site as any).agencies;
    const ownerEmail = (Array.isArray(agencyRel) ? agencyRel[0]?.owner_email : agencyRel?.owner_email) as
      | string
      | undefined;
    const siteResult: Record<string, unknown> = { site_id: site.id, url: site.url };

    // --- 1. Uptime check (every invocation) ---
    try {
      const uptime = await checkUptime(site.url);
      await supabase.from("checks").insert({
        site_id: site.id,
        status: uptime.status,
        latency_ms: uptime.latencyMs,
        http_code: uptime.httpCode,
      });

      const { data: openIncident } = await supabase
        .from("incidents")
        .select("id")
        .eq("site_id", site.id)
        .eq("type", "downtime")
        .is("resolved_at", null)
        .maybeSingle();

      if (uptime.status === "down" && !openIncident) {
        const { data: incident } = await supabase
          .from("incidents")
          .insert({ site_id: site.id, type: "downtime" })
          .select("id")
          .single();
        if (ownerEmail && incident) {
          await sendDowntimeAlert(ownerEmail, site.url, uptime.httpCode);
          await supabase.from("alerts_sent").insert({ incident_id: incident.id });
        }
      } else if (uptime.status === "up" && openIncident) {
        await supabase
          .from("incidents")
          .update({ resolved_at: new Date().toISOString() })
          .eq("id", openIncident.id);
        if (ownerEmail) {
          await sendRecoveryAlert(ownerEmail, site.url);
          await supabase.from("alerts_sent").insert({ incident_id: openIncident.id });
        }
      }
      siteResult.uptime = uptime.status;
    } catch (e) {
      siteResult.uptimeError = (e as Error).message;
    }

    // --- 2. SSL expiry check (throttled to roughly once a day) ---
    try {
      const { data: sslRow } = await supabase
        .from("ssl_status")
        .select("last_checked_at")
        .eq("site_id", site.id)
        .maybeSingle();

      const dueForSslCheck =
        !sslRow?.last_checked_at ||
        Date.now() - new Date(sslRow.last_checked_at).getTime() >
          SSL_RECHECK_HOURS * 60 * 60 * 1000;

      if (dueForSslCheck) {
        const expiresAt = await checkSslExpiry(site.url);
        await supabase.from("ssl_status").upsert({
          site_id: site.id,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          last_checked_at: new Date().toISOString(),
        });

        const { data: openSslIncident } = await supabase
          .from("incidents")
          .select("id, meta")
          .eq("site_id", site.id)
          .eq("type", "ssl")
          .is("resolved_at", null)
          .maybeSingle();

        const daysLeft = expiresAt ? daysBetween(expiresAt, new Date()) : null;
        const tier = daysLeft === null ? null : SSL_TIERS.find((t) => daysLeft <= t) ?? null;

        if (tier === null) {
          if (openSslIncident) {
            await supabase
              .from("incidents")
              .update({ resolved_at: new Date().toISOString() })
              .eq("id", openSslIncident.id);
          }
        } else if (!openSslIncident) {
          const { data: incident } = await supabase
            .from("incidents")
            .insert({ site_id: site.id, type: "ssl", meta: { tier } })
            .select("id")
            .single();
          if (ownerEmail && incident && expiresAt && daysLeft !== null) {
            await sendSslExpiryAlert(ownerEmail, site.url, expiresAt, daysLeft);
            await supabase.from("alerts_sent").insert({ incident_id: incident.id });
          }
        } else if ((openSslIncident.meta as any)?.tier !== tier) {
          await supabase
            .from("incidents")
            .update({ meta: { tier } })
            .eq("id", openSslIncident.id);
          if (ownerEmail && expiresAt && daysLeft !== null) {
            await sendSslExpiryAlert(ownerEmail, site.url, expiresAt, daysLeft);
            await supabase.from("alerts_sent").insert({ incident_id: openSslIncident.id });
          }
        }
        siteResult.sslDaysLeft = daysLeft;
      }
    } catch (e) {
      siteResult.sslError = (e as Error).message;
    }

    // --- 3. Broken-link crawl (throttled to roughly once a week) ---
    try {
      const { data: lastCrawl } = await supabase
        .from("broken_links")
        .select("checked_at")
        .eq("site_id", site.id)
        .order("checked_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const dueForCrawl =
        !lastCrawl?.checked_at ||
        Date.now() - new Date(lastCrawl.checked_at).getTime() >
          BROKEN_LINK_RECHECK_DAYS * 24 * 60 * 60 * 1000;

      if (dueForCrawl) {
        const broken = await crawlBrokenLinks(site.url);

        // Replace last crawl's findings rather than appending — otherwise
        // every weekly crawl piles more rows on top of old ones forever,
        // and a link that gets fixed never disappears from the list.
        await supabase.from("broken_links").delete().eq("site_id", site.id);
        if (broken.length > 0) {
          await supabase.from("broken_links").insert(
            broken.map((b) => ({
              site_id: site.id,
              source_url: b.sourceUrl,
              broken_url: b.brokenUrl,
              status_code: b.statusCode,
            }))
          );
        }

        // Mirror the downtime/SSL pattern: track an open incident so the
        // dashboard can reflect "still broken" without re-alerting on every
        // single crawl, and so it can clear once links get fixed.
        const { data: openBrokenLinkIncident } = await supabase
          .from("incidents")
          .select("id, meta")
          .eq("site_id", site.id)
          .eq("type", "broken_link")
          .is("resolved_at", null)
          .maybeSingle();

        if (broken.length === 0) {
          if (openBrokenLinkIncident) {
            await supabase
              .from("incidents")
              .update({ resolved_at: new Date().toISOString() })
              .eq("id", openBrokenLinkIncident.id);
          }
        } else if (!openBrokenLinkIncident) {
          const { data: incident } = await supabase
            .from("incidents")
            .insert({ site_id: site.id, type: "broken_link", meta: { count: broken.length } })
            .select("id")
            .single();
          if (ownerEmail && incident) {
            await sendBrokenLinksAlert(ownerEmail, site.url, broken.length);
            await supabase.from("alerts_sent").insert({ incident_id: incident.id });
          }
        } else if ((openBrokenLinkIncident.meta as any)?.count !== broken.length) {
          await supabase
            .from("incidents")
            .update({ meta: { count: broken.length } })
            .eq("id", openBrokenLinkIncident.id);
          if (ownerEmail) {
            await sendBrokenLinksAlert(ownerEmail, site.url, broken.length);
            await supabase.from("alerts_sent").insert({ incident_id: openBrokenLinkIncident.id });
          }
        }

        siteResult.brokenLinks = broken.length;
      }
    } catch (e) {
      siteResult.brokenLinksError = (e as Error).message;
    }

    results.push(siteResult);
  }

  return NextResponse.json({ checked: results.length, results });
}
