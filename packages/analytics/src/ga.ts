/**
 * Track a Google Analytics event
 * Safely no-ops on server or if gtag is not present
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  // Only run on client side
  if (typeof window === "undefined") {
    return;
  }

  // Check if gtag is available
  const gtag = (window as Window & { gtag?: Gtag.Gtag }).gtag;
  if (typeof gtag !== "function") {
    return;
  }

  try {
    gtag("event", eventName, params);
  } catch {
    // Silently fail if tracking fails
  }
}

/**
 * Track a page view with app name
 * Call this on app mount to identify which app is being used
 */
export function trackAppView(appName: string): void {
  trackEvent("app_view", { app_name: appName });
}

// Type augmentation for gtag
declare global {
  namespace Gtag {
    interface Gtag {
      (
        command: "event",
        eventName: string,
        params?: Record<string, string | number | boolean>
      ): void;
    }
  }
}
