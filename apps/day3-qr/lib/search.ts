import type { QrItem } from "./types";

/**
 * Search across any field of QR items
 * Matching: case-insensitive includes
 */
export function searchItems(
  items: QrItem[],
  query: string,
  showArchived: boolean
): QrItem[] {
  // First filter by archive status
  let filtered = items;
  if (!showArchived) {
    filtered = items.filter((item) => !item.archivedAt);
  }

  // If no query, return filtered items
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return filtered;
  }

  // Search across all fields
  return filtered.filter((item) => {
    const searchableFields = [
      item.name,
      item.data,
      item.kind,
      item.id,
      item.createdAt,
      item.archivedAt || "",
    ];

    return searchableFields.some((field) =>
      field.toLowerCase().includes(trimmed)
    );
  });
}

/**
 * Detect the kind of QR content
 */
export function detectKind(data: string): QrItem["kind"] {
  const trimmed = data.trim();

  // Check if it's a URL
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return "url";
    }
  } catch {
    // Not a valid URL
  }

  // Check for other URL-like patterns
  if (/^https?:\/\//i.test(trimmed)) {
    return "url";
  }

  // Default to text
  return "text";
}

/**
 * Validate URL for QR creation
 */
export function isValidUrl(data: string): boolean {
  try {
    const url = new URL(data.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Extract hostname for name suggestion
 */
export function extractHostname(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Generate a name suggestion from content
 */
export function suggestName(data: string, kind: QrItem["kind"]): string {
  if (kind === "url") {
    const hostname = extractHostname(data);
    if (hostname) {
      return hostname;
    }
  }

  // For text, use first few words
  const words = data.trim().split(/\s+/).slice(0, 5).join(" ");
  if (words.length > 30) {
    return words.substring(0, 30) + "...";
  }
  if (words) {
    return words;
  }

  // Fallback with date
  const date = new Date().toISOString().split("T")[0];
  return `${kind === "url" ? "URL" : "Text"} - ${date}`;
}

