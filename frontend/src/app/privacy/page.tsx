import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";

export default async function PrivacyPage() {
  const freshness = await getDataFreshness();
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <main className="prose">
        <h2 className="sectionTitle">개인정보처리방침</h2>
        
        <p>
          본 서비스(KOSPI 예측 플랫폼)는 로그인이나 개인 식별 정보(PII)를 요구하지 않습니다.
          따라서 데이터베이스에 어떠한 사용자 개인정보도 저장하거나 처리하지 않습니다.
        </p>

        <h3>1. 웹 호스팅 로그</h3>
        <p>
          Firebase Hosting 기반으로 배포되는 특성상, 접속 IP나 브라우저 User-Agent 정보가 해당 서비스 제공자 단위에서 단기 기록될 수 있습니다. 
          이는 본 서비스 개발자가 별도 추출 및 보관하는 대상이 아닙니다.
        </p>

        <h3>2. 쿠키(Cookie) 및 로컬 저장소</h3>
        <p>
          현재 기능 내에서는 사용자 기기에 별도의 식별용 쿠키나 로컬스토리지 토큰을 심지 않습니다. 향후 맞춤 관심 종목 등 편의 기능이 제공될 경우, 관련 내용을 고지할 예정입니다.
        </p>
      </main>
    </div>
  );
}
