import { z } from "zod";

// ============ Participant Types ============

export const ParticipantType = z.enum(["individual", "pair"]);
export type ParticipantType = z.infer<typeof ParticipantType>;

// Team member schema
export const TeamMemberSchema = z.object({
  name: z.string().min(1),
});
export type TeamMember = z.infer<typeof TeamMemberSchema>;

// Participant schema
export const ParticipantSchema = z.object({
  id: z.string().uuid(),
  type: ParticipantType,
  name: z.string().min(1),
  members: z.array(TeamMemberSchema).optional(), // For pairs
  createdAt: z.number(), // ms timestamp
  updatedAt: z.number(), // ms timestamp
});
export type Participant = z.infer<typeof ParticipantSchema>;

// ============ Tournament Types ============

export const TournamentMode = z.enum(["single_elim", "double_elim", "ladder"]);
export type TournamentMode = z.infer<typeof TournamentMode>;

export const LadderType = z.enum(["points", "time"]);
export type LadderType = z.infer<typeof LadderType>;

export const TournamentStatus = z.enum(["draft", "active", "completed"]);
export type TournamentStatus = z.infer<typeof TournamentStatus>;

// Bracket structure for single elimination
export const BracketSchema = z.object({
  size: z.number().int().positive(), // Power of 2 (2, 4, 8, 16, etc.)
  matchesByRound: z.array(z.array(z.string())), // matchIds by round
});
export type Bracket = z.infer<typeof BracketSchema>;

// Bracket side for double elimination
export const BracketSide = z.enum(["winners", "losers", "grand_final", "grand_final_reset"]);
export type BracketSide = z.infer<typeof BracketSide>;

// Double Elimination bracket structure
export const DoubleBracketSchema = z.object({
  size: z.number().int().positive(), // Power of 2 based on participant count
  winnersBracket: z.array(z.array(z.string())), // matchIds by round in winners
  losersBracket: z.array(z.array(z.string())), // matchIds by round in losers
  grandFinalMatchId: z.string().optional(), // Grand final match
  grandFinalResetMatchId: z.string().optional(), // Reset match if losers winner wins GF
  isReset: z.boolean().default(false), // Whether bracket reset occurred
});
export type DoubleBracket = z.infer<typeof DoubleBracketSchema>;

// Now playing state
export const NowPlayingSchema = z.object({
  currentMatchId: z.string().optional(),
});
export type NowPlaying = z.infer<typeof NowPlayingSchema>;

// Tournament settings
export const TournamentSettingsSchema = z.object({
  ladderType: LadderType.optional(), // For ladder mode: "points" or "time"
});
export type TournamentSettings = z.infer<typeof TournamentSettingsSchema>;

// Game configuration
export const GameConfigSchema = z.object({
  gameKey: z.string(), // Key from preset catalog or "custom"
  customEmoji: z.string().optional(), // Custom emoji if gameKey is "custom" or override
  customName: z.string().optional(), // Custom name if gameKey is "custom"
});
export type GameConfig = z.infer<typeof GameConfigSchema>;

// Tournament schema
export const TournamentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  mode: TournamentMode,
  participantType: ParticipantType,
  status: TournamentStatus,
  participantIds: z.array(z.string()), // References to Participant.id
  settings: TournamentSettingsSchema,
  nowPlaying: NowPlayingSchema,
  game: GameConfigSchema.optional(), // Game/activity for this tournament
  ladderOrder: z.array(z.string()).optional(), // Manual tiebreaker order for ladder
  bracket: BracketSchema.optional(), // For single elimination
  doubleBracket: DoubleBracketSchema.optional(), // For double elimination
  archived: z.boolean().optional(), // Soft delete / archive
  startDate: z.string().optional(), // ISO date string (YYYY-MM-DD)
  endDate: z.string().optional(), // ISO date string (YYYY-MM-DD), only if different from startDate
  createdAt: z.number(), // ms timestamp
  updatedAt: z.number(), // ms timestamp
});
export type Tournament = z.infer<typeof TournamentSchema>;

// ============ Match Types ============

export const MatchStatus = z.enum(["pending", "completed"]);
export type MatchStatus = z.infer<typeof MatchStatus>;

// Match schema
export const MatchSchema = z.object({
  id: z.string().uuid(),
  tournamentId: z.string().uuid(),
  round: z.number().int().nonnegative().optional(), // Round number within bracket side
  slot: z.number().int().nonnegative().optional(), // Position in round (0-based)
  bracketSide: BracketSide.optional(), // For double elimination: winners/losers/grand_final
  aId: z.string().nullable(), // Participant A (null = BYE or TBD)
  bId: z.string().nullable(), // Participant B (null = BYE or TBD)
  scoreA: z.number().int().nonnegative(),
  scoreB: z.number().int().nonnegative(),
  winnerId: z.string().nullable(), // Winner participant ID
  loserId: z.string().nullable(), // Loser participant ID (for double elim)
  status: MatchStatus,
  playedAt: z.number().optional(), // ms timestamp when match was completed
  createdAt: z.number(), // ms timestamp
  updatedAt: z.number(), // ms timestamp
});
export type Match = z.infer<typeof MatchSchema>;

// ============ Meta (Singleton) ============

export const MetaSchema = z.object({
  id: z.literal("meta"),
  firstValueFired: z.boolean().default(false),
});
export type Meta = z.infer<typeof MetaSchema>;

export const defaultMeta: Meta = {
  id: "meta",
  firstValueFired: false,
};

// ============ Form Schemas ============

export const CreateTournamentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mode: TournamentMode,
  participantType: ParticipantType,
});
export type CreateTournamentFormInput = z.infer<typeof CreateTournamentFormSchema>;

export const AddParticipantFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  members: z.array(z.object({ name: z.string().min(1) })).optional(),
});
export type AddParticipantFormInput = z.infer<typeof AddParticipantFormSchema>;

export const ReportMatchFormSchema = z.object({
  scoreA: z.number().int().nonnegative(),
  scoreB: z.number().int().nonnegative(),
}).refine((data) => data.scoreA !== data.scoreB, {
  message: "Draws are not allowed",
});
export type ReportMatchFormInput = z.infer<typeof ReportMatchFormSchema>;

// ============ Workspace Snapshot (for storage) ============

export const WorkspaceSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  appId: z.literal("gamemaster"),
  updatedAt: z.number(),
  tournaments: z.array(TournamentSchema),
  participants: z.array(ParticipantSchema),
  matches: z.array(MatchSchema),
});
export type WorkspaceSnapshot = z.infer<typeof WorkspaceSnapshotSchema>;
