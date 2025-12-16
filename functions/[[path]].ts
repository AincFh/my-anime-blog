import { createRequestHandler } from "react-router";

// @ts-ignore - virtual module provided by React Router at build time
import * as serverBuild from "../build/server";

const requestHandler = createRequestHandler(serverBuild, "production");

export const onRequest: PagesFunction<Env> = async (context) => {
    return requestHandler(context.request, {
        cloudflare: {
            env: context.env,
            ctx: context,
        },
    });
};
