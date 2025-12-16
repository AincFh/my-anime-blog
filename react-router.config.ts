import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  future: {
    unstable_viteEnvironmentApi: true,
  },
  async presets() {
    const { cloudflarePreset } = await import("@react-router/cloudflare");
    return [cloudflarePreset()];
  },
} satisfies Config;
