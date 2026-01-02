import type { Metadata } from "next";

export interface LocaleSEOContent {
  title: string;
  description: string;
  keywords: string[];
  ogAlt?: string;
}

export interface SEOConfig {
  appName: string;
  appUrl: string;
  locale: string;
  content: LocaleSEOContent;
  /** Google Search Console verification code */
  googleVerification?: string;
  /** Category for the app (e.g., "productivity", "education") */
  category?: string;
  /** Author name */
  author?: string;
  /** OG image path relative to appUrl (default: /og-image.png) */
  ogImagePath?: string;
  /** Private routes to exclude from indexing */
  privateRoutes?: string[];
}

/**
 * Generates comprehensive SEO metadata for Next.js apps with i18n support.
 * Based on best practices from Google, including OpenGraph, Twitter cards,
 * canonical URLs, and alternate language URLs.
 */
export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    appName,
    appUrl,
    locale,
    content,
    googleVerification,
    category = "productivity",
    author,
    ogImagePath = "/og-image.png",
  } = config;

  const ogLocale = locale === "es" ? "es_ES" : "en_US";
  const alternateLocale = locale === "es" ? "en_US" : "es_ES";
  const ogImageUrl = `${appUrl}${ogImagePath}`;

  return {
    title: {
      default: content.title,
      template: `%s | ${appName}`,
    },
    description: content.description,
    keywords: content.keywords,
    authors: author ? [{ name: author }] : [{ name: appName }],
    creator: appName,
    publisher: appName,
    ...(googleVerification && {
      verification: {
        google: googleVerification,
      },
    }),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      alternateLocale: alternateLocale,
      url: `${appUrl}/${locale}`,
      siteName: appName,
      title: content.title,
      description: content.description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: content.ogAlt || content.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${appUrl}/${locale}`,
      languages: {
        es: `${appUrl}/es`,
        en: `${appUrl}/en`,
      },
    },
    category,
  };
}

