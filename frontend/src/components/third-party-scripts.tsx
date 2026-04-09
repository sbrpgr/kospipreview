"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { SITE_HOSTNAME } from "@/lib/seo";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function normalizeGaMeasurementId(raw: string | undefined) {
  if (!raw) {
    return "";
  }
  return raw.trim().toUpperCase();
}

function isAllowedScriptHost(hostname: string) {
  const current = hostname.trim().toLowerCase();
  if (!current) {
    return false;
  }

  if (current === "localhost" || current === "127.0.0.1") {
    return true;
  }

  if (!SITE_HOSTNAME) {
    return false;
  }

  return current === SITE_HOSTNAME || current === `www.${SITE_HOSTNAME}`;
}

export function ThirdPartyScripts() {
  const gaMeasurementId = normalizeGaMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
  const [isAllowedHost, setIsAllowedHost] = useState(false);
  const lastTrackedPathRef = useRef("");

  useEffect(() => {
    setIsAllowedHost(isAllowedScriptHost(window.location.hostname));
  }, []);

  const shouldLoadGa = isAllowedHost && gaMeasurementId.startsWith("G-");

  useEffect(() => {
    if (!shouldLoadGa) {
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
  }, [gaMeasurementId, shouldLoadGa]);

  return (
    <>
      {shouldLoadGa ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', {
                anonymize_ip: true,
                send_page_view: false
              });
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
