import type { Config } from "@react-router/dev/config";
import { cloudflarePreset } from "@react-router/cloudflare";

export default {
  ssr: true,
  future: {
    unstable_viteEnvironmentApi: true,
  },
  presets: [cloudflarePreset()],
} satisfies Config;
