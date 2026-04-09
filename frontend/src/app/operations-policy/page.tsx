import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const POLICY_TITLE = "운영정책";
const POLICY_DESCRIPTION =
  "KOSPI Dawn 서비스의 운영시간, 데이터 반영, 품질관리, 장애 대응, 책임범위 정책 안내입니다.";

export const metadata: Metadata = {
  title: POLICY_TITLE,
  description: POLICY_DESCRIPTION,
  alternates: {
    canonical: "/operations-policy",
  },
  openGraph: {
    title: `${POLICY_TITLE} | ${SITE_NAME}`,
    description: POLICY_DESCRIPTION,
    url: toAbsoluteUrl("/operations-policy"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${POLICY_TITLE} | ${SITE_NAME}`,
    description: POLICY_DESCRIPTION,
  },
};

export default async function OperationsPolicyPage() {
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
        <h2 className="sectionTitle">운영정책</h2>
        <p>
          본 운영정책은 KOSPI Dawn이 예측 데이터를 어떤 원칙으로 수집·처리·제공하는지, 그리고 장애나 보안 이벤트가
          발생했을 때 어떤 방식으로 대응하는지를 명확히 안내하기 위해 작성되었습니다. 플랫폼은 매우 우수한 인공지능 기반
          서비스를 목표로 하지만, 성능만큼 운영 일관성과 안전성이 중요하다는 관점을 기준으로 정책을 운영합니다.
        </p>

        <h3>1. 서비스 목적과 범위</h3>
        <p>
          서비스는 다음 거래일 코스피 시초가 관련 참고 정보를 제공하는 데이터 플랫폼입니다. 제공 범위에는 시장 지표,
          모델 예측값, 예측 밴드, 최근 실측 기록, 상태 안내 문구가 포함됩니다. 본 서비스는 투자정보 제공을 목적으로 하며
          금융투자상품에 대한 직접 자문, 수익 보장, 주문 대행 기능은 제공하지 않습니다.
        </p>

        <h3>2. 운영시간 및 상태 표시 원칙</h3>
        <p>
          화면의 운영시간/운영상태 표시는 사용자의 상황 인지를 돕기 위한 안내 기능입니다. 운영시간 내에는 데이터 수집과
          반영 루프가 활성화되고, 운영시간 외에는 일부 항목이 직전 값 또는 장 시작 전 안내 상태로 표기될 수 있습니다.
          이는 오류가 아니라 데이터 출처의 제공 주기와 시장 구조를 반영한 정상 동작입니다. 사용자는 상태 문구를 확인해
          현재 데이터의 신뢰 구간을 판단해야 합니다.
        </p>

        <h3>3. 데이터 반영 정책</h3>
        <p>
          지표별 갱신 주기가 상이하므로 모든 카드가 동일 시점에 동시 갱신되지는 않습니다. 플랫폼은 주기적 동기화 로직을
          통해 최신 데이터를 반영하지만, 출처 서버 지연이나 네트워크 상태에 따라 반영 시차가 발생할 수 있습니다. 최종 투자
          판단 전에는 각 지표의 원출처 데이터를 교차 확인하는 것을 기본 원칙으로 권장합니다.
        </p>

        <h3>4. 예측모델 운용 정책</h3>
        <p>
          모델은 과거 데이터 학습 결과를 바탕으로 다음 거래일 시초가의 중심값과 범위를 산출합니다. 코어 지표와 보조 지표를
          구분해 입력하고, 과도한 상방/하방 편향을 억제하기 위한 안정화 규칙을 적용합니다. 재학습은 성능 지표와 운영 안정성을
          함께 고려해 수행하며, 단기 결과만으로 파라미터를 급격히 변경하지 않습니다. 이는 모델의 장기 일관성을 유지하기 위한
          운영 방침입니다.
        </p>

        <h3>5. 품질관리 및 검증</h3>
        <p>
          반영 데이터는 배포 전후로 무결성 점검을 수행합니다. 핵심 점검 항목은 필수 필드 존재 여부, 시간 정합성, 값 범위
          이상치, 화면 렌더링 정상 여부입니다. 이상이 발견되면 임시 보수 모드로 전환하거나 보수적 안내 문구를 표시해 사용자
          오해를 줄입니다. 문제 해결 후에는 재검증을 거쳐 정상 모드로 복귀합니다.
        </p>

        <h3>6. 장애 대응 정책</h3>
        <p>
          서비스 중단 또는 데이터 왜곡 가능성이 있는 장애는 최우선 대응 대상입니다. 대응 절차는 탐지, 영향 범위 파악, 임시
          완화 조치, 원인 제거, 재발 방지 반영의 순서로 진행됩니다. 필요 시 워크플로 재실행, 키 재발급, 시크릿 갱신, 배포
          재검증 등의 조치를 수행합니다. 사용자가 인지할 수 있도록 상태 문구 또는 공지로 상황을 안내합니다.
        </p>

        <h3>7. 보안 및 비밀정보 관리</h3>
        <p>
          서비스 계정 키, API 토큰 등 민감정보는 저장소에 평문 저장하지 않고 시크릿 관리 체계를 사용합니다. 노출 징후가
          확인되면 즉시 폐기 및 재발급(rotate)하고, 연관 워크플로와 배포 권한을 재검증합니다. 또한 비정상 트래픽 차단,
          보안 헤더 적용, 도메인 정규화 정책을 통해 서비스 안정성을 유지합니다.
        </p>

        <h3>8. 책임범위 및 면책</h3>
        <p>
          본 서비스는 정보 제공 도구이며 투자 의사결정의 최종 책임은 사용자에게 있습니다. 예측값은 통계적 추정치이므로
          실제 시장 결과와 다를 수 있으며, 외부 이벤트로 정확도가 일시적으로 저하될 수 있습니다. 운영자는 서비스 품질 향상을
          위해 노력하지만, 사용자 개별 손익에 대한 법적 책임을 보장하지 않습니다.
        </p>
      </main>
    </div>
  );
}

