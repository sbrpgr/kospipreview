import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // typedRoutes는 실험적 기능으로 빌드 불안정 요인, 제거
};

export default nextConfig;
