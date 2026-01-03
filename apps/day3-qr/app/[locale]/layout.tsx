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

const APP_NAME = "QRKit Way";
const APP_URL = "https://qrkitway.vercel.app";

const seoContent: Record<string, LocaleSEOContent> = {
  es: {
    title: "QRKit Way - Biblioteca de Códigos QR",
    description:
      "Crea, escanea y organiza tu biblioteca de códigos QR. Genera QR de URLs y textos, imprime, comparte y descarga. 100% privado, sin registro, funciona offline.",
    ogAlt: "QRKit Way - Tu biblioteca personal de códigos QR",
    keywords: [
      "generador qr",
      "código qr",
      "crear qr",
      "escanear qr",
      "biblioteca qr",
      "qr gratis",
      "qr offline",
      "imprimir qr",
      "qr url",
      "qr texto",
    ],
  },
  en: {
    title: "QRKit Way - QR Code Library",
    description:
      "Create, scan and organize your QR code library. Generate QR codes for URLs and text, print, share and download. 100% private, no registration, works offline.",
    ogAlt: "QRKit Way - Your personal QR code library",
    keywords: [
      "qr generator",
      "qr code",
      "create qr",
      "scan qr",
      "qr library",
      "free qr",
      "offline qr",
      "print qr",
      "qr url",
      "qr text",
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
          "Crea códigos QR",
          "Escanea y decodifica QR",
          "Biblioteca personal",
          "Descarga PNG/SVG",
          "Imprime múltiples copias",
          "100% privado - datos locales",
          "Sin registro",
          "Funciona offline",
        ]
      : [
          "Create QR codes",
          "Scan and decode QR",
          "Personal library",
          "Download PNG/SVG",
          "Print multiple copies",
          "100% private - local data",
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
            <AppShell title={APP_NAME}>{children}</AppShell>
          </NextIntlClientProvider>
        </ThemeProvider>
        <GoogleAnalyticsScript gaId={gaId} />
      </body>
    </html>
  );
}
