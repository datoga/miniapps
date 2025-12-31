import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@miniapps/ui",
    "@miniapps/i18n",
    "@miniapps/analytics",
    "@miniapps/storage",
  ],
};

export default withNextIntl(nextConfig);

