"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";

interface CusdisProps {
  pageId: string;
  pageTitle: string;
  pageUrl?: string;
}

const CUSDIS_APP_ID = "5aaa43d2-320c-4fc9-a758-37a2c3bf76a0";

// Custom Spanish translations for Cusdis
const spanishTranslations = {
  "powered by": "Comentarios con",
  "Comment": "Comentar",
  "Nickname": "Nombre",
  "Email (optional)": "Email (opcional)",
  "Reply": "Responder",
  "Reply...": "Responder...",
  "Write a comment...": "Escribe un comentario...",
  "Send": "Enviar",
  "Sending...": "Enviando...",
  "Login": "Iniciar sesión",
  "0 Comments": "0 comentarios",
  "1 Comment": "1 comentario",
  "comments": "comentarios",
};

export function Cusdis({ pageId, pageTitle, pageUrl }: CusdisProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const [key, setKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Wait for client mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set custom locale before loading script
  useEffect(() => {
    if (locale === "es") {
      (window as Window & { CUSDIS_LOCALE?: Record<string, string> }).CUSDIS_LOCALE = spanishTranslations;
    } else {
      delete (window as Window & { CUSDIS_LOCALE?: Record<string, string> }).CUSDIS_LOCALE;
    }
  }, [locale]);

  // Re-render widget when locale changes
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [locale]);

  useEffect(() => {
    // Remove existing script to reload with new locale
    const existingScript = document.querySelector('script[src="https://cusdis.com/js/cusdis.es.js"]');

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://cusdis.com/js/cusdis.es.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else if (window.CUSDIS?.renderTo && containerRef.current) {
      // Re-render if script already loaded
      window.CUSDIS.renderTo(containerRef.current);
    }

    // Update theme when it changes
    const updateTheme = () => {
      if (window.CUSDIS) {
        window.CUSDIS.setTheme(resolvedTheme === "dark" ? "dark" : "light");
      }
    };

    const timeoutId = setTimeout(updateTheme, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [resolvedTheme, key]);

  // Use consistent default theme for SSR to avoid hydration mismatch
  const theme = mounted ? (resolvedTheme === "dark" ? "dark" : "light") : "light";

  return (
    <section className="mt-20 pt-10 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white flex items-center gap-3">
        <span>💬</span>
        <span>{locale === "es" ? "Comentarios" : "Comments"}</span>
      </h2>
      <div
        key={key}
        ref={containerRef}
        id="cusdis_thread"
        data-host="https://cusdis.com"
        data-app-id={CUSDIS_APP_ID}
        data-page-id={pageId}
        data-page-title={pageTitle}
        data-page-url={pageUrl}
        data-theme={theme}
        data-lang={locale === "es" ? "es" : "en"}
      />
    </section>
  );
}

declare global {
  interface Window {
    CUSDIS?: {
      setTheme: (theme: "light" | "dark") => void;
      renderTo: (element: HTMLElement) => void;
    };
    CUSDIS_LOCALE?: Record<string, string>;
  }
}
