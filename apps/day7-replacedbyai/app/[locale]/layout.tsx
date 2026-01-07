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
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

// Optimize fonts with display swap and preload
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

const APP_NAME = "ReplacedByAI";
const APP_URL = "https://replacedbyai.guru";

// Locale-specific SEO content - optimized for search
const seoContent: Record<string, LocaleSEOContent> = {
  en: {
    title: "Will AI Replace Me? Yes, but not yet | Task-Level Job Analysis",
    description:
      "Discover how AI will transform YOUR job task by task. Not fear, not hype—real analysis of 100+ professions showing what's automatable now, next, and later. Free tool.",
    ogAlt: "Will AI Replace Me? Task-level analysis showing AI impact on specific job tasks",
    keywords: [
      "will AI replace my job",
      "AI job replacement",
      "AI automation jobs",
      "future of work AI",
      "AI impact on careers",
      "job automation analysis",
      "which jobs will AI replace",
      "AI proof careers",
      "automation timeline jobs",
      "AI vs human jobs",
      "task automation AI",
      "career planning AI",
      "profession AI analysis",
      "jobs safe from AI",
      "AI workforce impact",
    ],
  },
  es: {
    title: "¿Me reemplazará la IA? Sí, pero no todavía | Análisis por Tareas",
    description:
      "Descubre cómo la IA transformará TU trabajo, tarea por tarea. Sin miedo, sin exageraciones—análisis real de +100 profesiones mostrando qué es automatizable ahora, pronto y después. Gratis.",
    ogAlt: "¿Me reemplazará la IA? Análisis por tareas del impacto de la IA en trabajos específicos",
    keywords: [
      "la IA reemplazará mi trabajo",
      "automatización IA empleos",
      "futuro del trabajo IA",
      "impacto IA en carreras",
      "análisis automatización laboral",
      "qué trabajos reemplazará la IA",
      "carreras a prueba de IA",
      "cronograma automatización empleos",
      "IA vs trabajos humanos",
      "automatización de tareas IA",
      "planificación carrera IA",
      "análisis profesiones IA",
      "trabajos seguros de la IA",
      "impacto IA fuerza laboral",
      "inteligencia artificial empleos",
    ],
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const content = seoContent[locale] || seoContent["en"];
  const otherLocale = locale === "en" ? "es" : "en";

  const baseMetadata = generateSEOMetadata({
    appName: APP_NAME,
    appUrl: APP_URL,
    locale,
    content: content!,
    category: "education",
  });

  // Enhanced metadata with alternates
  return {
    ...baseMetadata,
    metadataBase: new URL(APP_URL),
    alternates: {
      canonical: `${APP_URL}/${locale}`,
      languages: {
        en: `${APP_URL}/en`,
        es: `${APP_URL}/es`,
        "x-default": `${APP_URL}/en`,
      },
    },
    openGraph: {
      ...baseMetadata.openGraph,
      type: "website",
      siteName: APP_NAME,
      locale: locale === "es" ? "es_ES" : "en_US",
      alternateLocale: locale === "es" ? "en_US" : "es_ES",
      images: [
        {
          url: `${APP_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: content!.ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content!.title,
      description: content!.description,
      images: [`${APP_URL}/og-image.png`],
    },
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
    verification: {
      // Add your verification codes here
      // google: "your-google-verification-code",
    },
    other: {
      "theme-color": "#10b981",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "format-detection": "telephone=no",
    },
  };
}

// Viewport optimization with theme colors
export const viewport: Viewport = generateViewport({
  lightThemeColor: "#fafaf9",
  darkThemeColor: "#0c0a09",
});

// Generate static params for all locales at build time
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

  // JSON-LD structured data for rich search results
  const jsonLdFeatures =
    locale === "es"
      ? [
          "Análisis detallado de +100 profesiones",
          "18+ tareas analizadas por profesión",
          "4 niveles de automatización",
          "3 horizontes temporales",
          "Estrategias de adaptación prácticas",
          "Fuentes verificables (BLS, O*NET, OMS)",
          "Disponible offline (PWA)",
          "100% gratuito",
        ]
      : [
          "Detailed analysis of 100+ professions",
          "18+ tasks analyzed per profession",
          "4 automation levels",
          "3 time horizons",
          "Practical adaptation strategies",
          "Verifiable sources (BLS, O*NET, WHO)",
          "Available offline (PWA)",
          "100% free",
        ];

  const jsonLd = generateJsonLd({
    appName: APP_NAME,
    appUrl: APP_URL,
    locale,
    description: content!.description,
    applicationCategory: "EducationalApplication",
    featureList: jsonLdFeatures,
  });

  // Additional FAQ structured data for rich snippets
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: locale === "es" ? [
      {
        "@type": "Question",
        name: "¿La IA reemplazará mi trabajo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No exactamente. La IA no reemplaza trabajos completos, sino tareas específicas. Algunas tareas serán automatizadas, otras seguirán siendo humanas. Nuestro análisis te muestra exactamente cuáles."
        }
      },
      {
        "@type": "Question",
        name: "¿Qué profesiones son más seguras frente a la IA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Las profesiones con alto componente de empatía, creatividad, juicio ético y presencia física son más resistentes. Pero incluso estas verán algunas tareas automatizadas."
        }
      },
      {
        "@type": "Question",
        name: "¿Cuándo reemplazará la IA estos trabajos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Usamos 3 horizontes: Ahora (0-2 años), Próximo (3-5 años) y Después (5-10 años). Cada tarea tiene su propio cronograma basado en la tecnología actual y tendencias."
        }
      }
    ] : [
      {
        "@type": "Question",
        name: "Will AI replace my job?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Not exactly. AI doesn't replace whole jobs, but specific tasks within them. Some tasks will be automated, others will remain human. Our analysis shows you exactly which ones."
        }
      },
      {
        "@type": "Question",
        name: "Which professions are safest from AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Professions with high empathy, creativity, ethical judgment, and physical presence components are more resistant. But even these will see some tasks automated."
        }
      },
      {
        "@type": "Question",
        name: "When will AI replace these jobs?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We use 3 horizons: Now (0-2 years), Next (3-5 years), and Later (5-10 years). Each task has its own timeline based on current technology and trends."
        }
      }
    ]
  };

  // Organization structured data
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: APP_URL,
    logo: `${APP_URL}/icon/512`,
    sameAs: [
      // Add social media links here
    ]
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cusdis.com" />
        <link rel="preconnect" href="https://cusdis.com" crossOrigin="anonymous" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
        <GoogleAnalyticsScript gaId={gaId} />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
