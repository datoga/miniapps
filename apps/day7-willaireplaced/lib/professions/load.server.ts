/**
 * Server-only data loader for professions
 *
 * This module MUST only be imported in Server Components or build scripts.
 * It reads the compiled dataset from the filesystem at build time.
 *
 * DO NOT import this in client components - it will fail!
 */

import "server-only";
import { readFileSync } from "fs";
import { join } from "path";
import type { CompiledDataset, Profession } from "./schema";

// Cache the dataset in memory for the duration of the build
let cachedDataset: CompiledDataset | null = null;

/**
 * Get the full compiled dataset
 * This is only called at build time during static generation
 */
export function getDataset(): CompiledDataset {
  if (cachedDataset) {
    return cachedDataset;
  }

  const filePath = join(process.cwd(), "content", "professions.compiled.json");

  try {
    const content = readFileSync(filePath, "utf-8");
    cachedDataset = JSON.parse(content) as CompiledDataset;
    return cachedDataset;
  } catch (error) {
    console.error("Failed to load professions dataset:", error);
    throw new Error(
      "Failed to load professions dataset. Did you run 'npm run compile:professions'?"
    );
  }
}

/**
 * Get all profession slugs for a specific locale (for generateStaticParams)
 */
export function getAllSlugsForLocale(locale: "en" | "es"): string[] {
  const dataset = getDataset();
  return dataset.professions.map((p) => p.slug[locale]);
}

/**
 * Get all localized slug pairs (for generateStaticParams across all locales)
 */
export function getAllLocalizedSlugs(): Array<{ locale: string; slug: string }> {
  const dataset = getDataset();
  const result: Array<{ locale: string; slug: string }> = [];

  for (const p of dataset.professions) {
    result.push({ locale: "en", slug: p.slug.en });
    result.push({ locale: "es", slug: p.slug.es });
  }

  return result;
}

/**
 * Get all profession IDs (for generateStaticParams)
 */
export function getAllIds(): string[] {
  const dataset = getDataset();
  return dataset.professions.map((p) => p.id);
}

/**
 * Get a profession by its slug and locale
 */
export function getProfessionBySlug(slug: string, locale: "en" | "es"): Profession | null {
  const dataset = getDataset();
  return dataset.professions.find((p) => p.slug[locale] === slug) ?? null;
}

/**
 * Get a profession by its slug in any locale (fallback)
 */
export function getProfessionByAnySlug(slug: string): Profession | null {
  const dataset = getDataset();
  return dataset.professions.find(
    (p) => p.slug.en === slug || p.slug.es === slug
  ) ?? null;
}

/**
 * Get a profession by its ID
 */
export function getProfessionById(id: string): Profession | null {
  const dataset = getDataset();
  return dataset.professions.find((p) => p.id === id) ?? null;
}

/**
 * Get the total count of professions
 */
export function getProfessionCount(): number {
  const dataset = getDataset();
  return dataset.professions.length;
}

/**
 * Get metadata about the dataset
 */
export function getDatasetMeta(): {
  version: string;
  generatedAt: string;
  professionCount: number;
} {
  const dataset = getDataset();
  return {
    version: dataset.version,
    generatedAt: dataset.generatedAt,
    professionCount: dataset.professions.length,
  };
}


