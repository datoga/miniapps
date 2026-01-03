"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback } from "react";
import type { QrItem } from "../lib/types";
import { QrThumbnail } from "./QrThumbnail";

interface QrCardProps {
  item: QrItem;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

// Truncate text with ellipsis
function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

// Format URL for display (include protocol, remove trailing slash if just domain)
function formatUrlForDisplay(url: string): string {
  try {
    const parsed = new URL(url);
    // Build display: protocol + hostname + pathname (remove trailing slash if just "/")
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    const display = `${parsed.protocol}//${parsed.hostname}${path}`;
    return display.length > 45 ? `${display.slice(0, 45)}...` : display;
  } catch {
    return url.slice(0, 45) + (url.length > 45 ? "..." : "");
  }
}

// Helper function to get kind label
function getKindLabel(kind: string, t: ReturnType<typeof useTranslations>): string {
  if (kind === "url") {
    return "URL";
  }
  if (kind === "text") {
    return t("card.text");
  }
  return t("card.other");
}

export const QrCard = memo(function QrCard({ item, onClick, onDelete }: QrCardProps) {
  const t = useTranslations();

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(e);
    },
    [onDelete]
  );

  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col h-full min-h-[220px] p-5 rounded-2xl border transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800/80 border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-1"
    >
      {/* Delete button - visible on mobile, hover on desktop */}
      <div className="absolute top-3 right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={handleDelete}
          className="p-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-red-500 hover:border-red-300 shadow-sm transition-all"
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

      {/* Header: Name + Date */}
      <div className="mb-2 pr-12">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-gray-900 dark:text-white">
          {item.name}
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>
            {new Date(item.createdAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* QR Preview */}
      <div className="flex-1 flex items-center justify-center py-2">
        <QrThumbnail data={item.data} options={item.options} size={100} />
      </div>

      {/* Footer: Type badge + Content */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700/50 space-y-1.5">
        {/* Type badge */}
        <span
          className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${
            item.kind === "url"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          {getKindLabel(item.kind, t)}
        </span>

        {/* Content preview */}
        {item.kind === "url" ? (
          <a
            href={item.data}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline truncate block"
          >
            {formatUrlForDisplay(item.data)}
          </a>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {truncateText(item.data, 40)}
          </p>
        )}
      </div>
    </div>
  );
});
