"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    PartnersCoupang?: {
      G: new (options: {
        id: number;
        template: string;
        trackingCode: string;
        width: string;
        height: string;
        tsource: string;
        container?: HTMLElement;
      }) => unknown;
    };
  }
}

const COUPANG_SCRIPT_ID = "coupang-partners-script";
const COUPANG_SCRIPT_SRC = "https://ads-partners.coupang.com/g.js";
const AD_INQUIRY_EMAIL = "ytbtheguy@gmail.com";

function loadCoupangScript() {
  const existingScript = document.getElementById(COUPANG_SCRIPT_ID) as HTMLScriptElement | null;

  if (window.PartnersCoupang?.G) {
    return Promise.resolve();
  }

  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Coupang ad script")), {
        once: true,
      });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = COUPANG_SCRIPT_ID;
    script.src = COUPANG_SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load Coupang ad script")), { once: true });
    document.body.appendChild(script);
  });
}

function InquirySlot() {
  return (
    <div className="homeTopAdSlot isInquiry">
      <span className="homeTopAdLabel">광고</span>
      <div className="homeTopAdInquiry">
        <span>광고문의</span>
        <a href={`mailto:${AD_INQUIRY_EMAIL}`}>{AD_INQUIRY_EMAIL}</a>
      </div>
    </div>
  );
}

export function HomeTopAdBanner() {
  const coupangContainerRef = useRef<HTMLDivElement | null>(null);
  const hasRenderedCoupangRef = useRef(false);

  useEffect(() => {
    if (hasRenderedCoupangRef.current) {
      return;
    }

    const container = coupangContainerRef.current;
    if (!container) {
      return;
    }

    hasRenderedCoupangRef.current = true;

    void loadCoupangScript()
      .then(() => {
        if (!window.PartnersCoupang?.G || !container.isConnected) {
          return;
        }

        container.innerHTML = "";
        new window.PartnersCoupang.G({
          id: 995011,
          template: "carousel",
          trackingCode: "AF1258921",
          width: "320",
          height: "140",
          tsource: "",
          container,
        });
      })
      .catch(() => {
        hasRenderedCoupangRef.current = false;
      });
  }, []);

  return (
    <aside className="homeTopAdBanner" aria-label="광고">
      <div className="homeTopAdSlot isCoupang">
        <span className="homeTopAdLabel">광고</span>
        <div ref={coupangContainerRef} className="homeTopCoupangMount" aria-label="쿠팡 파트너스 광고" />
      </div>
      <InquirySlot />
      <InquirySlot />
    </aside>
  );
}
