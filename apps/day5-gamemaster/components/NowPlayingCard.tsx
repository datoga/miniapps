"use client";

import { useTranslations } from "next-intl";

interface NowPlayingCardProps {
  children: React.ReactNode;
  roundName?: string;
}

export function NowPlayingCard({ children, roundName }: NowPlayingCardProps) {
  const t = useTranslations();

  return (
    <div className="mb-8 rounded-lg border-2 border-violet-500 bg-white p-6 dark:border-violet-400 dark:bg-gray-900">
      <h2 className="mb-4 text-center text-xl font-bold text-violet-600 dark:text-violet-400">
        {t("tournament.nowPlaying.title")}
        {roundName && (
          <span className="ml-2 text-lg font-medium text-violet-500 dark:text-violet-300">
            — {roundName}
          </span>
        )}
      </h2>
      {children}
    </div>
  );
}

