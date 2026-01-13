"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check for updates on page load
        registration.update();

        // Check for updates periodically (every 60 seconds)
        const intervalId = setInterval(() => {
          registration.update();
        }, 60 * 1000);

        // Clean up interval on unmount
        window.addEventListener("beforeunload", () => {
          clearInterval(intervalId);
        });

        // Handle update found
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New content available - immediately activate
                // This triggers skipWaiting in the new SW
                newWorker.postMessage("skipWaiting");
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("[App] Service Worker registration failed:", error);
      });

    // Handle controller change (new SW activated)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  return null;
}


