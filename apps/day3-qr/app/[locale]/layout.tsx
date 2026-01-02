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

const APP_NAME = "QuickQR";
const APP_URL = "https://quickqr.vercel.app";

const seoContent: Record<string, LocaleSEOContent> = {
  es: {
    title: "QuickQR - Generador de Códigos QR",
    description:
      "Genera códigos QR personalizados en segundos. App gratuita para crear QR de URLs, textos, contactos y más. Sin registro, privado y funciona offline.",
    ogAlt: "QuickQR - Genera códigos QR al instante",
    keywords: [
      "generador qr",
      "código qr",
      "crear qr",
      "qr gratis",
      "qr online",
      "qr personalizado",
      "escanear qr",
      "qr url",
    ],
  },
  en: {
    title: "QuickQR - QR Code Generator",
    description:
      "Generate custom QR codes in seconds. Free app to create QR codes for URLs, text, contacts and more. No registration, private and works offline.",
    ogAlt: "QuickQR - Generate QR codes instantly",
    keywords: [
      "qr generator",
      "qr code",
      "create qr",
      "free qr",
      "online qr",
      "custom qr",
      "scan qr",
      "qr url",
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
    category: "utilities",
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
          "Genera códigos QR",
          "QR para URLs y textos",
          "100% gratuito",
          "Sin registro",
          "Funciona offline",
        ]
      : [
          "Generate QR codes",
          "QR for URLs and text",
          "100% free",
          "No registration",
          "Works offline",
        ];

  const jsonLd = generateJsonLd({
    appName: APP_NAME,
    appUrl: APP_URL,
    locale,
    description: content!.description,
    applicationCategory: "UtilitiesApplication",
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
