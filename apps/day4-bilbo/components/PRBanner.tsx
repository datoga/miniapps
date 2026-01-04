"use client";

import { useTranslations } from "next-intl";
import { formatWeight } from "@/lib/math";
import type { UnitsUI } from "@/lib/schemas";

interface PRBannerProps {
  previous1RMKg: number;
  new1RMKg: number;
  unitsUI: UnitsUI;
  onDismiss: () => void;
}

export function PRBanner({ previous1RMKg, new1RMKg, unitsUI, onDismiss }: PRBannerProps) {
  const t = useTranslations();

  return (
    <div className="fixed inset-x-0 top-0 z-50 p-4">
      <div className="mx-auto max-w-md animate-bounce rounded-xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 p-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📈</span>
            <div>
              <h3 className="font-bold text-white">{t("rm.detected")}</h3>
              <div className="mt-1 space-y-0.5 text-sm text-white/90">
                <p>
                  {t("rm.previous")}: <span className="font-mono">{formatWeight(previous1RMKg, unitsUI)}</span>
                </p>
                <p>
                  {t("rm.new")}: <span className="font-mono font-bold">{formatWeight(new1RMKg, unitsUI)}</span>
                </p>
                <p className="text-xs opacity-75">{t("rm.hint")}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white"
            aria-label={t("rm.dismiss")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

