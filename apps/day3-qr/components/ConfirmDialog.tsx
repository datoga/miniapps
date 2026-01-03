"use client";

import { Button } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

export const ConfirmDialog = memo(function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  variant = "default",
}: ConfirmDialogProps) {
  const t = useTranslations();

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="mb-6 text-gray-600 dark:text-gray-400">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel || t("common.cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          className={
            variant === "danger"
              ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400"
              : ""
          }
        >
          {confirmLabel || t("confirm.confirm")}
        </Button>
      </div>
    </Modal>
  );
});
