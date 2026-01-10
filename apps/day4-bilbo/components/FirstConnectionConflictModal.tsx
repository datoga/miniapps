"use client";

import { Modal } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import type { FirstConnectionConflict } from "@/lib/drive";

interface FirstConnectionConflictModalProps {
  conflict: FirstConnectionConflict;
  onKeepLocal: () => void;
  onKeepRemote: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function FirstConnectionConflictModal({
  conflict,
  onKeepLocal,
  onKeepRemote,
  onCancel,
  isLoading = false,
}: FirstConnectionConflictModalProps) {
  const t = useTranslations();

  const formatDate = (date: number | string) => {
    const d = typeof date === "number" ? new Date(date) : new Date(date);
    return d.toLocaleString();
  };

  return (
    <Modal
      isOpen
      onClose={onCancel}
      title={t("sync.conflict.title")}
      size="md"
    >
      <div className="space-y-5">
        <p className="text-gray-600 dark:text-gray-400">
          {t("sync.conflict.description")}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Local Data Card */}
          <div
            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
              isLoading
                ? "pointer-events-none opacity-50"
                : "border-blue-200 bg-blue-50 hover:border-blue-400 dark:border-blue-800 dark:bg-blue-950/50 dark:hover:border-blue-600"
            }`}
            onClick={onKeepLocal}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t("sync.conflict.local")}
              </h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t("sync.conflict.exercises")}:</span>
                <span className="font-medium text-gray-900 dark:text-white">{conflict.localInfo.exerciseCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t("sync.conflict.sessions")}:</span>
                <span className="font-medium text-gray-900 dark:text-white">{conflict.localInfo.sessionCount}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t("sync.conflict.lastModified")}:</span>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatDate(conflict.localInfo.lastModified)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-blue-100 px-3 py-2 text-center text-sm font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              {t("sync.conflict.keepLocal")}
            </div>
          </div>

          {/* Remote Data Card */}
          <div
            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
              isLoading
                ? "pointer-events-none opacity-50"
                : "border-green-200 bg-green-50 hover:border-green-400 dark:border-green-800 dark:bg-green-950/50 dark:hover:border-green-600"
            }`}
            onClick={onKeepRemote}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t("sync.conflict.remote")}
              </h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t("sync.conflict.exercises")}:</span>
                <span className="font-medium text-gray-900 dark:text-white">{conflict.remoteInfo.exerciseCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t("sync.conflict.sessions")}:</span>
                <span className="font-medium text-gray-900 dark:text-white">{conflict.remoteInfo.sessionCount}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t("sync.conflict.lastModified")}:</span>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatDate(conflict.remoteInfo.lastModified)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-green-100 px-3 py-2 text-center text-sm font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
              {t("sync.conflict.keepRemote")}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t("sync.conflict.syncing")}
          </div>
        )}

        <p className="text-center text-xs text-gray-500 dark:text-gray-500">
          {t("sync.conflict.warning")}
        </p>

        <div className="flex justify-center">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-sm text-gray-500 underline hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

