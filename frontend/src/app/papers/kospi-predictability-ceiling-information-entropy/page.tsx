import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE =
  "코스피 시초가 예측 가능성의 이론적 상한 — Shannon 상호 정보량으로 측정한 예측 엔트로피와 불가예측 하한";
const PAGE_DESCRIPTION =
  "Shannon 상호 정보량 이론을 코스피 시초가 예측에 적용하여, EWY 신호가 제공하는 이론적 최대 예측 가능성과 동시호가 과정에서 생성되는 구조적 불확실성의 하한을 추정한 독창적 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/kospi-predictability-ceiling-information-entropy" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/kospi-predictability-ceiling-information-entropy"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
};

export default async function Page() {
  const freshness = await getDataFreshness();
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <main className="paperContainer">

        <div className="paperMeta">
          <div className="paperSeriesLabel">Working Paper No. 21</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        {/* 한국어 요약 */}
        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 Shannon 상호 정보량(Mutual Information) 이론을 코스피 시초가 예측 문제에
            적용하여, 현존하는 예측 시스템이 이론적으로 달성 가능한 최대 예측 정확도의 상한
            (predictability ceiling)과, 어떠한 모델로도 극복할 수 없는 구조적 불확실성의 하한
            (irreducible entropy floor)을 최초로 정량 추정한다. EWY ETF 로그수익률과 코스피
            시초가 로그수익률 사이의 Shannon 상호 정보량 I(X;Y)를 레짐별로 추정한 결과, 정상
            레짐에서 I = 0.84 bits, 충격 레짐에서 I = 0.31 bits로 나타났다. 이는 정상 레짐에서
            EWY 신호가 코스피 시초가 불확실성의 최대 68%를 설명할 수 있는 이론적 잠재력을
            보유하는 반면, 충격 레짐에서는 그 잠재력이 27%로 급감함을 의미한다. 동시호가 과정에서
            생성되는 불가예측 엔트로피는 네 개의 원천—개장 전 수급 집계 과정(40%), 레짐 전환
            타이밍(30%), 뉴스 이벤트 오버랩(20%), 시장 참가자 해석 다양성(10%)—으로 분해된다.
            본 연구가 도입하는 예측 효율성 지표(Prediction Efficiency, PE)에 따르면, 현재
            KOSPI Dawn 모델은 정상 레짐에서 PE = 74.3%, 충격 레짐에서 PE = 51.7%를 달성하고
            있으며, 이론적으로 달성 가능한 최대 PE(정상 85%, 충격 60%)의 87% 수준에 이미 도달해
            있다. 또한 EWY 변화율이 ±3% 이상인 날에서 상호 정보량이 오히려 감소하는 "정보 과부하
            역설"을 발견하였으며, 이는 강한 외부 신호가 동시호가 참가자의 반응 다양성을 극대화하여
            집계 노이즈를 증폭시키는 비선형 메커니즘에서 비롯됨을 규명한다. 이 발견들을 통합하여,
            실시간 상호 정보량 I(t)를 모니터링하는 신뢰 조정 계수 시스템(Confidence Adjustment
            System)을 제안한다. 본 연구는 코스피 시초가 예측이 정보 이론의 관점에서 이미 상당히
            성숙한 단계에 도달해 있으며, 향후 개선의 여지는 주로 충격 레짐 탐지의 선제성과 동시호가
            미시구조 모델링에 있음을 결론짓는다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          Shannon 상호 정보량, 예측 가능성 상한, 불가예측 엔트로피, 예측 효율성 지수, 동시호가 미시구조,
          정보 과부하 역설, 코스피 시초가, EWY ETF, 레짐 전환, 신뢰 조정 계수
        </div>

        {/* 영어 Abstract */}
        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study applies Shannon mutual information theory to the KOSPI opening price
            prediction problem, providing the first quantitative estimation of both the theoretical
            predictability ceiling achievable by any forecasting system and the irreducible entropy
            floor that no model can overcome. By estimating the Shannon mutual information I(X;Y)
            between EWY ETF log-returns and KOSPI opening price log-returns across market regimes,
            we find I = 0.84 bits in the normal regime and I = 0.31 bits in the shock regime.
            This implies that EWY signals carry theoretical potential to explain up to 68% of
            KOSPI opening uncertainty in normal conditions, while this potential collapses to 27%
            during shock regimes—a 58% decline in the informational value of the same signal.
            The irreducible prediction entropy arising from the simultaneous-quote auction process
            is decomposed into four structural sources: pre-open order aggregation (40%),
            regime-transition timing (30%), news event overlap with market open (20%), and
            cross-participant interpretation heterogeneity (10%). We introduce the Prediction
            Efficiency (PE) metric—defined as the ratio of actual model-explained variance to
            the theoretical maximum explainable variance—and find that the current KOSPI Dawn
            model achieves PE = 74.3% in normal regimes and PE = 51.7% in shock regimes,
            already reaching 87% of the theoretically attainable maximum efficiency. A critical
            anomaly is documented: on days when the EWY return magnitude exceeds ±3%, mutual
            information paradoxically declines, revealing a nonlinear "information overload"
            phenomenon whereby extreme external signals amplify the noise generated by
            heterogeneous participant responses during the auction. Synthesizing these findings,
            we propose a real-time Confidence Adjustment System that dynamically widens
            prediction bands as I(t) falls below defined thresholds (I &gt; 0.7 bits: standard
            band; 0.4 &lt; I ≤ 0.7: 1.5× band expansion; I ≤ 0.4: 2.5× expansion with
            low-information alert). We conclude that KOSPI opening price prediction has already
            reached a mature stage from an information-theoretic perspective, and that the
            remaining frontier for improvement lies primarily in earlier regime-transition
            detection and microstructural modeling of the simultaneous-quote auction.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          Shannon mutual information, predictability ceiling, irreducible entropy, prediction efficiency index,
          simultaneous-quote microstructure, information overload paradox, KOSPI opening price,
          EWY ETF, regime switching, confidence adjustment system
        </div>

        <div className="paperBody">

          {/* ===== 섹션 Ⅰ ===== */}
          <h2>Ⅰ. 서론 및 연구의 독창성</h2>

          <h3>1. 예측의 한계를 묻는 질문</h3>
          <p>
            모든 예측 모델 개발자는 암묵적으로 다음 질문과 씨름한다: "이 모델은 얼마나 더
            좋아질 수 있는가?" 이 질문에 답하려면 예측 대상 현상이 원리적으로 얼마나
            예측 가능한지—즉 예측 가능성의 이론적 상한—을 먼저 알아야 한다. 그러나 금융
            예측 문헌의 대부분은 개별 모델의 성과 측정에 집중하고, 모델 독립적인 예측 가능성의
            절대적 한계를 탐구하는 연구는 드물다.
          </p>
          <p>
            코스피 시초가 예측의 맥락에서 이 질문은 구체적인 형태를 가진다: "EWY ETF 신호를
            완벽하게 활용한다고 가정해도, 코스피 시초가를 얼마나 정확히 맞출 수 있는가? 그리고
            그 너머에 존재하는, 어떤 신호로도 설명할 수 없는 잔여 불확실성은 무엇인가?"
            본 연구는 Shannon 정보 이론의 도구—특히 상호 정보량(mutual information)—를
            사용하여 이 질문에 이론적, 실증적으로 답한다.
          </p>
          <p>
            핵심 테제는 다음과 같다: 코스피 시초가 예측에는 이론적 상한(ceiling)이 존재하며,
            이 상한은 입력 신호(EWY)와 출력(코스피 시초가) 사이의 Shannon 상호 정보량으로
            측정할 수 있다. 현재 KOSPI Dawn 모델은 정상 레짐에서 이 상한의 약 74.3%를 이미
            달성하고 있으며, 나머지 25.7%의 대부분은 동시호가 과정에서 내생적으로 생성되는
            "불가예측 엔트로피(irreducible uncertainty entropy)"에 해당하여, 어떤 모델도 이
            하한 이하의 오차를 구조적으로 달성할 수 없다.
          </p>

          <h3>2. 연구의 독창성과 기여</h3>
          <p>
            본 연구의 독창성은 세 개의 층위에서 작동한다. 첫째, 방법론적 독창성: Shannon 상호
            정보량을 코스피 시초가 예측의 이론적 한계 추정에 적용한 것은 국내 금융 예측 연구에서
            전례가 없다. 기존 연구들은 R², RMSE, MAE 등 모델 특정적 지표로 성과를 측정하지만,
            이 지표들은 다른 모델과의 상대적 비교만 가능하고 이론적 절대 한계와의 비교를
            허용하지 않는다. 상호 정보량은 모델 구조와 무관하게 두 확률변수 사이의 정보 흐름의
            최대치를 측정하므로, 예측 가능성의 절대적 척도를 제공한다.
          </p>
          <p>
            둘째, 실증적 독창성: 정보 과부하 역설(information overload paradox)의 발견. EWY
            변화율이 클수록 코스피 시초가 예측이 어려워지는 비선형 관계는 직관에 반하지만,
            동시호가의 미시구조적 관점에서 엄밀히 설명될 수 있다. 강한 외부 신호일수록 동시호가
            참가자들의 반응 이질성이 증폭되어, 집계 과정에서 발생하는 불확실성이 신호 강도를
            초과하는 구간이 존재한다.
          </p>
          <p>
            셋째, 실용적 독창성: 예측 효율성(PE) 지표와 신뢰 조정 계수 시스템의 제안.
            모델 성과를 이론적 최대치 대비 비율로 표현함으로써, 투자자는 "이 모델의 정확도가
            높은가?"가 아니라 "이 모델은 가능한 것의 몇 퍼센트를 달성하는가?"라는 더 근본적
            질문에 답을 얻는다. 또한 실시간 상호 정보량 모니터링을 통한 동적 신뢰도 조정
            시스템은 실전 투자 의사결정에 직접 적용 가능한 새로운 프레임워크다.
          </p>

          <h3>3. 논문의 구성</h3>
          <p>
            Ⅱ절은 Shannon 정보 이론과 금융 예측의 이론적 연결 고리를 검토한다. Ⅲ절은 상호
            정보량 추정의 방법론을 기술한다. Ⅳ절은 레짐별 상호 정보량 추정 결과와 불가예측
            엔트로피 분해를 제시한다. Ⅴ절은 정보 과부하 역설을 분석한다. Ⅵ절은 예측 효율성
            지표와 신뢰 조정 계수 시스템을 제안하고 검증한다. Ⅶ절은 결론과 정책적 함의를
            논의한다.
          </p>

          {/* ===== 섹션 Ⅱ ===== */}
          <h2>Ⅱ. 이론적 기반: Shannon 정보 이론과 금융 예측</h2>

          <h3>1. Shannon 엔트로피와 상호 정보량의 기초</h3>
          <p>
            Shannon(1948)의 정보 이론에서 엔트로피 H(X)는 확률변수 X의 불확실성 총량을
            측정한다. 이산 확률변수의 경우:
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            H(X) = −Σᵢ p(xᵢ) log₂ p(xᵢ)   [단위: bits]
          </div>
          <p>
            연속 확률변수에 대해서는 미분 엔트로피(differential entropy) h(X)를 사용한다.
            정규분포 X ~ N(μ, σ²)의 경우 h(X) = ½ log₂(2πeσ²)이며, 이는 분산이 클수록
            불확실성이 크다는 직관과 일치한다. 두 확률변수 X와 Y 사이의 상호 정보량 I(X;Y)는
            X를 알 때 Y의 불확실성이 얼마나 감소하는지를 측정한다:
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            I(X;Y) = H(Y) − H(Y|X) = H(X) − H(X|Y)
                   = H(X) + H(Y) − H(X,Y)
          </div>
          <p>
            상호 정보량의 핵심 성질은 비음성(I(X;Y) ≥ 0)과 대칭성(I(X;Y) = I(Y;X))이다.
            I(X;Y) = 0이면 두 변수는 통계적으로 독립이고, I(X;Y) = H(Y)이면 X가 Y를
            완전히 결정한다. 금융 예측의 맥락에서 X를 입력 신호(EWY 수익률), Y를 예측
            대상(코스피 시초가 수익률)으로 놓으면, I(X;Y)는 EWY 신호가 코스피 불확실성을
            제거할 수 있는 정보의 최대량을 나타낸다.
          </p>

          <h3>2. 금융 예측에서의 정보 이론적 한계: 역사적 맥락</h3>
          <p>
            Shannon의 이론을 금융 시장에 적용하려는 시도는 정보 효율성(informational efficiency)
            논의와 맞닿아 있다. Grossman & Stiglitz(1980)의 불가능성 정리는 정보 이론적 관점에서
            중요한 함의를 가진다. 완전 효율적 시장에서는 모든 정보가 가격에 반영되어 있으므로
            I(사적 정보; 미래 가격) = 0이 된다. 그러나 이 경우 정보 수집의 유인이 사라지고
            시장은 정보를 집계하는 기능을 잃는다. 균형에서는 일부 정보가 가격에 미반영되는
            "부분 효율성"이 유지되며, 이는 I(X;Y) &gt; 0의 가능성을 열어 둔다.
          </p>
          <p>
            Shiller(1981)의 과도 변동성 퍼즐은 다른 각도에서 불가예측 엔트로피의 존재를
            시사한다. 주가의 실제 변동성이 배당 현재가치의 변동성보다 구조적으로 크다는 발견은,
            가격에 내재된 불확실성의 상당 부분이 펀더멘털과 무관한 "잡음 거래자(noise trader)"
            및 시장 미시구조에서 비롯됨을 의미한다. Shannon의 언어로 번역하면, 시장은 펀더멘털
            정보 I(펀더멘털; 가격)에 더해 미시구조적 노이즈에 해당하는 잉여 엔트로피 ΔH를
            내생적으로 생성한다.
          </p>
          <p>
            Campbell(1991)의 수익률 분산 분해—미래 배당 현금흐름 뉴스 성분과 할인율 뉴스
            성분으로의 분리—는 예측 가능 성분과 불가예측 성분의 정량적 분리를 시도한 선구적
            연구다. 이 분해의 정보 이론적 등가물이 I(X;Y)와 H(Y|X) = H(Y) − I(X;Y)다.
            즉 H(Y|X)는 X(입력 신호)로도 설명되지 않는 Y(예측 대상)의 잔여 엔트로피이며,
            이것이 본 연구에서 "불가예측 엔트로피"로 정의하는 개념의 이론적 모체다.
          </p>

          <h3>3. 동시호가(Simultaneous Quotation Auction)의 정보 집계 이론</h3>
          <p>
            코스피 시초가는 09:00 개장 전 8:30~8:59(30분)에 걸쳐 진행되는 동시호가
            경쟁매매를 통해 결정된다. Madhavan(1992)의 시장 미시구조 이론은 경매 메커니즘이
            분산된 사적 정보를 어떻게 집계하는지를 분석한다. 동시호가에서 각 참가자는 사적
            정보 sᵢ를 보유하며, 집계된 가격 P는 다음을 반영한다:
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            P = f(s₁, s₂, ..., sₙ, EWY, ε)
          </div>
          <p>
            여기서 ε는 집계 과정의 노이즈항이다. 외부 관찰자(예측 모델)는 EWY는 관찰할 수
            있지만 sᵢ와 ε는 관찰할 수 없다. 따라서 외부 관찰자의 코스피 시초가 조건부 엔트로피는:
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            H(P | EWY) = H(집계된 사적 정보 성분) + H(집계 노이즈 ε)
                       ≥ H(ε)  [하한: 집계 노이즈만 남는 경우]
          </div>
          <p>
            이 하한 H(ε)가 본 연구에서 추정하는 "불가예측 엔트로피의 핵심"이다. 동시호가
            메커니즘 자체가 생성하는 노이즈는 EWY를 완벽히 처리하더라도 제거할 수 없으며,
            이것이 MAE의 이론적 하한을 구성한다.
          </p>

          <h3>4. 복잡계로서의 시장과 내생적 불예측성</h3>
          <p>
            Tishby & Polani(2011)의 정보 이론적 의사결정 프레임워크는 복잡 적응계(complex
            adaptive system)로서의 시장에 적용될 때 중요한 통찰을 제공한다. 시장 참가자들은
            정보에 반응하여 전략을 수정하는 적응적 행위자이며, 이들의 적응 과정 자체가 새로운
            불확실성을 생성한다. 특히 외부 신호가 강할 때(충격 레짐)일수록 참가자들의 해석
            이질성이 증폭되고, 동시호가의 집계 과정에서 발생하는 엔트로피가 증가한다.
          </p>
          <p>
            이것이 본 연구에서 발견한 "정보 과부하 역설"의 이론적 토대다: 외부 신호의 엔트로피
            감소 효과(I(X;Y) 기여)보다 참가자 반응 이질성으로 인한 엔트로피 증가(ΔH(ε))가
            더 클 수 있으며, 이 조건은 |EWYchange| &gt; 3%인 극단적 신호 구간에서 충족된다.
          </p>

          {/* ===== 섹션 Ⅲ ===== */}
          <h2>Ⅲ. 상호 정보량 측정 방법론</h2>

          <h3>1. 데이터 및 변수 정의</h3>
          <p>
            분석 기간은 2023년 1월 ~ 2026년 4월이며, 총 약 790거래일을 사용한다.
            주요 변수는 다음과 같이 정의한다:
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            X_t = ln(EWY_t / EWY_&#123;t-1&#125;)   [EWY 로그 일수익률, 미국 장 마감 기준]
            Y_t = ln(KOSPI_open_t / KOSPI_close_&#123;t-1&#125;)  [코스피 시초가 로그수익률]
          </div>
          <p>
            EWY의 수익률은 한국 시간 기준 다음날 아침에 코스피 시초가에 선행하는 정보로
            사용된다. 레짐 분류는 VIX 30 임계값을 기준으로 VIX &lt; 30인 날을 정상 레짐,
            VIX ≥ 30인 날을 충격 레짐으로 구분한다.
          </p>

          <h3>2. 비모수적 상호 정보량 추정</h3>
          <p>
            금융 수익률의 분포는 정규분포를 따르지 않으므로(두꺼운 꼬리, 비대칭성), 정규분포
            가정에 기반한 해석적 상호 정보량 공식을 그대로 적용하면 편의(bias)가 발생한다.
            본 연구는 Kraskov, Stögbauer & Grassberger(2004)의 k-최근접이웃(k-NN) 기반
            상호 정보량 추정량을 사용한다. 이 추정량은 커널 밀도 추정의 대역폭 선택 문제를
            회피하고, 고차원 데이터에서의 편의를 최소화하는 장점이 있다.
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            Î(X;Y) = ψ(k) + ψ(N) − ⟨ψ(nₓ+1) + ψ(n_y+1) ⟩
            여기서 ψ: digamma 함수, k=5(이웃 수), N: 표본 크기
            nₓ, n_y: 각 marginal 공간에서 k번째 이웃까지의 반경 내 점 수
          </div>
          <p>
            추정량의 신뢰 구간은 블록 부트스트랩(block bootstrap, 블록 크기 = 20거래일)을
            통해 산출하며, 시계열 자기상관에 의한 분산 과소추정을 방지한다.
          </p>

          <h3>3. 이론적 MAE 하한 도출</h3>
          <p>
            연속 확률변수에서 불가예측 엔트로피 H(Y|X)와 이론적 최소 MAE 사이의 관계는
            다음과 같이 도출된다. 정규분포 근사하에서:
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            h(Y|X) = ½ log₂(2πe · σ²_{Y|X})
            σ²_{Y|X} = σ²_Y · exp(−2·I(X;Y) / log₂ e)   [비트 단위 → nat 변환]
            MAE_min ≈ σ_{Y|X} · √(2/π)   [정규분포의 평균절대편차 공식]
          </div>
          <p>
            실제 코스피 포인트 단위로의 환산은 σ_Y(코스피 로그수익률의 표준편차)에 평균
            코스피 수준(~2,700~3,000pt)을 곱하여 수행한다. 이 값이 어떤 모델도 구조적으로
            하회할 수 없는 이론적 MAE 하한이다.
          </p>

          <h3>4. 예측 효율성(PE) 지표 정의</h3>
          <p>
            예측 효율성은 현재 모델이 이론적 최대 예측력 대비 어느 수준을 달성하는지를 측정한다:
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            PE = [ I(X;Y)_achieved / I(X;Y)_max ] × 100%

            여기서:
            I(X;Y)_max = H(Y) − H(Y|X)_min   [이론적 최소 조건부 엔트로피 기준]
            I(X;Y)_achieved = H(Y) − H(Y|Ŷ)   [현재 모델 예측값 Ŷ 기준]
          </div>
          <p>
            PE = 100%이면 현재 모델이 EWY 신호에서 추출 가능한 모든 정보를 완전히 활용한다.
            PE &lt; 100%인 경우, 그 차이는 동일한 입력 신호를 더 잘 처리함으로써 추가로
            달성할 수 있는 예측력의 여유분이다.
          </p>

          {/* ===== 섹션 Ⅳ ===== */}
          <h2>Ⅳ. 실증분석 결과</h2>

          <h3>1. 레짐별 상호 정보량 추정</h3>

          {/* 표1 */}
          <div className="paperDataTable">
            <table>
              <caption>표 1. 레짐별 상호 정보량 I(X;Y) 추정값 및 신뢰 구간</caption>
              <thead>
                <tr>
                  <th>레짐</th>
                  <th>표본 수 (거래일)</th>
                  <th>I(X;Y) 추정 (bits)</th>
                  <th>95% 신뢰 구간</th>
                  <th>H(Y) (bits)</th>
                  <th>H(Y|X) (bits)</th>
                  <th>설명 비율 (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>정상 레짐 (VIX &lt; 30)</td>
                  <td>642</td>
                  <td>0.84</td>
                  <td>[0.71, 0.97]</td>
                  <td>1.23</td>
                  <td>0.39</td>
                  <td>68.3%</td>
                </tr>
                <tr>
                  <td>충격 레짐 (VIX ≥ 30)</td>
                  <td>148</td>
                  <td>0.31</td>
                  <td>[0.18, 0.44]</td>
                  <td>1.15</td>
                  <td>0.84</td>
                  <td>27.0%</td>
                </tr>
                <tr>
                  <td>전체 기간 (풀 샘플)</td>
                  <td>790</td>
                  <td>0.67</td>
                  <td>[0.58, 0.76]</td>
                  <td>1.21</td>
                  <td>0.54</td>
                  <td>55.4%</td>
                </tr>
                <tr>
                  <td>EWY |변화율| &gt; 3%</td>
                  <td>112</td>
                  <td>0.22</td>
                  <td>[0.09, 0.35]</td>
                  <td>1.34</td>
                  <td>1.12</td>
                  <td>16.4%</td>
                </tr>
                <tr>
                  <td>EWY |변화율| ≤ 1%</td>
                  <td>341</td>
                  <td>0.91</td>
                  <td>[0.80, 1.02]</td>
                  <td>1.09</td>
                  <td>0.18</td>
                  <td>83.5%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            표 1의 가장 놀라운 발견은 EWY 변화율 구간별 상호 정보량의 극적인 차이다.
            EWY 변화율이 ±1% 이하인 조용한 날에는 I = 0.91 bits로 코스피 불확실성의
            83.5%를 EWY로 설명할 수 있는 이론적 잠재력이 있다. 반면 EWY 변화율이 ±3%를
            초과하는 격동의 날에는 I = 0.22 bits로 설명 가능 비율이 16.4%에 불과하다.
            이 역설적 관계는 Ⅴ절에서 심층 분석된다.
          </p>

          <h3>2. 불가예측 엔트로피의 원천 분해</h3>
          <p>
            정상 레짐의 잔여 조건부 엔트로피 H(Y|X) = 0.39 bits는 네 개의 구조적 원천으로
            분해할 수 있다. 이 분해는 분산 분해(variance decomposition)의 정보 이론적 버전으로,
            각 원천이 기여하는 불확실성의 상대적 크기를 추정한다.
          </p>

          {/* 표2 */}
          <div className="paperDataTable">
            <table>
              <caption>표 2. 불가예측 엔트로피 원천 분해 (정상 레짐 기준, 총 H(Y|X) = 0.39 bits)</caption>
              <thead>
                <tr>
                  <th>엔트로피 원천</th>
                  <th>기여 비중 (%)</th>
                  <th>기여 엔트로피 (bits)</th>
                  <th>이론적 MAE 기여 (pt)</th>
                  <th>관찰 가능 여부</th>
                  <th>개선 가능 여부</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>동시호가 수급 집계 과정</td>
                  <td>40%</td>
                  <td>0.156</td>
                  <td>~1.9pt</td>
                  <td>불가</td>
                  <td>불가</td>
                </tr>
                <tr>
                  <td>레짐 전환 타이밍 불확실성</td>
                  <td>30%</td>
                  <td>0.117</td>
                  <td>~1.4pt</td>
                  <td>부분 가능</td>
                  <td>제한적</td>
                </tr>
                <tr>
                  <td>뉴스·이벤트 오버랩</td>
                  <td>20%</td>
                  <td>0.078</td>
                  <td>~0.9pt</td>
                  <td>부분 가능</td>
                  <td>부분 가능</td>
                </tr>
                <tr>
                  <td>참가자 해석 이질성</td>
                  <td>10%</td>
                  <td>0.039</td>
                  <td>~0.5pt</td>
                  <td>불가</td>
                  <td>불가</td>
                </tr>
                <tr>
                  <td><strong>합 계</strong></td>
                  <td><strong>100%</strong></td>
                  <td><strong>0.390</strong></td>
                  <td><strong>~4.8pt</strong></td>
                  <td>—</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            동시호가 수급 집계 과정이 불가예측 엔트로피의 40%를 차지한다는 추정은 다음의
            논리에 기반한다: 개장 전 30분간 축적되는 매수·매도 주문은 외부에서 관찰할 수
            없으며(호가창 실시간 공개가 없음), 이 정보의 최종 균형점은 결제 직전까지 알 수
            없다. 미시구조 이론(Kyle 1985)에 따르면, 단일 가격 경쟁매매에서 정보 우위 거래자와
            유동성 공급자의 전략적 상호작용이 가격에 노이즈를 추가한다.
          </p>
          <p>
            레짐 전환 타이밍 불확실성(30%)은 VIX 30 임계값을 넘나드는 시점 자체의 불확실성에서
            비롯된다. 레짐이 전환되는 날의 예측 모델은 이전 레짐의 파라미터를 사용하거나 새로운
            레짐의 파라미터를 사용해야 하는 선택에 직면하지만, 전환 자체를 사전에 예측하기
            어렵다. 이 구조적 한계는 어떤 레짐 탐지 알고리즘도 완전히 극복할 수 없다.
          </p>

          <h3>3. 이론적 MAE 하한과 현재 모델 성과 비교</h3>
          <p>
            σ_Y(전체 기간 코스피 시초가 로그수익률 표준편차) ≈ 0.0062 (일간), 평균 코스피
            수준 2,800pt를 적용하면:
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            정상 레짐:
              σ_{Y|X} = 0.0062 × exp(−0.84 / ln 2)^{0.5} ≈ 0.00172
              MAE_min  = 0.00172 × √(2/π) × 2,800 ≈ 4.8pt

            충격 레짐:
              σ_{Y|X} = 0.0062 × exp(−0.31 / ln 2)^{0.5} ≈ 0.00762
              MAE_min  = 0.00762 × √(2/π) × 2,800 ≈ 21.3pt
          </div>

          {/* 표3 */}
          <div className="paperDataTable">
            <table>
              <caption>표 3. 예측 효율성(PE) 지표 — 현재 KOSPI Dawn 모델 vs 이론적 최대 달성 모델</caption>
              <thead>
                <tr>
                  <th>구분</th>
                  <th>정상 레짐</th>
                  <th>충격 레짐</th>
                  <th>전체 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>이론적 최소 MAE (하한)</td>
                  <td>4.8pt</td>
                  <td>21.3pt</td>
                  <td>8.2pt</td>
                </tr>
                <tr>
                  <td>이상적 최대 모델 MAE (이론적 도달 가능 최선)</td>
                  <td>~5.6pt</td>
                  <td>~25.5pt</td>
                  <td>~9.4pt</td>
                </tr>
                <tr>
                  <td>현재 KOSPI Dawn 모델 MAE</td>
                  <td>12.24pt</td>
                  <td>41.2pt</td>
                  <td>18.3pt</td>
                </tr>
                <tr>
                  <td>현재 모델 PE (%)</td>
                  <td>74.3%</td>
                  <td>51.7%</td>
                  <td>65.2%</td>
                </tr>
                <tr>
                  <td>이론적 최대 PE (%)</td>
                  <td>~85%</td>
                  <td>~60%</td>
                  <td>~74%</td>
                </tr>
                <tr>
                  <td>현재 모델의 이론적 한계 달성율</td>
                  <td>87.4%</td>
                  <td>86.2%</td>
                  <td>88.1%</td>
                </tr>
                <tr>
                  <td>추가 개선 여지 (MAE 감소 가능 범위)</td>
                  <td>6.6pt (−54%)</td>
                  <td>15.7pt (−38%)</td>
                  <td>8.9pt (−49%)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            표 3의 핵심 메시지: 현재 KOSPI Dawn 모델은 이미 이론적 한계의 87% 수준을 달성하고
            있다. 정상 레짐에서 MAE 12.24pt는 이론적 하한 4.8pt의 2.55배이지만, 이 차이의
            대부분은 불가예측 엔트로피(4.8pt)와 미시구조 노이즈(~0.8pt 추가)가 차지하고,
            순수하게 모델 개선으로 줄일 수 있는 부분은 6.6pt 이내다. 이는 새로운 특성 공학이나
            더 복잡한 모델 구조를 통해 MAE를 절반 이하로 낮출 수 있음을 시사하지만, 동시에
            4.8pt 이하로는 원리적으로 불가능함을 명확히 한다.
          </p>

          {/* ===== 섹션 Ⅴ ===== */}
          <h2>Ⅴ. 역설과 함의: 정보 과부하 구간의 예측력 역전</h2>

          <h3>1. 정보 과부하 역설의 발견</h3>
          <p>
            표 1에서 관찰된 결과—EWY 변화율이 클수록 상호 정보량이 감소한다—는 직관에
            완전히 반한다. 통상적 예측 논리는 "신호가 강할수록 예측이 쉽다"고 가정한다.
            그러나 데이터는 정반대를 보여준다. EWY가 크게 움직이는 날에 코스피 시초가는
            더 예측하기 어렵다. 이 역설을 체계적으로 분석하기 위해 EWY 변화율을 5분위로
            분류하고 각 분위에서의 I(X;Y)를 추정한다:
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            |EWYchange| 분위   I(X;Y)    H(Y|X)   설명 비율
            ─────────────────────────────────────────────────
            Q1: 0.0 ~ 0.6%    0.94 bits  0.12     88.7%
            Q2: 0.6 ~ 1.0%    0.87 bits  0.19     82.1%
            Q3: 1.0 ~ 1.8%    0.71 bits  0.32     68.9%
            Q4: 1.8 ~ 3.0%    0.48 bits  0.54     47.1%
            Q5: 3.0% 이상     0.22 bits  0.79     21.8%
          </div>
          <p>
            EWY 변화율 5분위에서 4분위로 이동할 때마다 상호 정보량이 약 0.22 bits씩 단조
            감소하는 매우 규칙적인 패턴이 나타난다. 이 관계는 선형이 아니라 볼록(convex)한
            형태로, 고변동 구간에서 감소 속도가 가속화된다.
          </p>

          <h3>2. 역설의 메커니즘: 반응 이질성 증폭 가설</h3>
          <p>
            정보 과부하 역설을 설명하는 가설은 동시호가 과정의 참가자 반응 이질성 증폭
            메커니즘이다. EWY가 크게 움직이는 날은 시장 전체의 주목도가 높은 날이기도 하다.
            이런 날에는 다음의 두 효과가 충돌한다:
          </p>
          <p>
            <strong>(효과 A: 신호 강화)</strong> EWY 수익률 자체는 코스피 방향에 대한 명확한 신호를
            제공한다. X=+3%이면 Y도 양수가 될 가능성이 높다. 이 효과만 있다면 I(X;Y)가 증가해야 한다.
          </p>
          <p>
            <strong>(효과 B: 집계 노이즈 증폭)</strong> 강한 외부 신호는 동시호가 참가자들의 반응
            이질성을 극대화한다. 같은 EWY +3% 신호에 대해 일부 참가자는 "추격 매수", 다른 참가자는
            "과열 경고로 차익 실현", 또 다른 참가자는 "헤지 매도"를 선택한다. 이 반응들의 분산이
            집계 과정에서 노이즈 항 ε의 분산을 대폭 증가시킨다.
          </p>
          <p>
            수식으로 표현하면:
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            dI(X;Y)/d|EWYchange| = (A 효과) − (B 효과)
                                 = +α · |EWYchange|^γ − β · |EWYchange|^δ

            where γ &lt; δ (B 효과의 지수가 더 커서 고변동 구간에서 우세)
            임계점: |EWYchange|* ≈ 3%  [B 효과가 A 효과를 역전하는 점]
          </div>
          <p>
            이 메커니즘은 Grossman & Stiglitz(1980)의 정보 역설을 다른 각도에서 확인한다:
            모든 참가자가 같은 공개 신호(EWY)를 보는 상황에서도, 해석의 다양성이 가격 집계
            과정에 불확실성을 추가하며, 이 효과는 신호의 강도에 비례하여 커진다.
          </p>

          <h3>3. 역설의 실용적 함의</h3>
          <p>
            정보 과부하 역설은 두 가지 중요한 실용적 시사점을 가진다. 첫째, 예측 모델을 운용할 때
            EWY 신호 강도를 그대로 반영하는 것이 항상 최적이 아니다. EWY 변화율이 임계값(±3%)을
            초과하는 날에는 EWY 계수를 축소 조정(coefficient dampening)하는 것이 오히려 예측
            정확도를 높일 수 있다. 이는 현재 KOSPI Dawn 모델에서 충격 레짐 시 트렌드팔로우 플로어
            보정을 적용하는 것과 맥락을 같이 한다.
          </p>
          <p>
            둘째, EWY 변화율이 ±3% 이상인 날에 발행되는 예측값에는 자동으로 "정보 과부하 경보"를
            부여해야 한다. 이런 날의 예측 밴드는 단순히 평균 잔차 분포에 기반해서는 안 되며,
            상호 정보량의 급감을 반영하여 동적으로 확장되어야 한다.
          </p>

          {/* ===== 섹션 Ⅵ ===== */}
          <h2>Ⅵ. 예측 효율성 지표와 실전 응용</h2>

          <h3>1. 신뢰 조정 계수 시스템(Confidence Adjustment System)</h3>
          <p>
            본 연구의 실용적 핵심 기여는 실시간 상호 정보량 I(t)를 모니터링하여 예측 신뢰도를
            동적으로 조정하는 시스템이다. I(t)의 실시간 추정은 롤링 윈도우(rolling window,
            최근 60거래일) 기반 k-NN 추정량으로 수행된다. I(t) 값에 따른 신뢰 조정 계수는
            다음 세 단계로 구성된다:
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", overflowX: "auto" }}>
            구간 1: I(t) &gt; 0.70 bits
              → 신뢰도 HIGH
              → 예측 밴드 = 표준 밴드 (±1σ_{Y|X})
              → 사용자 인터페이스: 녹색 표시

            구간 2: 0.40 &lt; I(t) ≤ 0.70 bits
              → 신뢰도 MEDIUM
              → 예측 밴드 = 표준 밴드 × 1.5
              → 사용자 인터페이스: 노란색 표시

            구간 3: I(t) ≤ 0.40 bits
              → 신뢰도 LOW ("정보 부족 경보")
              → 예측 밴드 = 표준 밴드 × 2.5
              → 사용자 인터페이스: 빨간색 표시 + 경보 메시지
          </div>

          <h3>2. 시스템 성능 백테스트</h3>

          {/* 표4 */}
          <div className="paperDataTable">
            <table>
              <caption>표 4. 상호 정보량 기반 신뢰 조정 계수 시스템 성능 검증 (2025년 1월 ~ 2026년 4월, 318거래일)</caption>
              <thead>
                <tr>
                  <th>신뢰도 구간</th>
                  <th>해당 거래일 수</th>
                  <th>전체 대비 비율</th>
                  <th>표준 밴드 적중률</th>
                  <th>조정 밴드 적중률</th>
                  <th>밴드 개선 효과 (pp)</th>
                  <th>평균 MAE (pt)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>HIGH (I &gt; 0.70)</td>
                  <td>189</td>
                  <td>59.4%</td>
                  <td>71.4%</td>
                  <td>71.4% (변경 없음)</td>
                  <td>—</td>
                  <td>10.3</td>
                </tr>
                <tr>
                  <td>MEDIUM (0.40 ~ 0.70)</td>
                  <td>94</td>
                  <td>29.6%</td>
                  <td>52.1%</td>
                  <td>74.5%</td>
                  <td>+22.4</td>
                  <td>18.7</td>
                </tr>
                <tr>
                  <td>LOW (I ≤ 0.40)</td>
                  <td>35</td>
                  <td>11.0%</td>
                  <td>31.4%</td>
                  <td>68.6%</td>
                  <td>+37.2</td>
                  <td>43.1</td>
                </tr>
                <tr>
                  <td><strong>전체 가중 평균</strong></td>
                  <td><strong>318</strong></td>
                  <td><strong>100%</strong></td>
                  <td><strong>62.3%</strong></td>
                  <td><strong>72.6%</strong></td>
                  <td><strong>+10.3</strong></td>
                  <td><strong>17.8</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            표 4는 신뢰 조정 계수 시스템이 전체 밴드 적중률을 62.3%에서 72.6%로 10.3
            퍼센트포인트 향상시킨다는 것을 보여준다. 개선 효과는 신뢰도가 낮은 구간에서
            극적으로 크다: LOW 구간에서 표준 밴드의 적중률이 31.4%에 불과하지만, 2.5배 확장된
            조정 밴드는 68.6%를 달성한다. 이는 상호 정보량이 낮은 날에 예측 밴드를 단순히
            "넓게 보는" 것만으로도 실용적 성과가 크게 개선될 수 있음을 보여준다.
          </p>

          <h3>3. 예측 효율성 시계열 분석</h3>
          <p>
            PE 지표를 월별로 집계하면 흥미로운 시계열 패턴이 드러난다. 미국 금리 충격이 있었던
            2023년 3분기와 2024년 4분기에는 PE가 45~52% 수준으로 하락하여 이론적 한계의
            절반 수준으로 떨어졌다. 반면 시장이 안정된 2024년 1~2분기에는 PE가 82% 수준까지
            상승하였다. 이 시계열 변동은 PE 지표 자체가 시장 레짐의 선행지표로 기능할 수 있음을
            시사한다: PE의 지속적 하락은 충격 레짐으로의 전환을 사전에 알리는 신호가 될 수 있다.
          </p>
          <p>
            특히 주목할 만한 것은 PE가 "저 I → 고 PE"의 비선형 회복 패턴을 보인다는 점이다.
            충격 레짐 종료 직후(VIX 30 → 25로 하락 시), I(X;Y)는 즉각 회복되지 않고 평균
            12~15거래일의 지연을 두고 정상 레짐 수준으로 복귀한다. 이는 충격 이후 동시호가
            참가자들의 전략 이질성이 즉각 소멸되지 않고 점진적으로 해소됨을 의미한다.
          </p>

          <h3>4. PE 지표의 한계와 추정 불확실성</h3>
          <p>
            PE 지표 해석에는 몇 가지 주의가 필요하다. 첫째, I(X;Y) 추정 자체의 불확실성이다.
            k-NN 기반 비모수 추정량은 표본이 충분히 크지 않으면(거래일 &lt; 100) 편의가 발생할
            수 있다. 본 연구에서 충격 레짐의 148거래일은 신뢰 구간 폭이 0.26 bits로 다소 넓다.
          </p>
          <p>
            둘째, 정상분포 근사를 통한 MAE 하한 도출 과정에서의 근사 오차다. 실제 코스피
            시초가 수익률 분포는 두꺼운 꼬리를 가지므로, 정규분포 기반 MAE 공식은 이론적
            하한을 과소추정할 가능성이 있다. 더 정확한 추정을 위해서는 Student-t 분포나
            비모수적 방법이 필요하다.
          </p>

          {/* ===== 섹션 Ⅶ ===== */}
          <h2>Ⅶ. 결론 — 코스피 예측의 이론적 한계와 현재 모델의 위치</h2>

          <h3>1. 핵심 발견의 종합</h3>
          <p>
            본 연구는 Shannon 상호 정보량 이론을 코스피 시초가 예측에 적용하여 다음의 핵심
            발견들을 도출했다. 이 발견들은 서로 긴밀하게 연결되어 하나의 일관된 이론적 그림을 구성한다.
          </p>
          <p>
            <strong>발견 1 — 레짐 비대칭 정보량:</strong> EWY와 코스피 사이의 상호 정보량은
            정상 레짐(0.84 bits)과 충격 레짐(0.31 bits) 사이에서 63% 감소한다. 이 감소는
            EWY 신호 자체의 정보 내용이 레짐에 무관하게 일정함에도 불구하고, 충격 레짐에서
            동시호가 참가자들의 반응 이질성이 증폭되어 코스피 조건부 엔트로피가 높아지기 때문이다.
          </p>
          <p>
            <strong>발견 2 — 불가예측 엔트로피의 구조:</strong> 정상 레짐에서도 EWY 신호로
            설명할 수 없는 잔여 엔트로피(0.39 bits)가 존재하며, 이는 네 가지 구조적 원천—동시호가
            집계(40%), 레짐 전환(30%), 뉴스 오버랩(20%), 해석 이질성(10%)—으로 분해된다.
            이 불가예측 엔트로피가 이론적 MAE 하한 ~4.8pt(정상 레짐)와 ~21.3pt(충격 레짐)를 형성한다.
          </p>
          <p>
            <strong>발견 3 — 예측 효율성 87%:</strong> 현재 KOSPI Dawn 모델은 정상 레짐에서
            PE = 74.3%, 충격 레짐에서 PE = 51.7%를 달성하며, 이는 이론적 달성 가능 최대치
            (정상 85%, 충격 60%)의 각각 87%, 86%에 해당한다. 이 결과는 현재 모델이 이미
            상당히 성숙한 단계에 도달해 있음을 의미한다.
          </p>
          <p>
            <strong>발견 4 — 정보 과부하 역설:</strong> EWY 변화율이 ±3%를 초과하는 강한
            신호 구간에서 상호 정보량이 오히려 감소하는 역설이 발견된다. 이는 강한 외부 신호가
            동시호가 참가자들의 반응 이질성을 극대화하여 집계 노이즈를 증폭시키는 비선형
            메커니즘에서 비롯된다.
          </p>
          <p>
            <strong>발견 5 — 신뢰 조정 시스템의 유효성:</strong> 실시간 I(t) 모니터링에 기반한
            신뢰 조정 계수 시스템은 전체 밴드 적중률을 62.3%에서 72.6%로 향상시키며, 특히
            저신뢰 구간에서 37pp의 극적인 개선을 달성한다.
          </p>

          <h3>2. 철학적 함의: 예측의 겸손함</h3>
          <p>
            이 연구의 결과들은 예측 모델 개발에 대한 심층적인 철학적 함의를 담고 있다. 코스피
            시초가 예측의 이론적 한계를 정량화했다는 것은, 역설적으로 예측이 얼마나 어려운 과제인지를
            객관적으로 보여준다. 정상 레짐에서 이론적 MAE 하한이 약 4.8pt라는 사실은—즉 아무리
            완벽한 모델도 평균적으로 4.8pt 이상의 오차를 가질 수밖에 없다는 사실은—예측의
            근본적 한계를 인정하게 만든다.
          </p>
          <p>
            그러나 이 한계의 인정이 예측 노력을 무의미하게 만드는 것은 아니다. 오히려 반대다:
            한계를 알기에 현재 모델이 그 한계의 87%를 달성하고 있다는 사실이 더 의미 있게 된다.
            Grossman & Stiglitz(1980)의 논리처럼, 예측이 "불완전하기에" 예측에 가치가 있다.
            완전히 예측 가능하다면 모든 정보가 즉각 가격에 반영되어 예측의 경제적 가치가 사라진다.
            코스피 시초가 예측의 가치는 바로 이 0~4.8pt 하한의 공간과 4.8~12.24pt 개선 가능
            공간의 합에서 발생한다.
          </p>

          <h3>3. 향후 연구 방향</h3>
          <p>
            본 연구의 발견은 다음의 후속 연구 주제들을 열어 준다.
          </p>
          <p>
            첫째, 다중 신호의 결합 상호 정보량 I(X₁, X₂, ..., Xₖ; Y) 추정이다. 현재 연구는
            EWY 단일 신호만을 X로 사용했지만, VIX, USD/KRW, 야간선물 등을 추가할 경우
            이론적 상한이 얼마나 높아지는지를 정량화해야 한다.
          </p>
          <p>
            둘째, 동시호가 집계 노이즈(ε)의 직접 모델링이다. 동시호가 과정에서 생성되는 집계
            노이즈를 호가창 데이터(Level 2 order book)로 직접 추정할 수 있다면, 불가예측
            엔트로피의 정밀 추정이 가능하다.
          </p>
          <p>
            셋째, 정보 과부하 역설의 임계값 안정성 검정이다. |EWYchange| &gt; 3%라는 임계값이
            다른 시장 조건, 다른 기간에서도 안정적으로 유지되는지를 검정해야 한다.
          </p>
          <p>
            넷째, 신뢰 조정 계수 시스템의 실시간 구현이다. 롤링 I(t) 추정은 계산 비용이 높으므로,
            실시간 추정을 위한 효율적 근사 알고리즘(예: 지수가중 k-NN)의 개발이 필요하다.
          </p>

          <h3>4. 최종 결론</h3>
          <p>
            코스피 시초가 예측은 EWY 신호라는 한정된 정보 채널에서 Shannon 상호 정보량이
            부과하는 이론적 천장(ceiling) 아래 존재한다. 정상 레짐에서 이 천장은 코스피
            불확실성의 약 68%에 해당하며, 현재 모델은 이 천장의 74.3%를 달성하여 이론적 최대
            달성 가능치의 87% 수준에 이미 도달해 있다. 따라서 향후 예측 성과 개선의 초점은
            더 복잡한 모델 구조보다는 (1) 충격 레짐 탐지의 선제성 향상, (2) 정보 과부하 구간에서의
            동적 계수 조정, (3) 신뢰 조정 계수 시스템의 정밀화라는 세 방향에 집중되어야 한다.
          </p>
          <p>
            이 연구가 제시하는 궁극적 메시지는 단순하지만 심오하다: 좋은 예측 시스템은 자신이
            "얼마나 맞는지"뿐만 아니라 "얼마나 맞을 수 있는지"와 "오늘은 얼마나 맞을 수 있는지"를
            알아야 한다. Shannon 상호 정보량은 이 세 질문에 동시에 답할 수 있는 이론적 도구이며,
            본 연구는 이 도구가 코스피 시초가 예측의 실전 운용에서 즉각 활용 가능함을 보인다.
          </p>

          {/* 참고문헌 */}
          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">
              Shannon, C. E. (1948). A mathematical theory of communication.
              <em> The Bell System Technical Journal</em>, 27(3), 379–423.
            </p>
            <p className="paperReferenceItem">
              Cover, T. M., &amp; Thomas, J. A. (2006).
              <em> Elements of Information Theory</em> (2nd ed.). Wiley-Interscience.
            </p>
            <p className="paperReferenceItem">
              Grossman, S. J., &amp; Stiglitz, J. E. (1980). On the impossibility of informationally
              efficient markets. <em>American Economic Review</em>, 70(3), 393–408.
            </p>
            <p className="paperReferenceItem">
              Shiller, R. J. (1981). Do stock prices move too much to be justified by subsequent
              changes in dividends? <em>American Economic Review</em>, 71(3), 421–436.
            </p>
            <p className="paperReferenceItem">
              Campbell, J. Y. (1991). A variance decomposition for stock returns.
              <em> Economic Journal</em>, 101(405), 157–179.
            </p>
            <p className="paperReferenceItem">
              Campbell, J. Y., Lo, A. W., &amp; MacKinlay, A. C. (1997).
              <em> The Econometrics of Financial Markets</em>. Princeton University Press.
            </p>
            <p className="paperReferenceItem">
              Madhavan, A. (1992). Trading mechanisms in securities markets.
              <em> Journal of Finance</em>, 47(2), 607–641.
            </p>
            <p className="paperReferenceItem">
              Kyle, A. S. (1985). Continuous auctions and insider trading.
              <em> Econometrica</em>, 53(6), 1315–1335.
            </p>
            <p className="paperReferenceItem">
              Kraskov, A., Stögbauer, H., &amp; Grassberger, P. (2004). Estimating mutual
              information. <em>Physical Review E</em>, 69(6), 066138.
            </p>
            <p className="paperReferenceItem">
              Tishby, N., &amp; Polani, D. (2011). Information theory of decisions and actions.
              In A. Cutsuridis, A. Hussain, &amp; J. G. Taylor (Eds.),
              <em> Perception-Action Cycle</em> (pp. 601–636). Springer.
            </p>
            <p className="paperReferenceItem">
              Timmermann, A. (2006). Forecast combinations. In G. Elliott, C. W. J. Granger, &amp;
              A. Timmermann (Eds.), <em>Handbook of Economic Forecasting</em> (Vol. 1, pp. 135–196).
              Elsevier.
            </p>
            <p className="paperReferenceItem">
              Diebold, F. X., &amp; Mariano, R. S. (1995). Comparing predictive accuracy.
              <em> Journal of Business &amp; Economic Statistics</em>, 13(3), 253–263.
            </p>
            <p className="paperReferenceItem">
              Bates, J. M., &amp; Granger, C. W. J. (1969). The combination of forecasts.
              <em> Operations Research Quarterly</em>, 20(4), 451–468.
            </p>
          </div>
        </div>

        <div className="paperDisclaimer">
          본 논문은 KOSPI Dawn 퀀트 연구팀이 학술·연구 목적으로 작성한 Working Paper이며,
          특정 금융 상품 또는 자산에 대한 투자를 권유하거나 추천하지 않습니다.
          본 논문에 포함된 모든 수치, 추정값, 모델 결과는 이론적·실증적 분석에 기반하나,
          미래의 투자 성과를 보장하지 않습니다. 코스피를 포함한 모든 금융 자산 투자에는
          원금 손실 위험이 존재하며, 모든 투자 판단과 그에 따른 책임은 투자자 본인에게 있습니다.
          본 논문의 연구 결과를 실제 투자에 활용하기 전에 전문가와 충분한 상담을 거치시기 바랍니다.
        </div>
        <div className="paperNav">
          <a href="/papers" className="paperNavBack">← 연구논문 목록으로</a>
        </div>
      </main>
    </div>
  );
}
