/**
 * API: 获取当前用户信息
 * GET /api/user/me
 */

import type { Route } from "./+types/api.user.me";
import { json } from "react-router";
import { verifySession, getSessionToken } from "../services/auth.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { anime_db } = context.cloudflare.env;

  try {
    const token = getSessionToken(request);
    const result = await verifySession(token, anime_db);

    if (!result.valid || !result.user) {
      return json({ user: null }, { status: 401 });
    }

    return json({ user: result.user });
  } catch (error) {
    console.error("Get user error:", error);
    return json({ user: null }, { status: 500 });
  }
}

