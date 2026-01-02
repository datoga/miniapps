"use client";

import { memo } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = memo(function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) { return null; }

  const confirmStyles = variant === "danger"
    ? "bg-rose-500 hover:bg-rose-600 active:bg-rose-700"
    : "bg-amber-500 hover:bg-amber-600 active:bg-amber-700";

  const iconStyles = variant === "danger"
    ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
    : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm animate-bounce-in overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${iconStyles}`}>
            {variant === "danger" ? (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-2 text-lg font-bold text-slate-800 dark:text-white">
            {title}
          </h3>

          {/* Message */}
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${confirmStyles}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

