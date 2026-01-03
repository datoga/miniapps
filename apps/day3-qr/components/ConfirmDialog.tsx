"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
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

interface ThreeOptionDialogProps {
  open: boolean;
  title: string;
  message: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  saveLabel?: string;
  discardLabel?: string;
  cancelLabel?: string;
  saveDisabled?: boolean;
}

export const ThreeOptionDialog = memo(function ThreeOptionDialog({
  open,
  title,
  message,
  onSave,
  onDiscard,
  onCancel,
  saveLabel,
  discardLabel,
  cancelLabel,
  saveDisabled = false,
}: ThreeOptionDialogProps) {
  const t = useTranslations();

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="mb-6 text-gray-600 dark:text-gray-400">{message}</p>
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel || t("common.cancel")}
        </Button>
        <Button
          variant="outline"
          onClick={onDiscard}
          className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
        >
          {discardLabel || t("editor.discard")}
        </Button>
        <Button onClick={onSave} disabled={saveDisabled}>
          {saveLabel || t("common.save")}
        </Button>
      </div>
    </Modal>
  );
});

