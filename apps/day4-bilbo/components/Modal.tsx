"use client";

import { Modal as BaseModal, type ModalProps as BaseModalProps } from "@miniapps/ui";
import { useTranslations } from "next-intl";

// Re-export with default closeLabel from i18n and support for isOpen alias
export interface ModalProps extends Omit<BaseModalProps, "closeLabel" | "open"> {
  /** Whether the modal is open (alias for 'open') */
  isOpen?: boolean;
  /** Whether the modal is open */
  open?: boolean;
  closeLabel?: string;
}

export function Modal({ isOpen, open, closeLabel, ...props }: ModalProps) {
  const t = useTranslations();

  return (
    <BaseModal
      {...props}
      open={isOpen ?? open ?? false}
      closeLabel={closeLabel || t("common.close")}
    />
  );
}
