import type { Viewport } from "next";

export interface ViewportConfig {
  /** Theme color for light mode (default: "#ffffff") */
  lightThemeColor?: string;
  /** Theme color for dark mode (default: "#0a0a0a") */
  darkThemeColor?: string;
  /** Initial scale (default: 1) */
  initialScale?: number;
  /** Maximum scale (default: 5) */
  maximumScale?: number;
  /** User scalable (default: true) */
  userScalable?: boolean;
}

/**
 * Generates viewport configuration for Next.js apps.
 * Includes theme color support for light/dark modes.
 */
export function generateViewport(config: ViewportConfig = {}): Viewport {
  const {
    lightThemeColor = "#ffffff",
    darkThemeColor = "#0a0a0a",
    initialScale = 1,
    maximumScale = 5,
    userScalable = true,
  } = config;

  return {
    width: "device-width",
    initialScale,
    maximumScale,
    userScalable,
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: lightThemeColor },
      { media: "(prefers-color-scheme: dark)", color: darkThemeColor },
    ],
  };
}

