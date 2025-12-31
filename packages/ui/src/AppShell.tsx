"use client";

import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { cn } from "./utils";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function AppShell({ children, title, className }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <Header title={title} />
      <main className={cn("flex-1", className)}>{children}</main>
      <Footer />
    </div>
  );
}
