import { z } from "zod";

// Exercise preset types
export const PresetType = z.enum(["bench", "squat", "deadlift", "row", "ohp", "custom"]);
export type PresetType = z.infer<typeof PresetType>;

// Rest period history entry
export const RestPeriodSchema = z.object({
  id: z.string().uuid().optional(), // Unique identifier (may be missing in old data)
  startDate: z.string(), // ISO date string (YYYY-MM-DD)
  endDate: z.string().optional(), // ISO date string when rest ended
  actualEndDate: z.string(), // ISO date string when rest was actually ended
});
export type RestPeriod = z.infer<typeof RestPeriodSchema>;

// Exercise schema
export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  presetType: PresetType,
  iconPresetKey: z.string(), // For preset SVG icon
  emoji: z.string().optional(), // Optional emoji override
  createdAt: z.number(), // ms timestamp
  updatedAt: z.number(), // ms timestamp
  // Rest period tracking (current)
  isResting: z.boolean().optional(), // true when in rest period
  restStartDate: z.string().optional(), // ISO date string (YYYY-MM-DD)
  restEndDate: z.string().optional(), // ISO date string (YYYY-MM-DD), optional planned end
  // Rest period history (completed)
  restHistory: z.array(RestPeriodSchema).optional(),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

// Cycle schema
export const CycleSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  index: z.number().int().positive(), // 1..n
  base1RMKg: z.number().positive(), // Fixed during cycle
  improved1RMKg: z.number().positive().optional(), // Only when surpassed within the cycle
  startedAt: z.number(), // ms timestamp
  endedAt: z.number().optional(), // ms timestamp when finished
  isActive: z.boolean(),
});
export type Cycle = z.infer<typeof CycleSchema>;

// Session phase
export const SessionPhase = z.enum(["bilbo", "strength"]);
export type SessionPhase = z.infer<typeof SessionPhase>;

// Session schema
export const SessionSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  cycleId: z.string().uuid(),
  phase: SessionPhase,
  datetime: z.string(), // ISO datetime - time optional (if no time, store date at 00:00 local)
  suggestedLoadKg: z.number().nonnegative(),
  loadUsedKg: z.number().positive(),
  reps: z.number().int().positive(),
  timeSeconds: z.number().int().positive().optional(),
  notes: z.string().optional(),
  workKg: z.number().nonnegative(), // loadUsedKg * reps
  updatedAt: z.number(), // ms timestamp
});
export type Session = z.infer<typeof SessionSchema>;

// Drive sync state
export const DriveSyncState = z.enum(["signed_out", "signed_in", "syncing", "synced", "error"]);
export type DriveSyncState = z.infer<typeof DriveSyncState>;

// Units for UI display
export const UnitsUI = z.enum(["kg", "lb"]);
export type UnitsUI = z.infer<typeof UnitsUI>;

// Drive profile
export const DriveProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  pictureUrl: z.string().optional(),
});
export type DriveProfile = z.infer<typeof DriveProfileSchema>;

// User settings schema
export const UserSettingsSchema = z.object({
  unitsUI: UnitsUI.default("kg"),
  globalIncrementKg: z.number().positive().default(2.5), // Applies to ALL exercises
  roundStepKg: z.number().positive().default(2.5),
  language: z.enum(["es", "en"]).default("es"),
  driveSyncEnabled: z.boolean().default(false),
  driveSyncState: DriveSyncState.default("signed_out"),
  driveProfile: DriveProfileSchema.optional(),
  lastSyncedAt: z.number().optional(), // ms timestamp
  wizardCompleted: z.boolean().default(false), // Track if first-run wizard is done
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

// Default settings
export const defaultSettings: UserSettings = {
  unitsUI: "kg",
  globalIncrementKg: 2.5,
  roundStepKg: 2.5,
  language: "es",
  driveSyncEnabled: false,
  driveSyncState: "signed_out",
  wizardCompleted: false,
};

// Backup schema for Drive sync
export const BackupSchema = z.object({
  schemaVersion: z.literal(1),
  appId: z.literal("bilbotracker"),
  exportedAt: z.string().datetime(),
  data: z.object({
    settings: UserSettingsSchema.partial().omit({
      driveSyncState: true,
      driveProfile: true,
      lastSyncedAt: true,
    }),
    exercises: z.array(ExerciseSchema),
    cycles: z.array(CycleSchema),
    sessions: z.array(SessionSchema),
  }),
});
export type Backup = z.infer<typeof BackupSchema>;

// Form schemas for validation
export const ExerciseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  presetType: PresetType,
  iconPresetKey: z.string(),
  emoji: z.string().optional(),
});
export type ExerciseFormInput = z.infer<typeof ExerciseFormSchema>;

export const SessionFormSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format").optional().or(z.literal("")),
  loadUsedKg: z.number().positive("Load must be positive"),
  reps: z.number().int().positive("Reps must be at least 1"),
  timeSeconds: z.number().int().positive().optional(),
  notes: z.string().optional(),
  phase: SessionPhase,
});
export type SessionFormInput = z.infer<typeof SessionFormSchema>;

export const CycleFormSchema = z.object({
  base1RMKg: z.number().positive("1RM must be positive"),
});
export type CycleFormInput = z.infer<typeof CycleFormSchema>;

