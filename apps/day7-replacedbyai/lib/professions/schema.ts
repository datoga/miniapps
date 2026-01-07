/**
 * Profession Schema - Using translation keys
 *
 * The compiled dataset uses translation keys (e.g., "p001.oneLiner")
 * that reference content in separate translation files:
 * - content/translations/en.json
 * - content/translations/es.json
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const AutomationLevelSchema = z.enum(["assist", "partial", "majority", "total"]);
export type AutomationLevel = z.infer<typeof AutomationLevelSchema>;

export const HorizonSchema = z.enum(["0-2", "3-5", "5-10"]);
export type Horizon = z.infer<typeof HorizonSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATION KEY PATTERN
// ─────────────────────────────────────────────────────────────────────────────

// Translation keys follow the pattern: p{id}.{section}.{index}.{field}
// Examples:
// - p001.oneLiner
// - p001.task.0.desc
// - p001.timeline.now.changes.0

const TranslationKeySchema = z.string().regex(/^p\d{3}\./);

// ─────────────────────────────────────────────────────────────────────────────
// NAME (bilingual - these are short and stable)
// ─────────────────────────────────────────────────────────────────────────────

export const NameSchema = z.object({
  en: z.string().min(1),
  es: z.string().min(1),
});

export const SynonymsSchema = z.object({
  en: z.array(z.string().min(1)).min(1),
  es: z.array(z.string().min(1)).min(1),
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK
// ─────────────────────────────────────────────────────────────────────────────

export const TaskSchema = z.object({
  // Translation key for task description (e.g., "p001.task.0.desc")
  taskKey: TranslationKeySchema,
  automationLevel: AutomationLevelSchema,
  horizon: HorizonSchema,
  // Translation keys for why it changes (e.g., ["p001.task.0.why.0", "p001.task.0.why.1"])
  whyItChangesKeys: z.array(TranslationKeySchema).min(1),
  // Translation keys for what stays human
  whatStaysHumanKeys: z.array(TranslationKeySchema).min(1),
});

export type Task = z.infer<typeof TaskSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────────────────────────────────────

export const TimelinePhaseSchema = z.enum(["Now", "Next", "Later"]);

export const TimelineEntrySchema = z.object({
  phase: TimelinePhaseSchema,
  // Translation keys
  whatChangesKeys: z.array(TranslationKeySchema).min(1),
  implicationsKeys: z.array(TranslationKeySchema).min(1),
});

export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SIGNALS AND TOOLS
// ─────────────────────────────────────────────────────────────────────────────

export const SignalAndToolSchema = z.object({
  // Translation keys
  signalKey: TranslationKeySchema,
  toolExamplesKeys: z.array(TranslationKeySchema).min(1),
  whyItMattersKey: TranslationKeySchema,
});

export type SignalAndTool = z.infer<typeof SignalAndToolSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTATION STRATEGIES
// ─────────────────────────────────────────────────────────────────────────────

export const AdaptationStrategySchema = z.object({
  // Translation keys
  timeframeKey: TranslationKeySchema,
  actionsKeys: z.array(TranslationKeySchema).min(1),
  expectedOutcomeKey: TranslationKeySchema,
});

export type AdaptationStrategy = z.infer<typeof AdaptationStrategySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE
// ─────────────────────────────────────────────────────────────────────────────

export const SourceSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  year: z.string(),
  url: z.string().url(),
  // Translation key for note
  noteKey: TranslationKeySchema,
});

export type Source = z.infer<typeof SourceSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// NOTES
// ─────────────────────────────────────────────────────────────────────────────

export const NotesSchema = z.object({
  // Translation keys
  assumptionsKeys: z.array(TranslationKeySchema).min(1),
  scopeBoundariesKeys: z.array(TranslationKeySchema).min(1),
});

export type Notes = z.infer<typeof NotesSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSION (COMPILED)
// ─────────────────────────────────────────────────────────────────────────────

// Localized slugs for URLs
export const LocalizedSlugSchema = z.object({
  en: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  es: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export const ProfessionSchema = z.object({
  id: z.string().regex(/^p\d{3}$/),
  // Localized slugs: { en: "nurse", es: "enfermero" }
  slug: LocalizedSlugSchema,
  // Names stay bilingual (short, stable)
  name: NameSchema,
  synonyms: SynonymsSchema,
  // Translation key for one-liner
  oneLinerKey: TranslationKeySchema,
  // Translation keys for summary bullets (always 3)
  summaryBulletsKeys: z.array(TranslationKeySchema).length(3),
  // Tasks with translation keys
  tasks: z.array(TaskSchema).min(18),
  // Timeline (always 3 phases)
  timeline: z.array(TimelineEntrySchema).length(3),
  signalsAndTools: z.array(SignalAndToolSchema).min(1),
  adaptationStrategies: z.array(AdaptationStrategySchema).min(1),
  sources: z.array(SourceSchema).min(6),
  notes: NotesSchema,
});

export type Profession = z.infer<typeof ProfessionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// COMPILED DATASET
// ─────────────────────────────────────────────────────────────────────────────

export const CompiledDatasetSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  contentLocale: z.literal("en"),
  uiLocales: z.array(z.string()).min(2),
  automationLevels: z.array(AutomationLevelSchema),
  horizons: z.array(HorizonSchema),
  professions: z.array(ProfessionSchema),
});

export type CompiledDataset = z.infer<typeof CompiledDatasetSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// RAW SCHEMA (English only, for input)
// ─────────────────────────────────────────────────────────────────────────────

export const RawTaskSchema = z.object({
  task: z.string().min(1),
  automationLevel: AutomationLevelSchema,
  horizon: HorizonSchema,
  whyItChanges: z.array(z.string().min(1)).min(1),
  whatStaysHuman: z.array(z.string().min(1)).min(1),
});

export const RawTimelineEntrySchema = z.object({
  phase: TimelinePhaseSchema,
  whatChanges: z.array(z.string().min(1)).min(1),
  implications: z.array(z.string().min(1)).min(1),
});

export const RawSignalAndToolSchema = z.object({
  signal: z.string().min(1),
  toolExamples: z.array(z.string().min(1)).min(1),
  whyItMatters: z.string().min(1),
});

export const RawAdaptationStrategySchema = z.object({
  timeframe: z.string().min(1),
  actions: z.array(z.string().min(1)).min(1),
  expectedOutcome: z.string().min(1),
});

export const RawSourceSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  year: z.string(),
  url: z.string().url(),
  note: z.string().min(1),
});

export const RawNotesSchema = z.object({
  assumptions: z.array(z.string().min(1)).min(1),
  scopeBoundaries: z.array(z.string().min(1)).min(1),
});

export const RawProfessionSchema = z.object({
  id: z.string().regex(/^p\d{3}$/),
  slug: z.string().optional(),
  name: NameSchema, // Bilingual names in raw too
  synonyms: SynonymsSchema, // Bilingual synonyms in raw too
  oneLiner: z.string().min(1),
  summaryBullets: z.array(z.string().min(1)).length(3),
  tasks: z.array(RawTaskSchema).min(18),
  timeline: z.array(RawTimelineEntrySchema).length(3),
  signalsAndTools: z.array(RawSignalAndToolSchema).min(1),
  adaptationStrategies: z.array(RawAdaptationStrategySchema).min(1),
  sources: z.array(RawSourceSchema).min(6),
  notes: RawNotesSchema,
});

export type RawProfession = z.infer<typeof RawProfessionSchema>;

export const RawDatasetSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  contentLocale: z.literal("en"),
  uiLocales: z.array(z.string()),
  automationLevels: z.array(AutomationLevelSchema),
  horizons: z.array(HorizonSchema),
  professions: z.array(RawProfessionSchema),
});

export type RawDataset = z.infer<typeof RawDatasetSchema>;
