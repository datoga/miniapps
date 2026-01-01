"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import { cn } from "./utils";

interface FooterProps {
  className?: string;
}

export const Footer = memo(function Footer({ className }: FooterProps) {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-gray-100 bg-gray-50/50 dark:border-gray-800/50 dark:bg-gray-900/50",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-6 py-5 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <a
            href="https://datoga.es/contacto"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
          >
            {t("contact")}
          </a>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t("copyright", { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
});
