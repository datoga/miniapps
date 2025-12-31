import type { NextConfig } from "next";

export const sharedNextConfig: Partial<NextConfig> = {
  // Transpile shared packages
  transpilePackages: [
    "@miniapps/ui",
    "@miniapps/i18n",
    "@miniapps/analytics",
    "@miniapps/storage",
  ],

  // Performance optimizations
  reactStrictMode: true,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env["NODE_ENV"] === "production",
  },

  // Experimental performance features
  experimental: {
    optimizePackageImports: [
      "@miniapps/ui",
      "@miniapps/i18n",
      "@miniapps/analytics",
      "clsx",
      "tailwind-merge",
    ],
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },

  // Headers for caching static assets
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:all*(js|css)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:all*(woff|woff2|ttf|otf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Remove X-Powered-By header
  poweredByHeader: false,
};

