import type { CycleColor } from "./types";

// Modern vibrant color palette with gradients
export const CYCLE_COLORS: CycleColor[] = [
  { main: "#ef4444", reps: "#fbbf24", gradient: "url(#gradient-0)" }, // red load, amber reps
  { main: "#3b82f6", reps: "#f97316", gradient: "url(#gradient-1)" }, // blue load, orange reps
  { main: "#10b981", reps: "#a855f7", gradient: "url(#gradient-2)" }, // emerald load, purple reps
  { main: "#8b5cf6", reps: "#22c55e", gradient: "url(#gradient-3)" }, // violet load, green reps
  { main: "#f59e0b", reps: "#06b6d4", gradient: "url(#gradient-4)" }, // amber load, cyan reps
  { main: "#06b6d4", reps: "#ec4899", gradient: "url(#gradient-5)" }, // cyan load, pink reps
  { main: "#ec4899", reps: "#84cc16", gradient: "url(#gradient-6)" }, // pink load, lime reps
  { main: "#84cc16", reps: "#ef4444", gradient: "url(#gradient-7)" }, // lime load, red reps
];

// Get color for cycle index (always returns a valid color)
export function getCycleColor(idx: number): CycleColor {
  return CYCLE_COLORS[idx % CYCLE_COLORS.length]!;
}

