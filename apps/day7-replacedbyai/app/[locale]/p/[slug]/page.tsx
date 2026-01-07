import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Footer } from "@miniapps/ui";
import { HeaderWithNav } from "@/components/HeaderWithNav";
import { getAllLocalizedSlugs, getProfessionBySlug, getDataset } from "@/lib/professions/load.server";
import { t as getContentTranslation, tMany } from "@/lib/professions/translations";
import type { Metadata } from "next";
import { ProfessionContent } from "@/components/profession/ProfessionContent";

export const dynamic = "force-static";

const APP_URL = "https://replacedbyai.guru";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Generate all possible profession pages at build time
// Uses localized slugs: /en/p/nurse, /es/p/enfermero
export async function generateStaticParams() {
  return getAllLocalizedSlugs();
}

// Generate comprehensive metadata for each profession page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as "en" | "es";
  const otherLoc = loc === "en" ? "es" : "en";
  const profession = getProfessionBySlug(slug, loc);

  if (!profession) {
    return {
      title: "Not Found",
    };
  }

  const t = await getTranslations({ locale, namespace: "profession" });
  const name = profession.name[loc] || profession.name.en;
  const otherName = profession.name[otherLoc] || profession.name.en;
  const description = getContentTranslation(profession.oneLinerKey, locale);

  // Get summary bullets for richer description
  const summaryBullets = tMany(profession.summaryBulletsKeys, locale);
  const richDescription = `${description} ${summaryBullets.slice(0, 2).join(". ")}.`;

  // Build title with SEO keywords
  const title = loc === "es"
    ? `¿La IA reemplazará a ${name}? Sí, pero no todavía`
    : `Will AI Replace ${name}? Yes, but not yet`;

  // Canonical and alternate URLs
  const canonicalUrl = `${APP_URL}/${loc}/p/${profession.slug[loc]}`;
  const alternateUrl = `${APP_URL}/${otherLoc}/p/${profession.slug[otherLoc]}`;

  // Keywords specific to the profession
  const baseKeywords = loc === "es" ? [
    `IA ${name}`,
    `automatización ${name}`,
    `futuro ${name}`,
    `${name} inteligencia artificial`,
    `${name} empleo`,
    `${name} trabajo`,
    `reemplazar ${name}`,
  ] : [
    `AI ${name}`,
    `${name} automation`,
    `future of ${name}`,
    `${name} artificial intelligence`,
    `${name} job`,
    `${name} career`,
    `replace ${name}`,
  ];

  return {
    title,
    description: richDescription.slice(0, 160),
    keywords: baseKeywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${APP_URL}/en/p/${profession.slug.en}`,
        es: `${APP_URL}/es/p/${profession.slug.es}`,
        "x-default": `${APP_URL}/en/p/${profession.slug.en}`,
      },
    },
    openGraph: {
      title,
      description: richDescription.slice(0, 200),
      url: canonicalUrl,
      siteName: "ReplacedByAI",
      type: "article",
      locale: loc === "es" ? "es_ES" : "en_US",
      alternateLocale: loc === "es" ? "en_US" : "es_ES",
      images: [
        {
          url: `${APP_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: loc === "es"
            ? `¿La IA reemplazará a ${name}? Análisis por tareas`
            : `Will AI Replace ${name}? Task-level analysis`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: richDescription.slice(0, 200),
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
  };
}

export default async function ProfessionPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const loc = locale as "en" | "es";
  const profession = getProfessionBySlug(slug, loc);

  if (!profession) {
    notFound();
  }

  // JSON-LD for the profession article
  const name = profession.name[loc] || profession.name.en;
  const description = getContentTranslation(profession.oneLinerKey, locale);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: loc === "es"
      ? `¿La IA reemplazará a ${name}?`
      : `Will AI Replace ${name}?`,
    description,
    author: {
      "@type": "Organization",
      name: "ReplacedByAI",
      url: APP_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "ReplacedByAI",
      logo: {
        "@type": "ImageObject",
        url: `${APP_URL}/icon/512`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${APP_URL}/${loc}/p/${profession.slug[loc]}`,
    },
    inLanguage: loc === "es" ? "es-ES" : "en-US",
  };

  // Occupation structured data
  const occupationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Occupation",
    name: name,
    description,
    occupationalCategory: profession.id,
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* JSON-LD for profession page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(occupationJsonLd) }}
      />

      <HeaderWithNav professionSlugs={profession.slug} />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <ProfessionContent profession={profession} locale={locale} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
