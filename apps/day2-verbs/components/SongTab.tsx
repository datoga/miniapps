"use client";

import { memo, useEffect, useState } from "react";
import { useTheme } from "next-themes";

export const SongTab = memo(function SongTab() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const spotifyUrl = mounted && resolvedTheme === "dark"
    ? "https://open.spotify.com/embed/track/1IxjfZs2LtLCVS028pvZyl?utm_source=generator&theme=0"
    : "https://open.spotify.com/embed/track/1IxjfZs2LtLCVS028pvZyl?utm_source=generator";

  return (
    <div className="space-y-4">
      {/* Spotify Embed */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <iframe
          style={{ borderRadius: "12px", background: "transparent" }}
          src={spotifyUrl}
          width="100%"
          height="152"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Irregular Verbs Song on Spotify"
        />
      </div>

      {/* YouTube Link */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="space-y-4 text-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            🎬 Video on YouTube
          </h2>
          <a
            href="https://www.youtube.com/watch?v=MA3NFtLc22k"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-xl bg-red-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-red-700"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
            Watch on YouTube
          </a>
        </div>
      </div>
    </div>
  );
});
