"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { SITE_HOSTNAME } from "@/lib/seo";

function normalizeGaMeasurementId(raw: string | undefined) {
  if (!raw) {
    return "";
  }
  return raw.trim().toUpperCase();
}

function normalizeAdsenseClient(raw: string | undefined) {
  if (!raw) {
    return "";
  }
  const value = raw.trim();
  return value.startsWith("ca-pub-") ? value : "";
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
  const adsenseClient = normalizeAdsenseClient(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
  const [isAllowedHost, setIsAllowedHost] = useState(false);

  useEffect(() => {
    setIsAllowedHost(isAllowedScriptHost(window.location.hostname));
  }, []);

  const shouldLoadGa = isAllowedHost && gaMeasurementId.startsWith("G-");
  const shouldLoadAdsense = isAllowedHost && adsenseClient.length > 0;

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
                anonymize_ip: true
              });
            `}
          </Script>
        </>
      ) : null}

      {shouldLoadAdsense ? (
        <Script
          id="adsense-auto-ads"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
        />
      ) : null}
    </>
  );
}
