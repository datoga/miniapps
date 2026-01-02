import { GoogleAnalyticsScript } from "@miniapps/analytics";
import { locales, type Locale } from "@miniapps/i18n";
import {
  generateJsonLd,
  generateSEOMetadata,
  generateViewport,
  type LocaleSEOContent,
} from "@miniapps/seo";
import { AppShell, ThemeProvider } from "@miniapps/ui";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";

// Optimize fonts with display swap and preload
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const APP_NAME = "MiniApp Studio";
const APP_URL = "https://miniapp-studio.vercel.app";

// Locale-specific SEO content
const seoContent: Record<string, LocaleSEOContent> = {
  es: {
    title: "MiniApp Studio - Plantilla para Mini Apps",
    description:
      "Kit de desarrollo para crear mini apps PWA con Next.js. Incluye i18n, temas, analytics, almacenamiento offline y SEO optimizado. 100% gratuito.",
    ogAlt: "MiniApp Studio - Tu kit para construir mini apps",
    keywords: [
      "mini apps",
      "pwa",
      "next.js",
      "plantilla",
      "template",
      "react",
      "typescript",
      "monorepo",
      "i18n",
      "tema oscuro",
    ],
  },
  en: {
    title: "MiniApp Studio - Mini App Template",
    description:
      "Development toolkit for creating PWA mini apps with Next.js. Includes i18n, theming, analytics, offline storage, and SEO optimized. 100% free.",
    ogAlt: "MiniApp Studio - Your toolkit for building mini apps",
    keywords: [
      "mini apps",
      "pwa",
      "next.js",
      "template",
      "boilerplate",
      "react",
      "typescript",
      "monorepo",
      "i18n",
      "dark mode",
    ],
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const content = seoContent[locale] || seoContent["en"];

  return generateSEOMetadata({
    appName: APP_NAME,
    appUrl: APP_URL,
    locale,
    content: content!,
    category: "productivity",
  });
}

// Viewport optimization with theme colors
export const viewport: Viewport = generateViewport({
  lightThemeColor: "#ffffff",
  darkThemeColor: "#0a0a0a",
});

// Generate static params for all locales at build time
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const gaId = process.env["NEXT_PUBLIC_GA_ID"];
  const content = seoContent[locale] || seoContent["en"];

  // JSON-LD structured data for rich search results
  const jsonLdFeatures =
    locale === "es"
      ? [
          "Internacionalización (ES/EN)",
          "Tema claro/oscuro",
          "Google Analytics GA4",
          "Almacenamiento IndexedDB",
          "PWA ready",
          "Deploy en Vercel",
        ]
      : [
          "Internationalization (ES/EN)",
          "Light/Dark theming",
          "Google Analytics GA4",
          "IndexedDB storage",
          "PWA ready",
          "Vercel deploy",
        ];

  const jsonLd = generateJsonLd({
    appName: APP_NAME,
    appUrl: APP_URL,
    locale,
    description: content!.description,
    applicationCategory: "DeveloperApplication",
    featureList: jsonLdFeatures,
  });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <AppShell
              navItems={[
                { href: "#features", labelKey: "nav.features" },
                { href: "#about", labelKey: "nav.about" },
              ]}
            >
              {children}
            </AppShell>
          </NextIntlClientProvider>
        </ThemeProvider>
        <GoogleAnalyticsScript gaId={gaId} />
      </body>
    </html>
  );
}
