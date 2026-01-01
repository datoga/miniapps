const UUID_REGEX = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function slugifyName(name?: string): string {
  const base = name?.trim() || "mentee";
  const normalized = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-") // non alphanumerics to dashes
    .replace(/-{2,}/g, "-") // collapse multiple dashes
    .replace(/^-+|-+$/g, ""); // trim dashes

  return normalized || "mentee";
}

export function buildMenteeSlug(mentee: { id: string; name?: string }): string {
  const base = slugifyName(mentee.name);
  return `${base}-${mentee.id}`;
}

export function extractMenteeId(slug: string): string {
  if (!slug) return "";
  const match = slug.match(UUID_REGEX);
  return match ? match[0] : slug;
}

