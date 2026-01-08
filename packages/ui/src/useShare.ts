"use client";

import { useCallback, useMemo } from "react";

export interface ShareOptions {
  /** Title for native share dialog */
  title?: string;
  /** Text content to share */
  text: string;
  /** URL to share (optional, will be appended to text if not using native share) */
  url?: string;
  /** Callback when share is successful */
  onSuccess?: (method: "native" | "clipboard") => void;
  /** Callback when share fails or is cancelled */
  onError?: (error: unknown) => void;
  /** Custom message to show when copied to clipboard (default: "Copied to clipboard!") */
  clipboardMessage?: string;
}

export interface UseShareResult {
  /** Whether native share is available */
  canShare: boolean;
  /** Trigger the share action */
  share: () => Promise<void>;
  /** The share method that will be used */
  method: "native" | "clipboard";
}

/**
 * Hook for sharing content using native share API or clipboard fallback
 *
 * @example
 * ```tsx
 * const { share, canShare } = useShare({
 *   text: "Check out my results!",
 *   url: "https://myapp.com",
 *   onSuccess: (method) => trackEvent("share", { method }),
 * });
 *
 * return <button onClick={share}>Share</button>;
 * ```
 */
export function useShare(options: ShareOptions): UseShareResult {
  const canShare = useMemo(() => {
    return typeof navigator !== "undefined" && "share" in navigator;
  }, []);

  const method = canShare ? "native" : "clipboard";

  const share = useCallback(async () => {
    const { title, text, url, onSuccess, onError, clipboardMessage = "Copied to clipboard!" } = options;

    if (canShare) {
      try {
        await navigator.share({
          title,
          text: url ? `${text}\n\n${url}` : text,
        });
        onSuccess?.("native");
      } catch (error) {
        // User cancelled or error - don't treat cancel as error
        if (error instanceof Error && error.name !== "AbortError") {
          onError?.(error);
        }
      }
    } else {
      try {
        const fullText = url ? `${text}\n\n${url}` : text;
        await navigator.clipboard.writeText(fullText);
        window.alert(clipboardMessage);
        onSuccess?.("clipboard");
      } catch (error) {
        onError?.(error);
      }
    }
  }, [options, canShare]);

  return { canShare, share, method };
}

/**
 * Helper to build share text from parts
 *
 * @example
 * ```ts
 * const text = buildShareText([
 *   "My Results 🏆",
 *   "",
 *   "✅ Score: 8/10",
 *   "⏱️ Time: 2:30",
 * ]);
 * ```
 */
export function buildShareText(lines: (string | null | undefined | false)[]): string {
  return lines.filter((line): line is string => typeof line === "string").join("\n");
}

