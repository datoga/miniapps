"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@miniapps/ui";

const TALLY_FORM_IDS = {
  en: "0QBzK0",
  es: "1AdzjO",
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  locale: "en" | "es";
};

export function ProfessionRequestModal({
  isOpen,
  onClose,
  searchQuery,
  locale,
}: Props) {
  const t = useTranslations("landing.search.request");

  // Load Tally widget script when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadTally = () => {
      if (typeof window !== "undefined" && "Tally" in window) {
        // @ts-expect-error Tally is loaded from external script
        window.Tally.loadEmbeds();
      }
    };

    // Small delay to ensure iframe is in DOM
    const timer = setTimeout(() => {
      const existingScript = document.querySelector(
        'script[src="https://tally.so/widgets/embed.js"]'
      );

      if (existingScript) {
        loadTally();
      } else {
        const script = document.createElement("script");
        script.src = "https://tally.so/widgets/embed.js";
        script.onload = loadTally;
        script.onerror = loadTally;
        document.body.appendChild(script);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Build Tally embed URL with pre-filled profession
  const formId = TALLY_FORM_IDS[locale];
  const tallyUrl = `https://tally.so/embed/${formId}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1&profession=${encodeURIComponent(searchQuery)}`;

  return (
    <Modal open={isOpen} onClose={onClose} title={t("modalTitle")} size="md">
      {/* Show the profession being requested */}
      <div className="mb-4 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
        <p className="text-sm text-violet-600 dark:text-violet-400">
          {t("requesting")}:
        </p>
        <p className="font-semibold text-violet-900 dark:text-violet-100 text-lg">
          {searchQuery}
        </p>
      </div>

      {/* Light background wrapper for Tally iframe (Tally free is always white) */}
      <div className="-mx-6 -mb-6 mt-2 p-4 bg-white rounded-b-xl">
        <iframe
          data-tally-src={tallyUrl}
          loading="lazy"
          width="100%"
          height="300"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title="Request a profession"
          style={{ border: "none" }}
        />
      </div>
    </Modal>
  );
}
