"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
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
        "border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <a
            href="https://datoga.es/contacto"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t("contact")}
          </a>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("copyright", { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
});
