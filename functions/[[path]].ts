import { createRequestHandler } from "react-router";

// @ts-expect-error - React Router provides the server build at build time
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
