import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { sharedNextConfig } from "../../packages/config/next.shared";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  ...sharedNextConfig,
};

export default withNextIntl(nextConfig);
