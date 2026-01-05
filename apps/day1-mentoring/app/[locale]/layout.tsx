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

const APP_URL = "https://mentorflow.space";

// Locale-specific metadata
const seoContent = {
  es: {
    title: "MentorFlow - Gestión de Mentoría Personal",
    description:
      "Aplicación gratuita para gestionar sesiones de mentoría. Registra objetivos, sesiones y el progreso de las personas que acompañas. 100% privado, sin registro.",
    ogAlt: "MentorFlow - Gestión de Mentoría",
    keywords: [
      "mentoría",
      "mentoring",
      "coaching",
      "gestión de mentores",
      "sesiones de mentoría",
      "desarrollo personal",
      "acompañamiento",
      "objetivos",
      "app gratuita",
    ],
  },
  en: {
    title: "MentorFlow - Personal Mentoring Management",
    description:
      "Free app to manage mentoring sessions. Track goals, sessions, and the progress of the people you mentor. 100% private, no registration required.",
    ogAlt: "MentorFlow - Mentoring Management",
    keywords: [
      "mentoring",
      "coaching",
      "mentor management",
      "mentoring sessions",
      "personal development",
      "goal tracking",
      "free app",
      "privacy",
    ],
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const content = seoContent[locale as keyof typeof seoContent] || seoContent.en;
  const ogLocale = locale === "es" ? "es_ES" : "en_US";

  return {
    title: {
      default: content.title,
      template: "%s | MentorFlow",
    },
    description: content.description,
    keywords: content.keywords,
    authors: [{ name: "MentorFlow" }],
    creator: "MentorFlow",
    verification: {
      google: "izINkAr2XR6DHwLVBNWaU3D1gCZzWqrWEqeyR0UEAwc",
    },
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
      locale: ogLocale,
      alternateLocale: locale === "es" ? "en_US" : "es_ES",
      url: `${APP_URL}/${locale}`,
      siteName: "MentorFlow",
      title: content.title,
      description: content.description,
      images: [
        {
          url: `${APP_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: content.ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description,
      images: [`${APP_URL}/og-image.png`],
    },
    alternates: {
      canonical: `${APP_URL}/${locale}`,
      languages: {
        es: `${APP_URL}/es`,
        en: `${APP_URL}/en`,
        "x-default": `${APP_URL}/es`,
      },
    },
    category: "productivity",
  };
}

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
  const content = seoContent[locale as keyof typeof seoContent] || seoContent.en;

  const jsonLdFeatures =
    locale === "es"
      ? [
          "Gestión de personas/mentees",
          "Registro de sesiones",
          "Seguimiento de objetivos",
          "100% privado - datos locales",
          "Sin necesidad de registro",
          "Funciona offline",
        ]
      : [
          "Mentee management",
          "Session tracking",
          "Goal tracking",
          "100% private - local data",
          "No registration required",
          "Works offline",
        ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MentorFlow",
    description: content.description,
    url: `${APP_URL}/${locale}`,
    inLanguage: locale,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    featureList: jsonLdFeatures,
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
