"use client";

import type { ReactNode } from "react";
import { ModalLabelsProvider } from "./ModalLabelsContext";

export interface ModalLabelsWrapperProps {
  children: ReactNode;
  /** Translation function - typically from useTranslations() */
  t: (key: string) => string;
  /** Keys to use for translations */
  keys?: {
    close?: string;
    confirm?: string;
    cancel?: string;
  };
}

const defaultKeys = {
  close: "common.close",
  confirm: "common.confirm",
  cancel: "common.cancel",
};

/**
 * ModalLabelsWrapper - Client component that provides translated labels to modals
 *
 * @example
 * ```tsx
 * // In a client component:
 * function ClientLayout({ children }) {
 *   const t = useTranslations();
 *   return (
 *     <ModalLabelsWrapper t={t}>
 *       {children}
 *     </ModalLabelsWrapper>
 *   );
 * }
 * ```
 */
export function ModalLabelsWrapper({
  children,
  t,
  keys = defaultKeys,
}: ModalLabelsWrapperProps) {
  const labels = {
    close: t(keys.close ?? defaultKeys.close),
    confirm: t(keys.confirm ?? defaultKeys.confirm),
    cancel: t(keys.cancel ?? defaultKeys.cancel),
  };

  return <ModalLabelsProvider labels={labels}>{children}</ModalLabelsProvider>;
}
