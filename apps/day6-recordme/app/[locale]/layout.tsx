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

const APP_NAME = "record.me";
const APP_URL = "https://recordme.vercel.app";

const seoContent: Record<string, LocaleSEOContent> = {
  es: {
    title: "record.me - Grabador de Webcam",
    description:
      "Graba vídeos con tu webcam directamente a tu disco. Sin subidas a la nube, sin registro. Guarda grabaciones grandes de forma privada y segura.",
    ogAlt: "record.me - Tu grabador de webcam privado",
    keywords: [
      "grabador webcam",
      "grabar vídeo",
      "grabación local",
      "sin nube",
      "webcam recorder",
      "video recording",
      "file system api",
      "privado",
    ],
  },
  en: {
    title: "record.me - Webcam Recorder",
    description:
      "Record videos from your webcam directly to disk. No cloud uploads, no registration. Save large recordings privately and securely.",
    ogAlt: "record.me - Your private webcam recorder",
    keywords: [
      "webcam recorder",
      "video recording",
      "local recording",
      "no cloud",
      "file system api",
      "private recording",
      "screen recorder",
      "camera recorder",
    ],
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const content = seoContent[locale] ?? seoContent["en"];
  // TypeScript guard - we know "en" exists in seoContent
  if (!content) {
    throw new Error("SEO content not found");
  }

  return generateSEOMetadata({
    appName: APP_NAME,
    appUrl: APP_URL,
    locale,
    content,
    category: "productivity",
  });
}

export const viewport: Viewport = generateViewport({
  lightThemeColor: "#dc2626",
  darkThemeColor: "#dc2626",
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
  const content = seoContent[locale] ?? seoContent["en"];
  // TypeScript guard - we know "en" exists in seoContent
  if (!content) {
    throw new Error("SEO content not found");
  }

  const jsonLdFeatures =
    locale === "es"
      ? [
          "Grabación directa a disco",
          "Sin subidas a la nube",
          "100% privado",
          "Sin registro",
          "Soporta grabaciones largas",
          "Elige cámara y micrófono",
        ]
      : [
          "Direct-to-disk recording",
          "No cloud uploads",
          "100% private",
          "No registration",
          "Supports long recordings",
          "Choose camera and microphone",
        ];

  const jsonLd = generateJsonLd({
    appName: APP_NAME,
    appUrl: APP_URL,
    locale,
    description: content.description,
    applicationCategory: "MultimediaApplication",
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
