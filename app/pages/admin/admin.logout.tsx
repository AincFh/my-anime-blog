import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

/**
 * 退出登录
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // 清除会话Cookie
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );

  return redirect("/panel/login", { headers });
}

