import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the magic-link redirect: exchanges the auth code for a
// session, then makes sure an `agencies` row exists for this user
// before sending them into the dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: existing } = await supabase
        .from("agencies")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("agencies").insert({
          id: data.user.id,
          owner_email: data.user.email,
          plan_tier: "free",
        });
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
