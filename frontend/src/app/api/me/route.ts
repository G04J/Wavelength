import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/api/me`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}
