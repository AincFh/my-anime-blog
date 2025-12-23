/**
 * API: 获取当前用户信息
 * GET /api/user/me
 */

import type { Route } from "./+types/api.user.me";
import { verifySession, getSessionToken } from "../services/auth.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = (context as any).cloudflare.env;
  const anime_db = env?.anime_db;

  try {
    if (!anime_db) {
      return Response.json({ user: null }, { status: 401 });
    }

    const token = getSessionToken(request);
    const result = await verifySession(token, anime_db);

    if (!result.valid || !result.user) {
      return Response.json({ user: null }, { status: 401 });
    }

    return Response.json({ user: result.user });
  } catch (error) {
    console.error("Get user error:", error);
    return Response.json({ user: null }, { status: 500 });
  }
}
