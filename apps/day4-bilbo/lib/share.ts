import type { UnitsUI } from "./schemas";
import { format2, fromKg, estimate1RM } from "./math";

export interface SessionShareData {
  exerciseName: string;
  loadKg: number;
  reps: number;
  workKg: number;
  cycleIndex: number;
  sessionNumber: number;
  unitsUI: UnitsUI;
  phase: "bilbo" | "strength";
}

export interface CycleShareData {
  exerciseName: string;
  cycleIndex: number;
  sessionCount: number;
  startDate: string;
  endDate: string;
  initial1RMKg: number;
  final1RMKg: number;
  totalWorkKg: number;
  unitsUI: UnitsUI;
}

/**
 * Format session data for sharing
 */
export function formatSessionShare(data: SessionShareData, t: (key: string) => string): string {
  const load = format2(fromKg(data.loadKg, data.unitsUI));
  const work = format2(fromKg(data.workKg, data.unitsUI));
  const estimated1RM = format2(fromKg(estimate1RM(data.loadKg, data.reps), data.unitsUI));
  const phaseLabel = data.phase === "bilbo" ? "Bilbo" : t("session.phaseStrength");

  const lines = [
    `🏋️ ${data.exerciseName}`,
    ``,
    `📊 ${t("share.session.result")}:`,
    `• ${t("charts.loadUsed")}: ${load} ${data.unitsUI}`,
    `• ${t("charts.reps")}: ${data.reps}`,
    `• ${t("charts.work")}: ${work} ${data.unitsUI}`,
    `• ${t("charts.estimated1RM")}: ${estimated1RM} ${data.unitsUI}`,
    ``,
    `🔄 ${t("home.cycle")} ${data.cycleIndex} · ${t("share.session.number")} ${data.sessionNumber}`,
    `📍 ${t("session.phase")}: ${phaseLabel}`,
    ``,
    `#BilboTracker #Fuerza #Entrenamiento`,
  ];

  return lines.join("\n");
}

/**
 * Format cycle data for sharing
 */
export function formatCycleShare(data: CycleShareData, t: (key: string) => string): string {
  const initial1RM = format2(fromKg(data.initial1RMKg, data.unitsUI));
  const final1RM = format2(fromKg(data.final1RMKg, data.unitsUI));
  const totalWork = format2(fromKg(data.totalWorkKg, data.unitsUI));
  const improvement = data.final1RMKg > data.initial1RMKg
    ? `+${format2(fromKg(data.final1RMKg - data.initial1RMKg, data.unitsUI))} ${data.unitsUI} 📈`
    : "";

  const lines = [
    `🏆 ${t("share.cycle.completed")}!`,
    ``,
    `🏋️ ${data.exerciseName} - ${t("home.cycle")} ${data.cycleIndex}`,
    ``,
    `📊 ${t("share.cycle.stats")}:`,
    `• ${t("share.cycle.sessions")}: ${data.sessionCount}`,
    `• ${t("share.cycle.duration")}: ${data.startDate} → ${data.endDate}`,
    `• ${t("share.cycle.initial1RM")}: ${initial1RM} ${data.unitsUI}`,
    `• ${t("share.cycle.final1RM")}: ${final1RM} ${data.unitsUI} ${improvement}`,
    `• ${t("share.cycle.totalWork")}: ${totalWork} ${data.unitsUI}`,
    ``,
    `#BilboTracker #Fuerza #CicloCompletado`,
  ];

  return lines.join("\n");
}

/**
 * Share content using Web Share API or fallback to clipboard
 */
export async function shareContent(
  text: string,
  title: string
): Promise<{ success: boolean; method: "share" | "clipboard" | "none" }> {
  // Try Web Share API first (mobile-friendly)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return { success: true, method: "share" };
    } catch (error) {
      // User cancelled or error - try clipboard
      if ((error as Error).name === "AbortError") {
        return { success: false, method: "none" };
      }
    }
  }

  // Fallback to clipboard
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: "clipboard" };
    } catch {
      return { success: false, method: "none" };
    }
  }

  return { success: false, method: "none" };
}

