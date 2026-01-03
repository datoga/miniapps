"use client";

import { memo, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { QrItem } from "../lib/types";
import { QrThumbnail } from "./QrThumbnail";

interface QrCardProps {
  item: QrItem;
  onClick: () => void;
  onArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const QrCard = memo(function QrCard({
  item,
  onClick,
  onArchive,
  onDelete,
}: QrCardProps) {
  const t = useTranslations();
  const isArchived = !!item.archivedAt;

  const kindLabel = item.kind === "url" ? "URL" : item.kind === "text" ? t("card.text") : t("card.other");

  const handleArchive = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onArchive(e);
    },
    [onArchive]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(e);
    },
    [onDelete]
  );

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col h-full min-h-[200px] p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
        isArchived
          ? "bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 grayscale opacity-75 hover:opacity-100"
          : "bg-white dark:bg-gray-800/80 border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1"
      }`}
    >
      {/* Header Actions */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleArchive}
          className="p-2 rounded-xl bg-white dark:bg-gray-700 text-gray-400 hover:text-primary-500 shadow-sm transition-colors"
          title={isArchived ? t("actions.unarchive") : t("actions.archive")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {isArchived ? (
              // Unarchive icon
              <>
                <path d="M21 8V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
                <path d="M21 3H3" />
                <path d="M12 11v6M9 14l3-3 3 3" />
              </>
            ) : (
              // Archive icon
              <>
                <path d="M21 8V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
                <path d="M21 3H3" />
                <path d="M10 12h4" />
              </>
            )}
          </svg>
        </button>

        <button
          onClick={handleDelete}
          className="p-2 rounded-xl bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 shadow-sm transition-colors"
          title={t("actions.delete")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* QR Preview */}
      <div className="flex-1 flex items-center justify-center mb-4">
        <QrThumbnail
          data={item.data}
          options={item.options}
          size={80}
          className={isArchived ? "opacity-60" : ""}
        />
      </div>

      {/* Info */}
      <div className="space-y-2">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              item.kind === "url"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {kindLabel}
          </span>
          {isArchived && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {t("card.archived")}
            </span>
          )}
        </div>

        {/* Name */}
        <h3
          className={`font-semibold text-sm leading-tight line-clamp-2 ${
            isArchived ? "text-gray-500" : "text-gray-900 dark:text-white"
          }`}
        >
          {item.name}
        </h3>
      </div>
    </div>
  );
});

