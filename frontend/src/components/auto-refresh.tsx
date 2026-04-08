"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * 지정된 인터벌(기본 60초)마다 Next.js 서버 컴포넌트 데이터를 리프레시합니다.
 */
export function AutoRefresh({ intervalMs = 60000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      console.log("자동 데이터 갱신 중...");
      router.refresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null; // 시각적 요소 없음
}
