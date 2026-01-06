"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useState } from "react";
import { VideoPlayer } from "./VideoPreview";
import type { RecordingResult } from "@/lib/useRecorder";
import { trackShareAttempted, trackShareCompleted, trackShareFailed } from "@/lib/ga";

interface FinishedViewProps {
  result: RecordingResult;
  resultUrl: string;
  resultFile: File | null;
  onRecordAgain: () => void;
}

export const FinishedView = memo(function FinishedView({
  result,
  resultUrl,
  resultFile,
  onRecordAgain,
}: FinishedViewProps) {
  const t = useTranslations();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const handleShare = useCallback(async () => {
    if (!resultFile) {return;}

    trackShareAttempted();

    const appUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareText = `${t("share.text")} ${appUrl}`;

    try {
      await navigator.share({
        files: [resultFile],
        text: shareText,
        url: appUrl,
      });
      trackShareCompleted();
    } catch (error) {
      // User cancelled or share failed
      if (error instanceof Error && error.name !== "AbortError") {
        showToast(t("share.failed"));
        trackShareFailed();
      }
    }
  }, [resultFile, t, showToast]);

  return (
    <div className="flex flex-col">
      {/* Video Player */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-black/10">
        <VideoPlayer src={resultUrl} />
      </div>

      {/* Saved Location */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
          <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            {result.folderName}
          </p>
          <p className="truncate text-sm text-green-600 dark:text-green-400">
            {result.filename}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:shadow-xl hover:shadow-red-500/30 active:scale-[0.98]"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
          </svg>
          {t("actions.share")}
        </button>

        <button
          onClick={onRecordAgain}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t("actions.recordAgain")}
        </button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-bounce rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl dark:bg-white dark:text-gray-900">
          {toastMessage}
        </div>
      )}
    </div>
  );
});

