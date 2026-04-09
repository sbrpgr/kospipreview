import type { Metadata, Viewport } from "next";
import { ThirdPartyScripts } from "@/components/third-party-scripts";
import {
  ADSENSE_PUBLISHER_ID,
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_HOSTNAME,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  toAbsoluteUrl,
} from "@/lib/seo";
import "./globals.css";

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const canonicalRedirectTarget = SITE_URL;
const GA_MEASUREMENT_ID_FALLBACK = "G-Y19X5LHKSJ";
const rawGaMeasurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim().toUpperCase() || GA_MEASUREMENT_ID_FALLBACK;
const gaMeasurementId = rawGaMeasurementId.startsWith("G-") ? rawGaMeasurementId : "";
const adsenseMetaAccount = ADSENSE_PUBLISHER_ID;
const adsenseScriptSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;

const canonicalHostRedirectScript = `
  (function () {
    var canonicalOrigin = ${JSON.stringify(canonicalRedirectTarget)};
    var canonicalHost = ${JSON.stringify(SITE_HOSTNAME)};
    if (!canonicalOrigin || !canonicalHost) return;

    var currentHost = window.location.hostname.toLowerCase();
    var isAlreadyCanonical =
      currentHost === canonicalHost || currentHost === ("www." + canonicalHost);
    if (isAlreadyCanonical) return;

    var isFirebaseDefaultHost =
      currentHost.endsWith(".web.app") || currentHost.endsWith(".firebaseapp.com");
    if (!isFirebaseDefaultHost) return;

    var targetUrl =
      canonicalOrigin +
      window.location.pathname +
      window.location.search +
      window.location.hash;
    window.location.replace(targetUrl);
  })();
`;

const gaInitScript = gaMeasurementId
  ? `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', '${gaMeasurementId}', {
    anonymize_ip: true,
    send_page_view: false
  });
`
  : "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | KOSPI Dawn",
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  category: "finance",
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
  other: {
    "google-adsense-account": adsenseMetaAccount,
    "contact:email": CONTACT_EMAIL,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    url: toAbsoluteUrl("/"),
    images: [
      {
        url: toAbsoluteUrl("/og-image.svg"),
        width: 1200,
        height: 630,
        alt: "KOSPI Dawn - 코스피 시초가 예측 대시보드",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [toAbsoluteUrl("/og-image.svg")],
  },
};

export const viewport: Viewport = {
  themeColor: "#3182f6",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="//googleads.g.doubleclick.net" />
        <script dangerouslySetInnerHTML={{ __html: canonicalHostRedirectScript }} />
        <script async src={adsenseScriptSrc} crossOrigin="anonymous" />
        {gaMeasurementId ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            />
            <script dangerouslySetInnerHTML={{ __html: gaInitScript }} />
          </>
        ) : null}
      </head>
      <body>
        {children}
        <ThirdPartyScripts />
      </body>
    </html>
  );
}
