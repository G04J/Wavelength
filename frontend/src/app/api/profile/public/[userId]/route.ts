import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export type PublicProfile = {
  name: string | null;
  show_social_to_nearby: boolean;
  facebook_url: string | null;
  instagram_handle: string | null;
};

/**
 * GET /api/profile/public/[userId]
 * Returns public profile for map popup: name, and social links only if show_social_to_nearby is true.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name, show_social_to_nearby, facebook_url, instagram_handle")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[API profile/public] fetch error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ name: null, show_social_to_nearby: false, facebook_url: null, instagram_handle: null });
  }

  const showSocial = (profile as { show_social_to_nearby?: boolean }).show_social_to_nearby === true;
  const res: PublicProfile = {
    name: (profile as { name?: string }).name ?? null,
    show_social_to_nearby: showSocial,
    facebook_url: showSocial ? ((profile as { facebook_url?: string | null }).facebook_url ?? null) : null,
    instagram_handle: showSocial ? ((profile as { instagram_handle?: string | null }).instagram_handle ?? null) : null,
  };
  return NextResponse.json(res);
}
