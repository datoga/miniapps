import { z } from "zod";
import { NameSchema, SynonymsSchema, LocalizedSlugSchema } from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// THIN INDEX ITEM SCHEMA
// For client-side autocomplete - minimal data, no tasks or sources
// ─────────────────────────────────────────────────────────────────────────────

export const IndexItemSchema = z.object({
  id: z.string().regex(/^p\d{3}$/, "ID must match pattern p001-p999"),
  // Localized slugs: { en: "nurse", es: "enfermero" }
  slug: LocalizedSlugSchema,
  name: NameSchema,
  synonyms: SynonymsSchema,
});

export type IndexItem = z.infer<typeof IndexItemSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// THIN INDEX SCHEMA
// Lightweight dataset for client-side autocomplete
// ─────────────────────────────────────────────────────────────────────────────

export const ThinIndexSchema = z.object({
  version: z.string().min(1, "Version is required"),
  generatedAt: z.string().min(1, "Generated date is required"),
  locales: z.tuple([z.literal("en"), z.literal("es")]),
  items: z.array(IndexItemSchema),
});

export type ThinIndex = z.infer<typeof ThinIndexSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SLUGS LOCK FILE SCHEMA
// For stable slug assignment across builds
// ─────────────────────────────────────────────────────────────────────────────

// Localized slug record for lock file
const LocalizedSlugRecordSchema = z.object({
  en: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "English slug must be kebab-case"),
  es: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Spanish slug must be kebab-case"),
});

export const SlugsLockSchema = z.object({
  version: z.literal("2"), // Version 2 for localized slugs
  createdAt: z.string().min(1, "Created date is required"),
  slugsById: z.record(
    z.string().regex(/^p\d{3}$/, "Key must be profession ID"),
    LocalizedSlugRecordSchema
  ),
});

export type SlugsLock = z.infer<typeof SlugsLockSchema>;


