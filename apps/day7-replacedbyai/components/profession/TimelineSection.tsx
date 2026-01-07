"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Profession } from "../../lib/professions/schema";
import { tMany } from "../../lib/professions/translations";
import { CollapsibleSection } from "./CollapsibleSection";
import { useSwipe } from "../../lib/useSwipe";

interface TimelineSectionProps {
  profession: Profession;
  id?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const phaseConfig = {
  Now: {
    years: "0-2",
    icon: "🚀",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
    border: "border-emerald-300 dark:border-emerald-700",
    text: "text-emerald-700 dark:text-emerald-300",
    badge: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    activeBg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  Next: {
    years: "3-5",
    icon: "⚡",
    gradient: "from-cyan-500 to-blue-500",
    bgGradient: "from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20",
    border: "border-cyan-300 dark:border-cyan-700",
    text: "text-cyan-700 dark:text-cyan-300",
    badge: "bg-cyan-500",
    ring: "ring-cyan-500/30",
    activeBg: "bg-cyan-100 dark:bg-cyan-900/40",
  },
  Later: {
    years: "5-10",
    icon: "🔮",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-700 dark:text-purple-300",
    badge: "bg-purple-500",
    ring: "ring-purple-500/30",
    activeBg: "bg-purple-100 dark:bg-purple-900/40",
  },
};

export function TimelineSection({ profession, id = "timeline", isOpen = true, onToggle = () => {} }: TimelineSectionProps) {
  const locale = useLocale();
  const ui = useTranslations("profession");
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(prev + 1, profession.timeline.length - 1));
  }, [profession.timeline.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const swipeHandlers = useSwipe({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  const activeEntry = profession.timeline[activeIndex];

  if (!activeEntry) {
    return null;
  }

  const activeConfig = phaseConfig[activeEntry.phase];
  const whatChanges = tMany(activeEntry.whatChangesKeys, locale);
  const implications = tMany(activeEntry.implicationsKeys, locale);

  return (
    <CollapsibleSection
      id={id}
      title={ui("timeline.title")}
      icon="📅"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {/* Horizontal timeline slider */}
      <div className="relative mt-6 mb-10 overflow-hidden pt-2 -mt-2">
        {/* Progress bar background */}
        <div className="absolute top-9 left-[16.66%] right-[16.66%] h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />

        {/* Progress bar fill */}
        <div
          className="absolute top-9 left-[16.66%] h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${activeIndex * 33.33}%` }}
        />

        {/* Timeline markers - clickable */}
        <div className="relative flex justify-between px-4 pt-2">
          {profession.timeline.map((entry, index) => {
            const config = phaseConfig[entry.phase];
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;

            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`flex flex-col items-center transition-all duration-300 group ${
                  isActive ? "scale-110" : "hover:scale-105"
                }`}
              >
                {/* Marker dot */}
                <div
                  className={`relative z-10 w-14 h-14 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-lg transition-all duration-300 ${
                    isActive
                      ? `ring-4 ${config.ring} scale-110`
                      : isPast
                      ? "opacity-100"
                      : "opacity-60 grayscale-[30%] group-hover:opacity-100 group-hover:grayscale-0"
                  }`}
                >
                  {config.icon}
                </div>
                {/* Year badge */}
                <div
                  className={`mt-2 px-3 py-1 rounded-full text-xs font-bold text-white transition-all duration-300 ${
                    config.badge
                  } ${isActive ? "scale-105" : "opacity-80"}`}
                >
                  {config.years} {ui("timeline.years")}
                </div>
                {/* Phase name */}
                <span
                  className={`mt-1 text-sm font-semibold transition-all duration-300 ${
                    isActive ? config.text : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {ui(`timeline.phases.${entry.phase}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active phase card - with slide animation and swipe support */}
      <div
        className="relative touch-pan-y"
        {...swipeHandlers}
      >
        <div
          key={activeIndex}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${activeConfig.bgGradient} border-2 ${activeConfig.border} animate-fadeIn`}
        >
          {/* Decorative gradient bar */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${activeConfig.gradient}`} />

          <div className="p-6">
            {/* Card header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                {activeConfig.icon}
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${activeConfig.text}`}>
                  {ui(`timeline.phases.${activeEntry.phase}`)}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {activeConfig.years} {ui("timeline.years")}
                </span>
              </div>
            </div>

            {/* Content grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* What's changing */}
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-5 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🔄</span>
                  <h4 className="font-bold text-gray-800 dark:text-gray-100">
                    {ui("timeline.whatChanges")}
                  </h4>
                </div>
                <ul className="space-y-3">
                  {whatChanges.map((change, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-center text-white text-xs font-bold mt-0.5 shadow-sm`}>
                        {i + 1}
                      </span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Implications */}
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-5 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">💡</span>
                  <h4 className="font-bold text-gray-800 dark:text-gray-100">
                    {ui("timeline.implications")}
                  </h4>
                </div>
                <ul className="space-y-3">
                  {implications.map((impl, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <svg className={`flex-shrink-0 w-5 h-5 mt-0.5 ${activeConfig.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span>{impl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-4">
        {profession.timeline.map((entry, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? `w-8 ${phaseConfig[entry.phase].badge}`
                : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            }`}
            aria-label={`Go to ${entry.phase}`}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
}
