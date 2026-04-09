"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID_FALLBACK = "G-Y19X5LHKSJ";

function normalizeGaMeasurementId(raw: string | undefined) {
  const normalized = raw?.trim().toUpperCase() || GA_MEASUREMENT_ID_FALLBACK;
  return normalized.startsWith("G-") ? normalized : "";
}

export function ThirdPartyScripts() {
  const gaMeasurementId = normalizeGaMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
  const lastTrackedPathRef = useRef("");

  const shouldTrackGa = gaMeasurementId.startsWith("G-");

  useEffect(() => {
    if (!shouldTrackGa) {
      return;
    }

    const getCurrentPath = () => `${window.location.pathname}${window.location.search}`;

    const emitPageView = () => {
      const currentPath = getCurrentPath();
      if (lastTrackedPathRef.current === currentPath) {
        return true;
      }
      if (typeof window.gtag !== "function") {
        return false;
      }

      window.gtag("event", "page_view", {
        send_to: gaMeasurementId,
        page_path: currentPath,
        page_location: `${window.location.origin}${currentPath}`,
        page_title: document.title,
      });
      lastTrackedPathRef.current = currentPath;
      return true;
    };

    let retryIntervalId: number | null = null;
    const clearRetry = () => {
      if (retryIntervalId !== null) {
        window.clearInterval(retryIntervalId);
        retryIntervalId = null;
      }
    };

    const trackWithRetry = () => {
      clearRetry();
      if (emitPageView()) {
        return;
      }

      let attempts = 0;
      retryIntervalId = window.setInterval(() => {
        attempts += 1;
        if (emitPageView() || attempts >= 10) {
          clearRetry();
        }
      }, 300);
    };

    const onRouteChanged = () => {
      trackWithRetry();
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function patchedPushState(
      data: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      originalPushState(data, unused, url);
      onRouteChanged();
    };

    window.history.replaceState = function patchedReplaceState(
      data: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      originalReplaceState(data, unused, url);
      onRouteChanged();
    };

    window.addEventListener("popstate", onRouteChanged);
    trackWithRetry();

    return () => {
      clearRetry();
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", onRouteChanged);
    };
  }, [gaMeasurementId, shouldTrackGa]);

  return null;
}
