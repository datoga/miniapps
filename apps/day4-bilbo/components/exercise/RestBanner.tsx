"use client";

import { Button } from "@miniapps/ui";
import { useTranslations } from "next-intl";

interface RestBannerProps {
  restStartDate: string;
  restEndDate?: string | null;
  onEndRest: () => void;
}

export function RestBanner({ restStartDate, restEndDate, onEndRest }: RestBannerProps) {
  const t = useTranslations();

  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex items-center gap-3">
        <span className="text-3xl">😴</span>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">
            {t("rest.restingTitle")}
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {t("rest.since")}{" "}
            <span className="md:hidden">
              {new Date(restStartDate).toLocaleDateString(undefined, {
                day: "numeric",
                month: "numeric",
              })}
            </span>
            <span className="hidden md:inline">
              {new Date(restStartDate).toLocaleDateString()}
            </span>
            {restEndDate && (
              <span>
                {" · "}
                {t("rest.until")}{" "}
                <span className="md:hidden">
                  {new Date(restEndDate).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "numeric",
                  })}
                </span>
                <span className="hidden md:inline">
                  {new Date(restEndDate).toLocaleDateString()}
                </span>
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onEndRest}
          className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
        >
          {t("rest.endRest")}
        </Button>
      </div>
    </div>
  );
}

