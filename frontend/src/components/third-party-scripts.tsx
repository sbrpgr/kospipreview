import Script from "next/script";

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

export function ThirdPartyScripts() {
  const gaMeasurementId = normalizeGaMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
  const adsenseClient = normalizeAdsenseClient(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
  const shouldLoadGa = gaMeasurementId.startsWith("G-");
  const shouldLoadAdsense = adsenseClient.length > 0;

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
