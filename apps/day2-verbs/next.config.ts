import type { NextConfig } from "next";
import { sharedNextConfig } from "../../packages/config/next.shared";

const nextConfig: NextConfig = {
  ...sharedNextConfig,
  // Fix turbopack root detection - point to monorepo root
  turbopack: {
    root: "../..",
  },
};

export default nextConfig;
