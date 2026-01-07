import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";
import { sharedNextConfig } from "../../packages/config/next.shared";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  ...sharedNextConfig,
  turbopack: {
    root: path.join(__dirname, "../.."),
  },

  // Redirects for SEO and alternative slug forms
  async redirects() {
    return [
      // Root redirect handled by proxy.ts middleware (detects browser language)

      // Common URL patterns
      { source: "/profession/:slug", destination: "/en/p/:slug", permanent: true },
      { source: "/profesion/:slug", destination: "/es/p/:slug", permanent: true },

      // Feminine → canonical masculine form (Spanish)
      { source: "/es/p/enfermera", destination: "/es/p/enfermero", permanent: true },
      { source: "/es/p/medica", destination: "/es/p/medico", permanent: true },
      { source: "/es/p/doctora", destination: "/es/p/medico", permanent: true },
      { source: "/es/p/farmaceutica", destination: "/es/p/farmaceutico", permanent: true },
      { source: "/es/p/psicologa", destination: "/es/p/psicologo", permanent: true },
      { source: "/es/p/veterinaria", destination: "/es/p/veterinario", permanent: true },
      { source: "/es/p/paramedica", destination: "/es/p/paramedico", permanent: true },
      { source: "/es/p/dentista-f", destination: "/es/p/dentista", permanent: true },
      { source: "/es/p/fisioterapeuta-f", destination: "/es/p/fisioterapeuta", permanent: true },

      // Alternative English forms
      { source: "/en/p/doctor", destination: "/en/p/physician", permanent: true },
      { source: "/en/p/vet", destination: "/en/p/veterinarian", permanent: true },
      { source: "/en/p/physio", destination: "/en/p/physiotherapist", permanent: true },
      { source: "/en/p/physical-therapist", destination: "/en/p/physiotherapist", permanent: true },
      { source: "/en/p/pt", destination: "/en/p/physiotherapist", permanent: true },
      { source: "/en/p/rn", destination: "/en/p/nurse", permanent: true },
      { source: "/en/p/registered-nurse", destination: "/en/p/nurse", permanent: true },
      { source: "/en/p/cna", destination: "/en/p/nursing-assistant", permanent: true },
      { source: "/en/p/emt", destination: "/en/p/paramedic", permanent: true },
      { source: "/en/p/therapist", destination: "/en/p/psychologist", permanent: true },
    ];
  },

  // Security and performance headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Security headers
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Cache headers for static assets
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
