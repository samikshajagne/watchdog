import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_SITE_LIMITS, type PlanTier } from "@/lib/plans";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sites: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const rawUrl = body?.url as string | undefined;
  const label = (body?.label as string | undefined)?.trim() || null;
  if (!rawUrl) return NextResponse.json({ error: "A site URL is required." }, { status: 400 });

  let url: string;
  try {
    const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    url = parsed.toString();
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("plan_tier")
    .eq("id", user.id)
    .single();
  const plan = (agency?.plan_tier ?? "free") as PlanTier;

  const { count } = await supabase
    .from("sites")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", user.id);

  if ((count ?? 0) >= PLAN_SITE_LIMITS[plan]) {
    return NextResponse.json(
      {
        error: `Your ${plan} plan is limited to ${PLAN_SITE_LIMITS[plan]} sites. Upgrade to add more.`,
      },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("sites")
    .insert({ agency_id: user.id, url, label })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ site: data }, { status: 201 });
}
