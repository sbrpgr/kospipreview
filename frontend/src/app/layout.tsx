import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { ThirdPartyScripts } from "@/components/third-party-scripts";
import {
  SITE_DESCRIPTION,
  SITE_HOSTNAME,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  toAbsoluteUrl,
} from "@/lib/seo";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const canonicalRedirectTarget = SITE_URL;

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
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    url: toAbsoluteUrl("/"),
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: canonicalHostRedirectScript }} />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5869520985295558"
          crossOrigin="anonymous"
        />
      </head>
      <body className={notoSansKR.className}>
        {children}
        <ThirdPartyScripts />
      </body>
    </html>
  );
}
