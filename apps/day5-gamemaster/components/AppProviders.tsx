"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ModalLabelsWrapper } from "@miniapps/ui";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Client component that provides translated labels to modal components
 */
export function AppProviders({ children }: AppProvidersProps) {
  const t = useTranslations();

  return <ModalLabelsWrapper t={t}>{children}</ModalLabelsWrapper>;
}
