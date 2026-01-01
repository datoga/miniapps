import { z } from "zod";

// NextStep schema
export const NextStepSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  done: z.boolean().default(false),
});

export type NextStep = z.infer<typeof NextStepSchema>;

// Note schema (for post-it style notes)
export const NoteSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  color: z.enum(["yellow", "pink", "blue", "green", "purple"]).default("yellow"),
  createdAt: z.string().datetime(),
});

export type Note = z.infer<typeof NoteSchema>;

// Action step schema (for goal action plans)
export const ActionStepSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  done: z.boolean().default(false),
});

export type ActionStep = z.infer<typeof ActionStepSchema>;

// Goal schema
export const GoalSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  completed: z.boolean().default(false),
  description: z.string().optional(), // Free text, action plan, etc.
  actions: z.array(ActionStepSchema).default([]), // Action plan
  createdAt: z.string().datetime(),
});

export type Goal = z.infer<typeof GoalSchema>;

// Mentee schema
export const MenteeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  age: z.number().int().positive().optional(),
  image: z.string().optional(), // Base64 encoded image
  email: z.string().email().optional().or(z.literal("")), // Email address
  phone: z.string().optional(), // Phone number
  hasWhatsapp: z.boolean().optional(), // Has WhatsApp
  location: z.string().optional(), // Location (city, country)
  inPersonAvailable: z.boolean().optional(), // Available for in-person meetings
  availabilityNotes: z.string().optional(), // Availability notes (schedule, preferences)
  // Keep inPersonNotes for backward compatibility, maps to location
  inPersonNotes: z.string().optional(),
  // Keep goal for backward compatibility, will be migrated to goals array
  goal: z.string().optional(),
  goals: z.array(GoalSchema).default([]), // Multiple goals
  notes: z.array(NoteSchema).default([]),
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
  image: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  hasWhatsapp: z.boolean().optional(),
  location: z.string().optional(),
  inPersonAvailable: z.boolean().optional(),
  availabilityNotes: z.string().optional(),
  goals: z.array(GoalSchema).default([]),
  notes: z.array(NoteSchema).default([]),
  tags: z.array(z.string()).default([]),
  archived: z.boolean().optional(),
});

export type MenteeFormInput = z.infer<typeof MenteeFormSchema>;

// Session schema
export const SessionSchema = z.object({
  id: z.string().uuid(),
  menteeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional()
    .or(z.literal("")),
  title: z.string().optional(),
  notes: z.string().optional(),
  nextSteps: z.array(NextStepSchema).default([]),
  tags: z.array(z.string()).default([]),
  isRemote: z.boolean().default(true), // Remote by default
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;

// Session form input
export const SessionFormSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional()
    .or(z.literal("")),
  title: z.string().optional(),
  notes: z.string().optional(),
  nextSteps: z.array(NextStepSchema).default([]),
  tags: z.array(z.string()).default([]),
  isRemote: z.boolean().default(true), // Remote by default
});

export type SessionFormInput = z.infer<typeof SessionFormSchema>;

// Settings schema
export const SettingsSchema = z.object({
  lastSelectedMenteeId: z.string().uuid().nullable().default(null),
  showArchived: z.boolean().default(false),
  programName: z.string().default("Mi Programa"),
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
