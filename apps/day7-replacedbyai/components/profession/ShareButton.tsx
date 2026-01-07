"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

interface ShareButtonProps {
  professionName: string;
  slug: string;
}

export function ShareButton({ professionName, slug }: ShareButtonProps) {
  const locale = useLocale();
  const t = useTranslations("profession");
  const [copied, setCopied] = useState(false);

  const url = `https://replacedbyai.guru/${locale}/p/${slug}`;

  const shareText = locale === "es"
    ? `¿Será reemplazado un ${professionName} por la IA? Sí, pero... todavía no 🔮`
    : `Will a ${professionName} be replaced by AI? Yes, but... not yet 🔮`;

  const handleShare = async () => {
    const shareData = {
      title: shareText,
      text: shareText,
      url: url,
    };

    // Try native share first (mobile)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or error - fall through to clipboard
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
      aria-label={t("share")}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{locale === "es" ? "¡Copiado!" : "Copied!"}</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>{t("share")}</span>
        </>
      )}
    </button>
  );
}

