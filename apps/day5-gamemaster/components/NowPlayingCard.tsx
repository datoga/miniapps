"use client";

import { useTranslations } from "next-intl";

interface NowPlayingCardProps {
  children: React.ReactNode;
}

export function NowPlayingCard({ children }: NowPlayingCardProps) {
  const t = useTranslations();

  return (
    <div className="mb-8 rounded-lg border-2 border-violet-500 bg-white p-6 dark:border-violet-400 dark:bg-gray-900">
      <h2 className="mb-4 text-center text-xl font-bold text-violet-600 dark:text-violet-400">
        {t("tournament.nowPlaying.title")}
      </h2>
      {children}
    </div>
  );
}

