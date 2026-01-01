import { z } from "zod";

// NextStep schema
export const NextStepSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  done: z.boolean().default(false),
});

export type NextStep = z.infer<typeof NextStepSchema>;

// Mentee schema
export const MenteeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  age: z.number().int().positive().optional(),
  inPersonAvailable: z.boolean().optional(),
  inPersonNotes: z.string().optional(),
  goal: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Mentee = z.infer<typeof MenteeSchema>;

// Mentee form input (for validation)
export const MenteeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.union([z.number().int().positive(), z.literal(""), z.undefined()]).optional(),
  inPersonAvailable: z.boolean().optional(),
  inPersonNotes: z.string().optional(),
  goal: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type MenteeFormInput = z.infer<typeof MenteeFormSchema>;

// Session schema
export const SessionSchema = z.object({
  id: z.string().uuid(),
  menteeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  title: z.string().optional(),
  notes: z.string().optional(),
  nextSteps: z.array(NextStepSchema).default([]),
  tags: z.array(z.string()).default([]),
  rating: z.number().int().min(1).max(5).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;

// Session form input
export const SessionFormSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  title: z.string().optional(),
  notes: z.string().optional(),
  nextSteps: z.array(NextStepSchema).default([]),
  tags: z.array(z.string()).default([]),
  rating: z.union([z.number().int().min(1).max(5), z.literal(""), z.undefined()]).optional(),
});

export type SessionFormInput = z.infer<typeof SessionFormSchema>;

// Settings schema
export const SettingsSchema = z.object({
  lastSelectedMenteeId: z.string().uuid().nullable().default(null),
  showArchived: z.boolean().default(false),
});

export type Settings = z.infer<typeof SettingsSchema>;

// Backup schema
export const BackupSchema = z.object({
  schemaVersion: z.literal(1),
  appId: z.literal("day1-mentoring"),
  exportedAt: z.string().datetime(),
  data: z.object({
    settings: SettingsSchema.partial(),
    mentees: z.array(MenteeSchema),
    sessions: z.array(SessionSchema),
  }),
});

export type Backup = z.infer<typeof BackupSchema>;

