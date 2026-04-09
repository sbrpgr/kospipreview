import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PRIVACY_TITLE = "개인정보처리방침";
const PRIVACY_DESCRIPTION =
  "KOSPI Dawn 서비스의 개인정보 처리 기준, 로그 정책, 보관 원칙, 사용자 권리 안내입니다.";

export const metadata: Metadata = {
  title: PRIVACY_TITLE,
  description: PRIVACY_DESCRIPTION,
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: `${PRIVACY_TITLE} | ${SITE_NAME}`,
    description: PRIVACY_DESCRIPTION,
    url: toAbsoluteUrl("/privacy"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${PRIVACY_TITLE} | ${SITE_NAME}`,
    description: PRIVACY_DESCRIPTION,
  },
};

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
          KOSPI Dawn은 금융 데이터 조회 및 예측 정보를 제공하는 웹서비스로서, 사용자의 개인정보를 최소한으로 처리하는
          원칙을 채택하고 있습니다. 본 방침은 어떤 정보가 어떤 이유로 처리되는지, 그리고 사용자에게 어떤 권리가 있는지
          명확히 안내하기 위해 작성되었습니다. 서비스 운영자는 필요 최소 범위를 넘어선 정보 수집을 지양하며, 보안·안정성·
          법적 준수의 균형을 기준으로 운영 정책을 유지합니다.
        </p>

        <h3>1. 수집하는 정보 항목</h3>
        <p>
          당사는 회원가입 기능을 운영하지 않으므로 이름, 전화번호, 주민등록번호 등 직접 식별 가능한 정보를 기본적으로
          요구하지 않습니다. 다만 웹서비스 특성상 접속 시점에 IP 주소, 브라우저 정보, 요청 시간, 요청 경로와 같은
          기술적 로그가 인프라 레벨에서 자동 생성될 수 있습니다. 이러한 정보는 서비스 보안 유지, 장애 분석, 비정상 트래픽
          대응을 위한 목적에서만 제한적으로 사용됩니다.
        </p>

        <h3>2. 처리 목적과 법적 근거</h3>
        <p>
          자동 로그는 서비스 제공의 안정성 확보, 악성 요청 탐지, 시스템 오류 복구, 성능 개선을 위한 통계 분석 목적으로
          처리됩니다. 광고·분석 도구가 연동된 경우에도 개인 식별을 목적으로 하지 않으며, 필요한 경우 익명화 또는 집계 형태로
          활용합니다. 당사는 관련 법령 및 플랫폼 정책이 요구하는 범위에서만 정보를 처리하며, 목적 외 이용이나 제3자 제공을
          원칙적으로 제한합니다.
        </p>

        <h3>3. 보관 기간과 파기</h3>
        <p>
          기술 로그는 보안 대응과 장애 추적에 필요한 최소 기간 동안만 보관되며, 기간 경과 시 복구가 불가능한 방식으로
          파기하거나 비식별 통계 형태로 전환됩니다. 법령상 보관 의무가 있는 항목은 해당 기간 동안 별도 분리 보관 후
          지체 없이 파기합니다. 운영상 필요한 데이터 또한 정기적으로 점검하여 불필요하게 누적되지 않도록 관리합니다.
        </p>

        <h3>4. 제3자 제공 및 국외 이전</h3>
        <p>
          서비스는 클라우드 및 분석 도구를 활용할 수 있으며, 이 과정에서 인프라 제공자 또는 분석 플랫폼이 기술 로그를
          처리할 수 있습니다. 이는 서비스 제공을 위한 위탁 또는 도구 사용 범위에 해당하며, 사용자의 직접 식별 정보를
          판매하거나 임의 제공하는 방식과는 다릅니다. 국외 서버를 이용하는 경우에도 접근 권한 통제, 전송 구간 보호,
          계정 보안 정책을 적용해 보호 수준을 유지합니다.
        </p>

        <h3>5. 사용자 권리와 문의</h3>
        <p>
          사용자는 개인정보 처리와 관련하여 열람, 정정, 삭제, 처리정지 등 관계 법령이 허용하는 권리를 요청할 수 있습니다.
          본 서비스는 회원 식별 기반 구조가 제한적이므로 요청 처리 과정에서 본인 확인 절차가 필요할 수 있습니다. 권리 행사
          또는 방침 관련 문의는 문의 페이지의 공식 이메일을 통해 접수할 수 있으며, 접수 순서에 따라 검토 후 답변합니다.
        </p>

        <h3>6. 보안 조치</h3>
        <p>
          당사는 접근 권한 최소화, 비밀키 분리 보관, 배포 권한 통제, 보안 헤더 적용, 비정상 트래픽 차단 정책을 통해
          정보보호 수준을 강화합니다. 특히 키 노출과 같은 보안 이슈가 발생할 경우 즉시 키 회전(폐기·재발급), 저장소 시크릿
          갱신, 배포 재검증 절차를 수행합니다. 이러한 절차는 임시 대응이 아닌 상시 운영 프로세스로 유지됩니다.
        </p>

        <h3>7. 방침 변경</h3>
        <p>
          본 방침은 법령 개정, 서비스 구조 변경, 외부 도구 정책 변화에 따라 수정될 수 있습니다. 중요한 변경이 있는 경우
          웹사이트 공지 또는 별도 안내를 통해 고지합니다. 이용자는 정기적으로 본 페이지를 확인하여 최신 처리 기준을
          확인하시기 바랍니다. 본 방침은 고지된 시행일로부터 적용됩니다.
        </p>
      </main>
    </div>
  );
}

