import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
    const headers = new Headers();
    headers.append(
        "Set-Cookie",
        "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    );

    return redirect("/", { headers });
}
