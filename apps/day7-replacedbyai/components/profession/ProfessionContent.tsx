"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Profession } from "../../lib/professions/schema";
import { ProfessionHeader } from "./ProfessionHeader";
import { TimelineSection } from "./TimelineSection";
import { TasksSection } from "./TasksSection";
import { StrategiesSection } from "./StrategiesSection";
import { SignalsSection } from "./SignalsSection";
import { SourcesSection } from "./SourcesSection";
import { NotesSection } from "./NotesSection";
import { BackToSearch } from "./BackToSearch";
import { OtherProfessions } from "./OtherProfessions";
import { Cusdis } from "../Cusdis";

interface ProfessionContentProps {
  profession: Profession;
  locale: string;
}

const sections = [
  { id: "timeline", icon: "📅", component: TimelineSection },
  { id: "tasks", icon: "⚙️", component: TasksSection },
  { id: "strategies", icon: "🎯", component: StrategiesSection },
  { id: "signals", icon: "📡", component: SignalsSection },
  { id: "sources", icon: "📚", component: SourcesSection },
  { id: "notes", icon: "📝", component: NotesSection },
] as const;

export function ProfessionContent({ profession, locale }: ProfessionContentProps) {
  const t = useTranslations("profession");
  const [openSectionId, setOpenSectionId] = useState<string>("timeline");
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const placeholderRef = useRef<HTMLDivElement>(null);

  // Track when tabs should become sticky using the placeholder position
  useEffect(() => {
    const handleScroll = () => {
      if (placeholderRef.current) {
        const rect = placeholderRef.current.getBoundingClientRect();
        // Make sticky when placeholder reaches the header (64px from top)
        setIsTabsSticky(rect.top <= 64);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggle = (sectionId: string) => {
    setOpenSectionId((current) => (current === sectionId ? "" : sectionId));
  };

  // Navigate to section: scroll + open
  const navigateToSection = useCallback((sectionId: string) => {
    setOpenSectionId(sectionId);

    // Scroll to section
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 140; // Account for header + sticky tabs
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 50);
  }, []);

  return (
    <>
      {/* Back link */}
      <BackToSearch locale={locale} />

      {/* Profession header */}
      <ProfessionHeader profession={profession} />

      {/* Placeholder to track original position */}
      <div ref={placeholderRef} className={isTabsSticky ? "h-14" : ""}>
        {/* Inline tabs when not sticky */}
        {!isTabsSticky && (
          <nav className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {sections.map(({ id, icon }) => {
              const isActive = openSectionId === id;
              return (
                <button
                  key={id}
                  onClick={() => navigateToSection(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <span>{icon}</span>
                  <span className="hidden sm:inline">
                    {t(`nav.${id}` as Parameters<typeof t>[0])}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Fixed tabs when sticky */}
      {isTabsSticky && (
        <div className="fixed top-16 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md">
          <div className="max-w-3xl mx-auto px-4">
            <nav className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
              {sections.map(({ id, icon }) => {
                const isActive = openSectionId === id;
                return (
                  <button
                    key={id}
                    onClick={() => navigateToSection(id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>{icon}</span>
                    <span className="hidden sm:inline">
                      {t(`nav.${id}` as Parameters<typeof t>[0])}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Accordion sections */}
      <div className="space-y-4 mt-4">
        {sections.map(({ id, component: SectionComponent }) => (
          <SectionComponent
            key={id}
            profession={profession}
            id={id}
            isOpen={openSectionId === id}
            onToggle={() => handleToggle(id)}
          />
        ))}
      </div>

      {/* Other professions */}
      <OtherProfessions
        locale={locale as "en" | "es"}
        currentSlug={profession.slug[locale as "en" | "es"] || profession.slug.en}
      />

      {/* Comments */}
      <Cusdis
        pageId={profession.id}
        pageTitle={profession.name.en}
      />
    </>
  );
}
