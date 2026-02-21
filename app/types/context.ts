import type { Env } from "./env";

declare module "react-router" {
    interface AppLoadContext {
        cloudflare: {
            env: Env;
            cf: IncomingRequestCfProperties;
            ctx: ExecutionContext;
        };
    }
}

export interface AppLoadContext {
    cloudflare: {
        env: Env;
        cf: IncomingRequestCfProperties;
        ctx: ExecutionContext;
    };
}
