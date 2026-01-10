"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface ModalLabels {
  /** Label for close button (used by Modal and ConfirmDialog) */
  close?: string;
  /** Label for confirm button (used by ConfirmDialog) */
  confirm?: string;
  /** Label for cancel button (used by ConfirmDialog) */
  cancel?: string;
}

const defaultLabels: ModalLabels = {
  close: "Close",
  confirm: "Confirm",
  cancel: "Cancel",
};

const ModalLabelsContext = createContext<ModalLabels>(defaultLabels);

export interface ModalLabelsProviderProps {
  /** Translated labels for modal components */
  labels: ModalLabels;
  children: ReactNode;
}

/**
 * ModalLabelsProvider - Provides translated labels to Modal and ConfirmDialog components
 *
 * @example
 * ```tsx
 * // In your app's layout or root component:
 * function AppLayout({ children }) {
 *   const t = useTranslations();
 *   return (
 *     <ModalLabelsProvider
 *       labels={{
 *         close: t("common.close"),
 *         confirm: t("confirm.confirm"),
 *         cancel: t("confirm.cancel"),
 *       }}
 *     >
 *       {children}
 *     </ModalLabelsProvider>
 *   );
 * }
 * ```
 */
export function ModalLabelsProvider({ labels, children }: ModalLabelsProviderProps) {
  const mergedLabels = { ...defaultLabels, ...labels };
  return (
    <ModalLabelsContext.Provider value={mergedLabels}>{children}</ModalLabelsContext.Provider>
  );
}

/**
 * Hook to access modal labels from context
 * Returns default labels if no provider is found
 */
export function useModalLabels(): ModalLabels {
  return useContext(ModalLabelsContext);
}
