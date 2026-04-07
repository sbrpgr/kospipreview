import { SiteHeader } from "@/components/site-header";

export default function PrivacyPage() {
  return (
    <main className="pageShell innerPage">
      <SiteHeader
        description="현재 서비스 운영 범위에서 수집되는 정보와 향후 분석 도구가 추가될 때 어떤 기준으로 고지할지 간단히 정리했습니다."
        eyebrow="정책"
        title="개인정보처리방침"
      />
      <section className="sectionCard proseSection">
        <p>
          본 서비스는 회원가입 기능이 없는 읽기 전용 대시보드입니다. 향후 광고 또는 분석
          도구가 도입되면 쿠키 사용 범위와 수집 목적을 이 페이지에 명시합니다.
        </p>
        <p>
          운영 중 수집되는 서버 로그와 장애 로그는 서비스 안정성 확보 목적으로만 사용하며,
          법령상 보관 의무가 없는 한 최소 기간만 유지합니다.
        </p>
      </section>
    </main>
  );
}
