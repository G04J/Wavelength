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

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/me`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  } catch (err) {
    console.error("[API /api/me] Backend unreachable:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Backend unavailable. Is the server running on " + BACKEND_URL + "?" },
      { status: 503 }
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 503) {
      console.warn("[API /api/me] Backend returned 503:", (data as { error?: string }).error ?? "Auth not configured? Check backend .env (SUPABASE_JWT_SECRET)");
    }
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}
