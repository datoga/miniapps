// Short ID length for slugs (4 chars = 65k combinations, sufficient for personal use)
const SHORT_ID_LENGTH = 4;

function slugifyName(name?: string): string {
  const base = name?.trim() || "persona";
  const normalized = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-") // non alphanumerics to dashes
    .replace(/-{2,}/g, "-") // collapse multiple dashes
    .replace(/^-+|-+$/g, ""); // trim dashes

  return normalized || "persona";
}

/**
 * Build a short, readable slug from mentee data
 * Format: "name-xxxx" where xxxx is first 4 chars of UUID
 * Example: "juan-garcia-c9af"
 */
export function buildMenteeSlug(mentee: { id: string; name?: string }): string {
  const nameSlug = slugifyName(mentee.name);
  const shortId = mentee.id.substring(0, SHORT_ID_LENGTH);
  return `${nameSlug}-${shortId}`;
}

/**
 * Extract mentee ID from slug by searching in mentees list
 * Falls back to treating entire slug as ID for backwards compatibility
 */
export function extractMenteeId(slug: string, mentees?: { id: string }[]): string {
  if (!slug) {
    return "";
  }

  // If we have mentees list, find by matching short ID
  if (mentees && mentees.length > 0) {
    const shortId = slug.split("-").pop() || "";
    const found = mentees.find((m) => m.id.startsWith(shortId));
    if (found) {
      return found.id;
    }
  }

  // Backwards compatibility: check if slug ends with full UUID
  const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const match = slug.match(uuidRegex);
  if (match) {
    return match[0];
  }

  // Last resort: return the last segment as potential short ID
  return slug.split("-").pop() || slug;
}

