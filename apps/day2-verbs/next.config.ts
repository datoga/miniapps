import type { NextConfig } from "next";
import path from "path";
import { sharedNextConfig } from "../../packages/config/next.shared";

const nextConfig: NextConfig = {
  ...sharedNextConfig,
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
