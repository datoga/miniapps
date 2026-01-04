"use client";

import { Modal as BaseModal, type ModalProps as BaseModalProps } from "@miniapps/ui";
import { useTranslations } from "next-intl";

// Re-export with default closeLabel from i18n
export interface ModalProps extends Omit<BaseModalProps, "closeLabel" | "size"> {
  closeLabel?: string;
  /** Custom max-width class (legacy support) */
  maxWidth?: string;
  size?: BaseModalProps["size"];
}

export function Modal({ closeLabel, maxWidth, size, ...props }: ModalProps) {
  const t = useTranslations();

  return (
    <BaseModal
      {...props}
      size={maxWidth || size || "lg"}
      closeLabel={closeLabel || t("common.close")}
    />
  );
}
