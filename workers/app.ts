import { createRequestHandler } from "react-router";

const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE
);

export default {
    fetch(request: Request, env: Env, ctx: ExecutionContext) {
        return requestHandler(request, {
            cloudflare: { env: env as any, cf: request.cf as any, ctx },
        });
    },
} satisfies ExportedHandler<Env>;
