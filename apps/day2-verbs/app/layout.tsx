import { GoogleAnalyticsScript } from "@miniapps/analytics";
import { generateViewport } from "@miniapps/seo";
import { ThemeProvider } from "@miniapps/ui";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const APP_NAME = "Verb Master Pro";
const APP_URL = "https://verbmaster.pro";

export const metadata: Metadata = {
  title: {
    default: "Verb Master Pro - Aprende los Verbos Irregulares en Inglés Gratis",
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Aprende los verbos irregulares en inglés con quizzes interactivos, exámenes cronometrados y pronunciación con audio. Sigue tu progreso. 100% gratis.",
  keywords: [
    "irregular verbs",
    "english irregular verbs",
    "verb conjugation",
    "learn english",
    "english grammar",
    "verb practice",
    "english verbs quiz",
    "past tense verbs",
    "past participle",
    "language learning",
    "free english app",
    "study english",
    "ESL",
    "verb master",
    // Spanish keywords
    "verbos irregulares inglés",
    "verbos irregulares en inglés",
    "aprender verbos en inglés",
    "verbos en inglés gratis",
    "practicar verbos inglés",
    "lista verbos irregulares",
  ],
  authors: [{ name: "datoga.es", url: "https://datoga.es" }],
  creator: "datoga.es",
  publisher: APP_NAME,
  metadataBase: new URL(APP_URL),
  applicationName: APP_NAME,
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
    locale: "es_ES",
    url: APP_URL,
    siteName: APP_NAME,
    title: "Verb Master Pro - Aprende los Verbos Irregulares en Inglés Gratis",
    description:
      "Aprende los verbos irregulares en inglés con quizzes interactivos, exámenes y audio. Sigue tu progreso. 100% gratis.",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Verb Master Pro - App de Verbos Irregulares en Inglés",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verb Master Pro - Aprende los Verbos Irregulares en Inglés Gratis",
    description:
      "Aprende los verbos irregulares en inglés con quizzes y exámenes interactivos. ¡100% gratis!",
    images: [`${APP_URL}/og-image.png`],
    creator: "@datoga_es",
  },
  alternates: {
    canonical: APP_URL,
    languages: {
      "en": APP_URL,
      "es": APP_URL,
      "x-default": APP_URL,
    },
  },
  category: "education",
  verification: {
    google: "1gBkkaONti9u4AKeYJRhKE7A9YKTxGzwX4idPi7Zgec",
  },
};

export const viewport: Viewport = generateViewport({
  lightThemeColor: "#ffffff",
  darkThemeColor: "#0f172a",
});

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: APP_NAME,
  alternateName: "App de Verbos Irregulares en Inglés",
  description:
    "Aprende los verbos irregulares en inglés con quizzes interactivos, exámenes cronometrados y pronunciación con audio. Sigue tu progreso. 100% gratis.",
  url: APP_URL,
  inLanguage: "es",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web, Android, iOS",
  browserRequirements: "Requires JavaScript",
  softwareVersion: "1.0.0",
  author: {
    "@type": "Organization",
    name: "datoga.es",
    url: "https://datoga.es",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "150+ verbos irregulares",
    "Pronunciación con audio",
    "Quizzes interactivos",
    "Exámenes cronometrados",
    "Seguimiento de progreso",
    "Funciona sin conexión (PWA)",
    "Modo oscuro",
    "100% gratis",
  ],
  screenshot: `${APP_URL}/og-image.png`,
};

type LayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: LayoutProps) {
  const gaId = process.env["NEXT_PUBLIC_GA_ID"];

  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} bg-slate-50 font-sans antialiased transition-colors dark:bg-slate-900`}
      >
        <ThemeProvider>
          <main className="min-h-screen">{children}</main>
        </ThemeProvider>
        <GoogleAnalyticsScript gaId={gaId} />
      </body>
    </html>
  );
}
