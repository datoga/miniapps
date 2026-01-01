import { GoogleAnalyticsScript } from "@miniapps/analytics";
import { locales, type Locale } from "@miniapps/i18n";
import { ThemeProvider } from "@miniapps/ui";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = "https://mentorflowapp.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "MentorFlow - Gestión de Mentoría Personal",
    template: "%s | MentorFlow",
  },
  description:
    "Aplicación gratuita para gestionar sesiones de mentoría. Registra objetivos, sesiones y el progreso de las personas que acompañas. 100% privado, sin registro.",
  keywords: [
    "mentoría",
    "mentoring",
    "coaching",
    "gestión de mentores",
    "seguimiento de mentees",
    "sesiones de mentoría",
    "desarrollo personal",
    "acompañamiento",
    "objetivos",
    "productividad",
    "app gratuita",
    "privacidad",
  ],
  authors: [{ name: "MentorFlow" }],
  creator: "MentorFlow",
  publisher: "MentorFlow",
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
    alternateLocale: "en_US",
    url: APP_URL,
    siteName: "MentorFlow",
    title: "MentorFlow - Gestión de Mentoría Personal",
    description:
      "Aplicación gratuita para gestionar sesiones de mentoría. Registra objetivos, sesiones y el progreso de las personas que acompañas. 100% privado.",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "MentorFlow - Gestión de Mentoría",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MentorFlow - Gestión de Mentoría Personal",
    description:
      "Aplicación gratuita para gestionar sesiones de mentoría. 100% privado, sin registro.",
    images: [`${APP_URL}/og-image.png`],
  },
  alternates: {
    canonical: APP_URL,
    languages: {
      es: `${APP_URL}/es`,
      en: `${APP_URL}/en`,
    },
  },
  category: "productivity",
};

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MentorFlow",
    description:
      "Aplicación gratuita para gestionar sesiones de mentoría. Registra objetivos, sesiones y el progreso de las personas que acompañas.",
    url: APP_URL,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    featureList: [
      "Gestión de personas/mentees",
      "Registro de sesiones",
      "Seguimiento de objetivos",
      "100% privado - datos locales",
      "Sin necesidad de registro",
      "Funciona offline",
    ],
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </ThemeProvider>
        <GoogleAnalyticsScript gaId={gaId} />
      </body>
    </html>
  );
}
