import type { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!SUPABASE_JWT_SECRET) {
    console.log("[Backend] Auth failed: SUPABASE_JWT_SECRET not set");
    res.status(503).json({ error: "Auth not configured" });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.log("[Backend] Auth failed: missing or invalid authorization header");
    res.status(401).json({ error: "Missing or invalid authorization" });
    return;
  }

  try {
    const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    const sub = payload.sub;
    const email = payload.email as string | undefined;

    if (!sub) {
      console.log("[Backend] Auth failed: invalid token payload (no sub)");
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    req.userId = sub;
    req.email = email;
    console.log("[Backend] Auth ok", { userId: sub });
    next();
  } catch (err) {
    console.log("[Backend] Auth failed: invalid or expired token", err instanceof Error ? err.message : "");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
