"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useRef, useState } from "react";

export type DownloadFormat = "png" | "svg" | "jpg" | "webp";

interface DownloadDropdownProps {
  onDownload: (format: DownloadFormat) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  direction?: "up" | "down";
  variant?: "default" | "fullscreen";
  showLabel?: boolean;
}

const FORMATS: { key: DownloadFormat; label: string }[] = [
  { key: "png", label: "PNG" },
  { key: "jpg", label: "JPG" },
  { key: "svg", label: "SVG" },
  { key: "webp", label: "WebP" },
];

export const DownloadDropdown = memo(function DownloadDropdown({
  onDownload,
  disabled = false,
  size = "md",
  direction = "down",
  variant = "default",
  showLabel = false,
}: DownloadDropdownProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = useCallback(
    (format: DownloadFormat) => {
      onDownload(format);
      setIsOpen(false);
    },
    [onDownload]
  );

  // Button styles based on variant
  const getButtonClass = () => {
    if (variant === "fullscreen") {
      return "flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50";
    }
    return size === "sm"
      ? "p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      : "p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50";
  };

  // Dropdown styles based on variant
  const getDropdownClass = () => {
    const positionClass = direction === "up" ? "bottom-full mb-2" : "top-full mt-2";
    if (variant === "fullscreen") {
      return `absolute left-1/2 -translate-x-1/2 bg-gray-900 rounded-xl shadow-lg border border-gray-700 py-1 z-[60] ${positionClass}`;
    }
    return `absolute right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[60] ${positionClass}`;
  };

  // Item styles based on variant
  const getItemClass = () => {
    if (variant === "fullscreen") {
      return "w-full px-4 py-2 text-left text-sm font-medium text-gray-200 hover:bg-gray-800 whitespace-nowrap";
    }
    return "w-full px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap";
  };

  const iconSize = variant === "fullscreen" ? 20 : 18;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={getButtonClass()}
        title={t("actions.download")}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {showLabel && <span>{t("actions.download")}</span>}
      </button>

      {isOpen && (
        <div className={getDropdownClass()}>
          {FORMATS.map(({ key, label }) => (
            <button key={key} onClick={() => handleSelect(key)} className={getItemClass()}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
