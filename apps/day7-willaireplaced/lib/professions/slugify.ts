/**
 * Slugify text for URL-safe slugs
 * - lowercase
 * - remove diacritics
 * - replace & / with "and" / "-"
 * - keep only [a-z0-9-]
 * - collapse multiple dashes
 * - trim dashes from ends
 */
export function slugify(text: string): string {
  return (
    text
      // Normalize and remove diacritics
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Lowercase
      .toLowerCase()
      // Replace & with "and"
      .replace(/&/g, "and")
      // Replace / with dash
      .replace(/\//g, "-")
      // Keep only alphanumeric and spaces/dashes
      .replace(/[^a-z0-9\s-]/g, "")
      // Replace whitespace with dashes
      .replace(/\s+/g, "-")
      // Collapse multiple dashes
      .replace(/-+/g, "-")
      // Trim dashes from ends
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * Generate a unique slug with collision handling
 * If baseSlug exists in usedSlugs, appends -2, -3, etc.
 */
export function generateUniqueSlug(baseSlug: string, usedSlugs: Set<string>): string {
  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let candidateSlug = `${baseSlug}-${counter}`;

  while (usedSlugs.has(candidateSlug)) {
    counter++;
    candidateSlug = `${baseSlug}-${counter}`;
  }

  return candidateSlug;
}


