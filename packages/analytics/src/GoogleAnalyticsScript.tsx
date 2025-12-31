"use client";

import { GoogleAnalytics } from "@next/third-parties/google";

interface GoogleAnalyticsScriptProps {
  gaId?: string;
}

/**
 * Conditionally renders Google Analytics script if gaId is provided
 */
export function GoogleAnalyticsScript({ gaId }: GoogleAnalyticsScriptProps) {
  if (!gaId) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}

