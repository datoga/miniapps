"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "./Modal";

interface AddModeModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCreate: () => void;
  onSelectRead: () => void;
}

export const AddModeModal = memo(function AddModeModal({
  open,
  onClose,
  onSelectCreate,
  onSelectRead,
}: AddModeModalProps) {
  const t = useTranslations();

  return (
    <Modal open={open} onClose={onClose} title={t("addMode.title")}>
      <div className="grid grid-cols-2 gap-4">
        {/* Create option */}
        <button
          onClick={onSelectCreate}
          className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all group"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary-600 dark:text-primary-400"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">
            {t("addMode.create")}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t("addMode.createDesc")}
          </p>
        </button>

        {/* Read/Scan option */}
        <button
          onClick={onSelectRead}
          className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all group"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-emerald-600 dark:text-emerald-400"
            >
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">
            {t("addMode.read")}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t("addMode.readDesc")}
          </p>
        </button>
      </div>
    </Modal>
  );
});

