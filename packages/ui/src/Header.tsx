"use client";

import { memo } from "react";
import type { ReactNode } from "react";
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
  actions?: ReactNode;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { href: "#features", labelKey: "nav.features" },
  { href: "#about", labelKey: "nav.about" },
];

export const Header = memo(function Header({
  title,
  navItems = defaultNavItems,
  actions,
  className,
}: HeaderProps) {
  const t = useTranslations();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md dark:border-gray-800/50 dark:bg-gray-950/90",
        className
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
        {/* Logo / Title */}
        <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
          {title ?? t("common.appTitle")}
        </h1>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {actions}
          <div className="ml-2 flex items-center gap-1 rounded-lg bg-gray-100/80 p-1 dark:bg-gray-800/50">
            <LocaleSwitcher />
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
});
