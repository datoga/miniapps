"use client";

import { useTranslations } from "next-intl";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
}: ConfirmDialogProps) {
  const t = useTranslations();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantClasses = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
    default: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="mb-6 text-gray-600 dark:text-gray-300">{message}</p>

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {cancelLabel || t("common.cancel")}
        </button>
        <button
          onClick={handleConfirm}
          className={`rounded-lg px-4 py-2 ${variantClasses[variant]}`}
        >
          {confirmLabel || t("common.confirm")}
        </button>
      </div>
    </Modal>
  );
}

