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

const APP_NAME = "LabTracker";
const APP_URL = "https://labtracker.vercel.app";

const seoContent: Record<string, LocaleSEOContent> = {
  es: {
    title: "LabTracker - Seguimiento de Análisis Médicos",
    description:
      "Registra y visualiza tus resultados de análisis médicos. App gratuita y privada para hacer seguimiento de tu salud. Sin registro, datos locales.",
    ogAlt: "LabTracker - Controla tus análisis médicos",
    keywords: [
      "análisis médicos",
      "resultados laboratorio",
      "seguimiento salud",
      "historial médico",
      "valores sanguíneos",
      "app salud",
      "privacidad médica",
    ],
  },
  en: {
    title: "LabTracker - Medical Results Tracking",
    description:
      "Record and visualize your medical test results. Free and private app to track your health. No registration, local data storage.",
    ogAlt: "LabTracker - Track your medical results",
    keywords: [
      "medical results",
      "lab results",
      "health tracking",
      "medical history",
      "blood values",
      "health app",
      "medical privacy",
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
    category: "health",
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
          "Registro de análisis",
          "Visualización de tendencias",
          "100% privado",
          "Sin registro",
          "Datos locales",
        ]
      : [
          "Lab results tracking",
          "Trend visualization",
          "100% private",
          "No registration",
          "Local data",
        ];

  const jsonLd = generateJsonLd({
    appName: APP_NAME,
    appUrl: APP_URL,
    locale,
    description: content!.description,
    applicationCategory: "HealthApplication",
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
