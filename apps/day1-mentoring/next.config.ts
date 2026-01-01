import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { sharedNextConfig } from "../../packages/config/next.shared";
import path from "path";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  ...sharedNextConfig,
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default withNextIntl(nextConfig);
