import { GoogleAnalyticsScript } from "@miniapps/analytics";
import { locales, type Locale } from "@miniapps/i18n";
import {
  generateJsonLd,
  generateSEOMetadata,
  generateViewport,
  type LocaleSEOContent,
} from "@miniapps/seo";
import { ThemeProvider } from "@miniapps/ui";
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

const APP_NAME = "Bilbo Tracker";
const APP_URL = "https://bilbo.live";

const seoContent: Record<string, LocaleSEOContent> = {
  es: {
    title: "Bilbo Tracker - Entrenamiento de Fuerza",
    description:
      "Registra tu progreso de entrenamiento con el método Bilbo. Sobrecarga progresiva, ciclos de entrenamiento y seguimiento de 1RM. Gratis y privado.",
    ogAlt: "Bilbo Tracker - Tu app de entrenamiento de fuerza",
    keywords: [
      "entrenamiento fuerza",
      "1rm",
      "sobrecarga progresiva",
      "press banca",
      "sentadilla",
      "peso muerto",
      "registro entrenamientos",
      "gym tracker",
    ],
  },
  en: {
    title: "Bilbo Tracker - Strength Training Tracker",
    description:
      "Track your training progress with the Bilbo method. Progressive overload, training cycles, and 1RM tracking. Free and private.",
    ogAlt: "Bilbo Tracker - Your strength training app",
    keywords: [
      "strength training",
      "1rm",
      "progressive overload",
      "bench press",
      "squat",
      "deadlift",
      "workout tracker",
      "gym tracker",
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
    googleVerification: "OpDwYcOvm-Yz5X0FiaxA608djiy52axWjx6bdJGnE8o",
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
          "Sobrecarga progresiva",
          "Ciclos de entrenamiento",
          "Seguimiento 1RM",
          "100% gratuito",
          "Funciona offline",
        ]
      : [
          "Progressive overload",
          "Training cycles",
          "1RM tracking",
          "100% free",
          "Works offline",
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
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
        <GoogleAnalyticsScript gaId={gaId} />
      </body>
    </html>
  );
}

