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

// ============ Business Events (ONLY 3 events as required) ============

/**
 * Track when a tournament is created
 */
export function trackTournamentCreated(mode: "single_elim" | "double_elim" | "ladder", participantType: "individual" | "pair") {
  trackEvent("tournament_created", {
    mode,
    participant_type: participantType,
  });
}

/**
 * Track when a match result is reported
 */
export function trackMatchReported(mode: "single_elim" | "double_elim" | "ladder", tournamentId: string, round?: number) {
  trackEvent("match_reported", {
    mode,
    tournament_id: tournamentId,
    ...(round !== undefined && { round }),
  });
}

/**
 * Track first value event (user has meaningful data)
 * This should only fire once ever
 */
export function trackFirstValue() {
  trackEvent("first_value");
}

// ============ Navigation Events (like Day4) ============

/**
 * Track navigation clicks
 */
export function trackNavClick(destination: string, source: string) {
  trackEvent("nav_click", { destination, source });
}

