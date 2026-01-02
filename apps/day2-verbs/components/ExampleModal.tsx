"use client";

import { memo, useCallback, useEffect } from "react";
import { useSpeech } from "../lib/useSpeech";
import type { ExampleResult } from "../lib/useDictionaryExample";

interface ExampleModalProps {
  open: boolean;
  onClose: () => void;
  word: string;
  loading: boolean;
  error: string | null;
  result: ExampleResult | null;
  onRefresh: () => void;
}

export const ExampleModal = memo(function ExampleModal({
  open,
  onClose,
  word,
  loading,
  error,
  result,
  onRefresh,
}: ExampleModalProps) {
  const { speak } = useSpeech();

  // Close on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) {
    return null;
  }

  const handleSpeak = () => {
    if (result?.example && !result.example.startsWith("No verb")) {
      speak(result.example);
    }
  };

  const hasValidExample = result?.example && !result.example.startsWith("No verb");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-indigo-600 dark:text-indigo-400">
            {word}
          </h2>
          <p className="text-xs font-medium text-slate-400 uppercase">
            Example Sentence
          </p>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              ❌ {error}
            </p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            {/* Example sentence */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:from-indigo-900/20 dark:to-purple-900/20">
              <p className="text-lg font-medium italic text-slate-700 dark:text-slate-200">
                &quot;{result.example}&quot;
              </p>
            </div>

            {/* Definition */}
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/50">
              <p className="text-xs font-bold uppercase text-slate-400 mb-1">
                Definition
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {result.definition}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {/* Listen button */}
              {hasValidExample && (
                <button
                  onClick={handleSpeak}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white transition-all hover:bg-indigo-700"
                >
                  <span>🔊</span> Listen
                </button>
              )}

              {/* Another example button */}
              <button
                onClick={onRefresh}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-bold text-white transition-all hover:bg-amber-600"
              >
                <span>🔄</span> Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
