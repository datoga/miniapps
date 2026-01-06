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

// ============ Business Events ============

/**
 * Track when recording starts
 * @param audioEnabled - Whether microphone is enabled
 * @param format - Format category (webm or mp4)
 */
export function trackRecordingStarted(audioEnabled: boolean, format: "webm" | "mp4") {
  trackEvent("recording_started", {
    mode: "webcam",
    audio_enabled: audioEnabled,
    format_selected: format,
  });
}

/**
 * Track when recording completes successfully
 * @param audioEnabled - Whether microphone was enabled
 * @param format - Format category (webm or mp4)
 */
export function trackRecordingCompleted(audioEnabled: boolean, format: "webm" | "mp4") {
  trackEvent("recording_completed", {
    mode: "webcam",
    audio_enabled: audioEnabled,
    format_selected: format,
  });
}

// First value flag key
const FIRST_VALUE_KEY = "recordme_first_value_sent";

/**
 * Track first value event (user has completed their first recording)
 * Only fires once ever per device
 */
export function trackFirstValue() {
  if (typeof window === "undefined") {return;}

  const alreadySent = localStorage.getItem(FIRST_VALUE_KEY);
  if (alreadySent) {return;}

  trackEvent("first_value");
  localStorage.setItem(FIRST_VALUE_KEY, "1");
}

// ============ Recording Control Events ============

/**
 * Track when recording is paused
 */
export function trackRecordingPaused() {
  trackEvent("recording_paused");
}

/**
 * Track when recording is resumed
 */
export function trackRecordingResumed() {
  trackEvent("recording_resumed");
}

// ============ Share Events ============

/**
 * Track when user attempts to share
 */
export function trackShareAttempted() {
  trackEvent("share_attempted");
}

/**
 * Track when share completes successfully
 */
export function trackShareCompleted() {
  trackEvent("share_completed");
}

/**
 * Track when share fails
 */
export function trackShareFailed() {
  trackEvent("share_failed");
}

// ============ Settings Events ============

/**
 * Track settings changes
 */
export function trackSettingsChanged(setting: string) {
  trackEvent("settings_changed", { setting });
}

