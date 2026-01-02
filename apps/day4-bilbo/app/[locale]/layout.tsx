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

const APP_NAME = "Bilbo Explorer";
const APP_URL = "https://bilbo-explorer.vercel.app";

const seoContent: Record<string, LocaleSEOContent> = {
  es: {
    title: "Bilbo Explorer - Descubre Bilbao",
    description:
      "Explora los mejores lugares de Bilbao. Guía turística gratuita con restaurantes, museos, parques y lugares emblemáticos. Funciona offline.",
    ogAlt: "Bilbo Explorer - Tu guía de Bilbao",
    keywords: [
      "bilbao",
      "turismo bilbao",
      "guía bilbao",
      "qué ver bilbao",
      "restaurantes bilbao",
      "guggenheim",
      "país vasco",
      "euskadi",
    ],
  },
  en: {
    title: "Bilbo Explorer - Discover Bilbao",
    description:
      "Explore the best places in Bilbao. Free tourist guide with restaurants, museums, parks and landmarks. Works offline.",
    ogAlt: "Bilbo Explorer - Your Bilbao guide",
    keywords: [
      "bilbao",
      "bilbao tourism",
      "bilbao guide",
      "things to do bilbao",
      "bilbao restaurants",
      "guggenheim",
      "basque country",
      "spain travel",
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
    category: "travel",
  });
}

export const viewport: Viewport = generateViewport({
  lightThemeColor: "#ffffff",
  darkThemeColor: "#0a0a0a",
});

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

  const jsonLdFeatures =
    locale === "es"
      ? [
          "Guía de Bilbao",
          "Restaurantes y bares",
          "Museos y cultura",
          "100% gratuito",
          "Funciona offline",
        ]
      : [
          "Bilbao guide",
          "Restaurants and bars",
          "Museums and culture",
          "100% free",
          "Works offline",
        ];

  const jsonLd = generateJsonLd({
    appName: APP_NAME,
    appUrl: APP_URL,
    locale,
    description: content!.description,
    applicationCategory: "TravelApplication",
    featureList: jsonLdFeatures,
  });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <AppShell>{children}</AppShell>
          </NextIntlClientProvider>
        </ThemeProvider>
        <GoogleAnalyticsScript gaId={gaId} />
      </body>
    </html>
  );
}
