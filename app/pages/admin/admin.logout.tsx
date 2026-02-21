import { redirect } from "react-router";
import type { Route } from "./+types/admin.logout";

/**
 * 退出登录
 */
export async function loader({ request }: Route.LoaderArgs) {
  // 清除会话Cookie
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );

  return redirect("/admin/login", { headers });
}

