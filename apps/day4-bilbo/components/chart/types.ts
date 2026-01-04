import type { Session, Cycle, UnitsUI } from "@/lib/schemas";

export interface CycleColor {
  main: string;
  reps: string;
  gradient: string;
}

export interface SessionDataPoint {
  sessionNumber: number;
  cycleId: string;
  cycleIndex: number;
  date: string;
  datetime: string;
  loadUsed: number;
  reps: number;
  work: number;
  estimated1RM: number;
  phase: string;
  notes?: string;
  timeSeconds?: number;
}

export interface ExerciseChartProps {
  sessions: Session[];
  cycles: Cycle[];
  unitsUI: UnitsUI;
}

export type ShowSeries = "both" | "load" | "reps";
export type ShowSeriesWork = "both" | "work" | "reps";
export type ChartType = "load" | "work";

