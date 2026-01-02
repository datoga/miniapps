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

const APP_NAME = "CareerBoard";
const APP_URL = "https://careerboard.vercel.app";

const seoContent: Record<string, LocaleSEOContent> = {
  es: {
    title: "CareerBoard - Gestión de Búsqueda de Empleo",
    description:
      "Organiza tu búsqueda de empleo con un tablero Kanban visual. Rastrea candidaturas, entrevistas y ofertas. Gratuito, privado y offline.",
    ogAlt: "CareerBoard - Tu tablero de búsqueda de empleo",
    keywords: [
      "búsqueda empleo",
      "gestión candidaturas",
      "tablero kanban",
      "ofertas trabajo",
      "entrevistas",
      "job tracker",
      "aplicaciones empleo",
    ],
  },
  en: {
    title: "CareerBoard - Job Search Management",
    description:
      "Organize your job search with a visual Kanban board. Track applications, interviews and offers. Free, private and offline.",
    ogAlt: "CareerBoard - Your job search board",
    keywords: [
      "job search",
      "application tracking",
      "kanban board",
      "job offers",
      "interviews",
      "job tracker",
      "career management",
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
          "Tablero Kanban visual",
          "Seguimiento de candidaturas",
          "100% privado",
          "Sin registro",
          "Funciona offline",
        ]
      : [
          "Visual Kanban board",
          "Application tracking",
          "100% private",
          "No registration",
          "Works offline",
        ];

  const jsonLd = generateJsonLd({
    appName: APP_NAME,
    appUrl: APP_URL,
    locale,
    description: content!.description,
    applicationCategory: "ProductivityApplication",
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
