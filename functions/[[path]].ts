import { createPagesFunctionHandler } from "@react-router/cloudflare";

// @ts-ignore - virtual module provided by React Router at build time
import * as serverBuild from "../build/server";

export const onRequest = createPagesFunctionHandler({
    build: serverBuild,
    mode: process.env.NODE_ENV,
});
