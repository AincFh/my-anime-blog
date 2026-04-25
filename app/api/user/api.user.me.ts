/**
 * API: 获取当前用户信息
 * GET /api/user/me
 */

import type { LoaderFunctionArgs } from "react-router";
import { verifySession, getSessionToken } from "~/services/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as { anime_db?: import('~/services/db.server').Database };
  const anime_db = env?.anime_db;

  try {
    if (!anime_db) {
      return Response.json({ user: null }, { status: 401 });
    }

    const token = getSessionToken(request);
    const result = await verifySession(token, anime_db);

    if (!result.valid || !result.user) {
      return Response.json({ user: null });
    }

    return Response.json({ user: result.user });
  } catch (error) {
    console.error("Get user error:", error);
    return Response.json({ user: null }, { status: 500 });
  }
}
