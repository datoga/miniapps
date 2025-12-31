"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { cn } from "./utils";

interface NavItem {
  href: string;
  labelKey: string;
}

interface HeaderProps {
  title?: string;
  navItems?: NavItem[];
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { href: "#features", labelKey: "nav.features" },
  { href: "#demo", labelKey: "nav.demo" },
  { href: "#about", labelKey: "nav.about" },
];

export const Header = memo(function Header({
  title,
  navItems = defaultNavItems,
  className,
}: HeaderProps) {
  const t = useTranslations();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo / Title */}
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title ?? t("common.appTitle")}
        </h1>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
});
