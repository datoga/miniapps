"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";

export const ProcessingOverlay = memo(function ProcessingOverlay() {
  const t = useTranslations();

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-md">
      {/* Animated icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-ping rounded-full bg-white/20" style={{ animationDuration: "1.5s" }} />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      </div>

      <p className="mb-2 text-xl font-semibold text-white">
        {t("recorder.processing")}
      </p>
      <p className="text-sm text-white/70">
        {t("recorder.processingHint")}
      </p>
    </div>
  );
});

