"use client";

import { Modal } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { memo } from "react";

interface AddModeModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCreate: () => void;
  onSelectScan: () => void;
  onSelectImport: () => void;
}

export const AddModeModal = memo(function AddModeModal({
  open,
  onClose,
  onSelectCreate,
  onSelectScan,
  onSelectImport,
}: AddModeModalProps) {
  const t = useTranslations();

  return (
    <Modal open={open} onClose={onClose} title={t("addMode.title")}>
      <div className="grid grid-cols-3 gap-3">
        {/* Create option */}
        <button
          onClick={onSelectCreate}
          className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary-600 dark:text-primary-400"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">
            {t("addMode.create")}
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight">
            {t("addMode.createDesc")}
          </p>
        </button>

        {/* Scan option */}
        <button
          onClick={onSelectScan}
          className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg
              width="24"
              height="24"
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
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">
            {t("addMode.scan")}
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight">
            {t("addMode.scanDesc")}
          </p>
        </button>

        {/* Import option */}
        <button
          onClick={onSelectImport}
          className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-amber-600 dark:text-amber-400"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">
            {t("addMode.import")}
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight">
            {t("addMode.importDesc")}
          </p>
        </button>
      </div>
    </Modal>
  );
});

