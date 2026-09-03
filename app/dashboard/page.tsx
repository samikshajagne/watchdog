import { createClient } from "@/lib/supabase/server";
import { getSitesWithStatus } from "@/lib/dashboard-data";
import { PLAN_SITE_LIMITS, PLAN_LABELS, type PlanTier } from "@/lib/plans";
import AddSiteForm from "@/components/AddSiteForm";
import SitesTable from "@/components/SitesTable";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: agency } = await supabase
    .from("agencies")
    .select("plan_tier")
    .eq("id", user!.id)
    .single();
  const plan = (agency?.plan_tier ?? "free") as PlanTier;

  const sites = await getSitesWithStatus();
  const atLimit = sites.length >= PLAN_SITE_LIMITS[plan];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold">Your sites</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {sites.length} of {PLAN_SITE_LIMITS[plan]} sites on the {PLAN_LABELS[plan]} plan.
        </p>
      </div>
      <AddSiteForm atLimit={atLimit} />
      <SitesTable sites={sites} />
    </div>
  );
}
