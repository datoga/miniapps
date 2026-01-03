import type { QrItem, SortBy, SortDir } from "./types";

/**
 * Search across any field of QR items
 * Matching: case-insensitive includes
 */
export function searchItems(items: QrItem[], query: string): QrItem[] {
  // If no query, return all items
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return items;
  }

  // Search across all fields
  return items.filter((item) => {
    const searchableFields = [item.name, item.data, item.kind, item.id, item.createdAt];

    return searchableFields.some((field) => field.toLowerCase().includes(trimmed));
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
 * Extract name from URL - prefers last path segment, falls back to hostname
 */
export function extractNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Get pathname and split by /
    const pathParts = parsed.pathname.split("/").filter(Boolean);

    // Get the last meaningful segment
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart) {
      // Clean up the segment (remove extensions, decode URI)
      const cleaned = decodeURIComponent(lastPart)
        .replace(/\.[^/.]+$/, "") // Remove file extension
        .replace(/[-_]/g, " ") // Replace dashes/underscores with spaces
        .trim();

      if (cleaned.length > 0) {
        // Capitalize first letter
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }

    // Fallback to hostname without www
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
    const name = extractNameFromUrl(data);
    if (name) {
      // Truncate if too long
      if (name.length > 40) {
        return `${name.substring(0, 40)  }...`;
      }
      return name;
    }
  }

  // For text, use first few words
  const words = data.trim().split(/\s+/).slice(0, 5).join(" ");
  if (words.length > 30) {
    return `${words.substring(0, 30)  }...`;
  }
  if (words) {
    return words;
  }

  // Fallback with date
  const date = new Date().toISOString().split("T")[0];
  return `${kind === "url" ? "URL" : "Text"} - ${date}`;
}

/**
 * Sort items by field and direction
 */
export function sortItems(
  items: QrItem[],
  sortBy: SortBy,
  sortDir: SortDir
): QrItem[] {
  return [...items].sort((a, b) => {
    let comparison = 0;

    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "createdAt") {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    return sortDir === "desc" ? -comparison : comparison;
  });
}

