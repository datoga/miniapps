import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AboutSection } from "../../../components/AboutSection";
import { AppShellWrapper } from "../../../components/AppShellWrapper";

const APP_URL = "https://mentorflow.space";

const seoContent = {
  es: {
    title: "Acerca de MentorFlow - Gestión de Mentoría Privada",
    description:
      "Conoce MentorFlow: app gratuita y 100% privada para gestionar sesiones de mentoría. Sin registro, sin cuenta, todos los datos en tu dispositivo.",
    keywords: [
      "acerca de mentorflow",
      "app mentoría privada",
      "gestión mentoring",
      "app sin registro",
      "datos locales",
    ],
  },
  en: {
    title: "About MentorFlow - Private Mentoring Management",
    description:
      "Learn about MentorFlow: free and 100% private app to manage mentoring sessions. No registration, no account needed, all data stays on your device.",
    keywords: [
      "about mentorflow",
      "private mentoring app",
      "mentoring management",
      "no registration app",
      "local data",
    ],
  },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const content = seoContent[locale as keyof typeof seoContent] || seoContent.en;
  const ogLocale = locale === "es" ? "es_ES" : "en_US";

  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    openGraph: {
      type: "website",
      locale: ogLocale,
      alternateLocale: locale === "es" ? "en_US" : "es_ES",
      url: `${APP_URL}/${locale}/about`,
      siteName: "MentorFlow",
      title: content.title,
      description: content.description,
      images: [
        {
          url: `${APP_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: content.title,
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
      canonical: `${APP_URL}/${locale}/about`,
      languages: {
        es: `${APP_URL}/es/about`,
        en: `${APP_URL}/en/about`,
        "x-default": `${APP_URL}/es/about`,
      },
    },
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AppShellWrapper currentPath="about">
      <AboutSection />
    </AppShellWrapper>
  );
}
