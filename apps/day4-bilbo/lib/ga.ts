import { trackEvent as baseTrackEvent } from "@miniapps/analytics";

// Debug mode - logs events to console in development
const DEBUG_GA = process.env.NODE_ENV === "development";

function logEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (DEBUG_GA) {
    console.log(`[GA] ${name}`, params || {});
  }
}

/**
 * Track a GA event with optional debug logging
 */
function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  logEvent(name, params);
  baseTrackEvent(name, params);
}

// ============ Navigation Events ============

export function trackNavClick(destination: string, location: string) {
  trackEvent("nav_click", {
    destination,
    location,
  });
}

// ============ Business Events ============

/**
 * Track when a workout session is logged
 * DO NOT include notes content
 */
export function trackWorkoutLogged(
  exerciseId: string,
  cycleIndex: number,
  phase: "bilbo" | "strength",
  loadKg: number,
  reps: number
) {
  trackEvent("workout_logged", {
    exercise_id: exerciseId,
    cycle_index: cycleIndex,
    phase,
    load_kg: Math.round(loadKg * 100) / 100, // Round to 2 decimals
    reps,
  });
}

/**
 * Track when a new estimated 1RM is achieved (surpasses previous best)
 * Note: This is an ESTIMATED 1RM using Epley formula, not an actual PR
 */
export function trackPRRecorded(
  exerciseId: string,
  cycleIndex: number,
  previous1RMKg: number,
  new1RMKg: number
) {
  trackEvent("pr_recorded", {
    exercise_id: exerciseId,
    cycle_index: cycleIndex,
    previous_1rm_kg: Math.round(previous1RMKg * 100) / 100,
    new_1rm_kg: Math.round(new1RMKg * 100) / 100,
  });
}

/**
 * Track when a cycle is finished
 */
export function trackCycleFinished(exerciseId: string, cycleIndex: number, sessionCount: number) {
  trackEvent("cycle_finished", {
    exercise_id: exerciseId,
    cycle_index: cycleIndex,
    session_count: sessionCount,
  });
}

/**
 * Track when a new cycle is started
 */
export function trackCycleStarted(exerciseId: string, cycleIndex: number, base1RMKg: number) {
  trackEvent("cycle_started", {
    exercise_id: exerciseId,
    cycle_index: cycleIndex,
    base_1rm_kg: Math.round(base1RMKg * 100) / 100,
  });
}

/**
 * Track settings changes
 */
export function trackSettingsChanged(
  setting: "units" | "increment" | "round_step" | "language" | "sync" | "clear_all_data"
) {
  trackEvent("settings_changed", {
    setting,
  });
}

/**
 * Track session updates (edits)
 */
export function trackSessionUpdated(exerciseId: string) {
  trackEvent("session_updated", {
    exercise_id: exerciseId,
  });
}

/**
 * Track outbound link clicks
 */
export function trackOutboundClick(linkUrl: string, linkLocation: string) {
  trackEvent("outbound_click", {
    link_url: linkUrl,
    link_location: linkLocation,
  });
}

/**
 * Track exercise creation
 */
export function trackExerciseCreated(presetType: string) {
  trackEvent("exercise_created", {
    preset_type: presetType,
  });
}

/**
 * Track wizard completion
 */
export function trackWizardCompleted() {
  trackEvent("wizard_completed");
}

