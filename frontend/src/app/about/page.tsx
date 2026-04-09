import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const ABOUT_TITLE = "모델 설명";
const ABOUT_DESCRIPTION =
  "KOSPI Dawn 예측모델의 구조, 데이터 처리 방식, 검증 원칙, 운영 철학을 안내합니다.";

export const metadata: Metadata = {
  title: ABOUT_TITLE,
  description: ABOUT_DESCRIPTION,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: `${ABOUT_TITLE} | ${SITE_NAME}`,
    description: ABOUT_DESCRIPTION,
    url: toAbsoluteUrl("/about"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${ABOUT_TITLE} | ${SITE_NAME}`,
    description: ABOUT_DESCRIPTION,
  },
};

export default async function AboutPage() {
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
        <h2 className="sectionTitle">KOSPI Dawn 예측모델 안내</h2>
        <p>
          KOSPI Dawn은 다음 거래일 코스피 시초가를 확률적으로 추정하는 예측 플랫폼입니다. 단순한 숫자 제공을 넘어서
          시장 지표의 맥락과 모델 판단 근거를 함께 전달하는 것을 핵심 목표로 삼고 있습니다. 이 서비스는 매우 우수한
          인공지능 기반 서비스로 성장하기 위해, 모델 성능 개선과 운영 안정성을 동시에 관리하는 구조를 유지합니다.
          즉, 예측이 좋아도 운영이 불안하면 실제 가치가 떨어지고, 운영이 안정적이어도 모델 품질이 낮으면 의사결정
          도구로서 의미가 줄어든다는 점을 전제로 제품을 설계했습니다.
        </p>

        <h3>1. 모델 구조와 학습 방식</h3>
        <p>
          예측엔진은 비선형 관계를 처리할 수 있는 머신러닝 기반 접근을 사용합니다. 시장 데이터는 선형적으로 반응하지
          않고, 같은 신호도 변동성 구간에 따라 영향력이 달라지는 특성이 있기 때문입니다. 모델은 과거 구간에서
          입력지표와 시초가의 관계를 학습한 뒤 현재 입력값을 바탕으로 중심 예측값과 예측 범위를 동시에 생성합니다.
          중심값은 방향성을 보여주고, 범위는 불확실성의 크기를 표현합니다. 이중 출력 구조는 사용자가 숫자를 단정적
          결과로 오해하지 않도록 하는 안전장치이며, 실제 트레이딩 환경에서 더 현실적인 판단 프레임을 제공합니다.
        </p>

        <h3>2. 데이터 파이프라인과 전처리 원칙</h3>
        <p>
          입력 데이터는 해외지수, 환율, 변동성 지표, 원자재 성격 지표, 한국 관련 ETF 흐름 등으로 구성됩니다. 수집된
          데이터는 즉시 학습에 투입되지 않고, 시간 정렬, 결측치 처리, 이상치 탐지, 중복 레코드 제거, 값 스케일 안정화
          단계를 거칩니다. 이 과정은 모델 성능보다 더 중요할 때가 많습니다. 전처리가 불안하면 학습 결과가 좋아 보여도
          실전에서 쉽게 무너질 수 있기 때문입니다. KOSPI Dawn은 데이터 품질을 1차 성능 지표로 보고, 수치 정확도 이전에
          입력 신뢰도 관리 체계를 유지합니다.
        </p>

        <h3>3. 코어 신호와 보조 신호의 분리</h3>
        <p>
          모든 지표를 동일 가중치로 쓰면 과적합 위험이 커집니다. 그래서 모델은 코어 신호와 보조 신호를 구분해 사용합니다.
          코어 신호는 방향성 판단의 중심축을 담당하고, 보조 신호는 레짐 변화나 과열·과매도 상태를 조정하는 역할을 합니다.
          신호가 서로 충돌하는 경우에는 강한 단정 대신 보수적 밴드를 우선시하여 과도한 상방/하방 추정을 줄입니다. 이
          설계는 특정 날에 크게 맞추는 모델보다, 장기적으로 흔들림이 덜한 모델을 만들기 위한 선택입니다.
        </p>

        <h3>4. 검증 기준과 운영 철학</h3>
        <p>
          모델은 단일 적중률만으로 평가하지 않습니다. 최근 오차 추세, 변동성 확대 구간 성능, 극단 구간 오차 분포,
          예측 밴드의 안정성 등을 함께 점검합니다. 또한 배포 후에는 데이터 갱신, 산출물 반영, 화면 동기화가 실제로
          정상 동작하는지 운영 관점 검증을 병행합니다. 예측 알고리즘이 아무리 좋아도 사용자가 접속했을 때 값이 멈춰
          있으면 제품 가치는 0에 가깝습니다. 그래서 KOSPI Dawn은 "정확한 모델"과 "지속 가능한 운영"을 같은 우선순위로
          관리하는 것을 제품 원칙으로 채택하고 있습니다.
        </p>

        <h3>5. 활용 가이드와 한계</h3>
        <p>
          본 서비스의 예측값은 투자 판단 보조자료이며 매수·매도 권유가 아닙니다. 사용자는 예측 중심값만 보지 말고 밴드
          폭, 지표 합의도, 당일 이벤트 리스크를 함께 확인해야 합니다. 특히 장 시작 직전 뉴스, 정책 이슈, 지정학 변수는
          모델 입력에 충분히 반영되지 않을 수 있습니다. 따라서 실제 의사결정 전에는 원출처 데이터와 체결 환경을 반드시
          교차 확인하시기 바랍니다. KOSPI Dawn은 미래를 단정하는 도구가 아니라, 불확실성을 더 잘 관리하도록 돕는 도구입니다.
        </p>
      </main>
    </div>
  );
}

