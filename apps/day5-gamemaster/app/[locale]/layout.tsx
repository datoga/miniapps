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

const APP_NAME = "Game Master";
const APP_URL = "https://gamemaster.digital";

const seoContent: Record<string, LocaleSEOContent> = {
  es: {
    title: "Game Master - Organiza Torneos de Videojuegos",
    description:
      "Organiza torneos de videojuegos y competiciones. Brackets de eliminación, rankings por puntos o tiempo. Gratis, privado y sin registro. ¡Perfecto para gaming nights!",
    ogAlt: "Game Master - Tu organizador de torneos gaming",
    keywords: [
      "torneos videojuegos",
      "gaming tournaments",
      "brackets eliminación",
      "ranking gaming",
      "esports casero",
      "organizar torneo",
      "competición videojuegos",
      "game night",
      "mario kart torneo",
      "smash bros bracket",
    ],
  },
  en: {
    title: "Game Master - Organize Gaming Tournaments",
    description:
      "Organize video game tournaments and competitions. Elimination brackets, point or time rankings. Free, private, no registration. Perfect for gaming nights!",
    ogAlt: "Game Master - Your gaming tournament organizer",
    keywords: [
      "gaming tournaments",
      "video game brackets",
      "elimination bracket",
      "gaming ranking",
      "home esports",
      "organize tournament",
      "video game competition",
      "game night",
      "mario kart tournament",
      "smash bros bracket",
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
    category: "games",
  });
}

export const viewport: Viewport = generateViewport({
  lightThemeColor: "#0f172a",
  darkThemeColor: "#0f172a",
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
          "Eliminación simple y doble",
          "Rankings por puntos o tiempo",
          "Exporta/importa datos en JSON",
          "100% gratuito",
          "Sin registro",
          "Funciona offline",
        ]
      : [
          "Single and double elimination",
          "Point or time rankings",
          "Export/import data as JSON",
          "100% free",
          "No registration",
          "Works offline",
        ];

  const jsonLd = generateJsonLd({
    appName: APP_NAME,
    appUrl: APP_URL,
    locale,
    description: content!.description,
    applicationCategory: "GameApplication",
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
            <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
              {children}
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
        <GoogleAnalyticsScript gaId={gaId} />
      </body>
    </html>
  );
}
