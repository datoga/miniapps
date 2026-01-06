"use client";

import { useTranslations } from "next-intl";
import { memo, useEffect, useState } from "react";

interface CountdownOverlayProps {
  value: number;
}

export const CountdownOverlay = memo(function CountdownOverlay({
  value,
}: CountdownOverlayProps) {
  const t = useTranslations();
  const [animate, setAnimate] = useState(false);

  // Trigger animation on value change
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 200);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
      <p className="mb-6 text-lg font-medium tracking-wide text-white/80">
        {t("recorder.countdown.starting")}
      </p>

      {/* Animated rings */}
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-red-500/20" style={{ animationDuration: "1s" }} />
        <div className="absolute -inset-4 rounded-full border-2 border-red-400/20" />

        <div
          className={`flex h-32 w-32 items-center justify-center rounded-full bg-red-600/90 shadow-xl transition-transform duration-200 ${
            animate ? "scale-110" : "scale-100"
          }`}
        >
          <span className="text-6xl font-bold text-white">{value}</span>
        </div>
      </div>
    </div>
  );
});

