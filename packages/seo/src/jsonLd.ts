export interface JsonLdConfig {
  appName: string;
  appUrl: string;
  locale: string;
  description: string;
  /** App category for schema.org (e.g., "ProductivityApplication", "EducationalApplication") */
  applicationCategory?: string;
  /** List of features in the current locale */
  featureList?: string[];
  /** Price (default: "0" for free) */
  price?: string;
  /** Currency (default: "EUR") */
  currency?: string;
  /** Additional schema.org properties */
  additionalProperties?: Record<string, unknown>;
}

export interface JsonLdSchema {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    "@type": string;
    price: string;
    priceCurrency: string;
  };
  featureList?: string[];
  [key: string]: unknown;
}

/**
 * Generates JSON-LD structured data for WebApplication schema.
 * This helps search engines understand the app and may enhance search results.
 */
export function generateJsonLd(config: JsonLdConfig): JsonLdSchema {
  const {
    appName,
    appUrl,
    locale,
    description,
    applicationCategory = "ProductivityApplication",
    featureList,
    price = "0",
    currency = "EUR",
    additionalProperties = {},
  } = config;

  const jsonLd: JsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: appName,
    description,
    url: `${appUrl}/${locale}`,
    inLanguage: locale,
    applicationCategory,
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
    },
    ...additionalProperties,
  };

  if (featureList && featureList.length > 0) {
    jsonLd.featureList = featureList;
  }

  return jsonLd;
}

/**
 * React component helper to render JSON-LD in the document head.
 * Usage: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
 */
export function jsonLdToString(jsonLd: JsonLdSchema): string {
  return JSON.stringify(jsonLd);
}

