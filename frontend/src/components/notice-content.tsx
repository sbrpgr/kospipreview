"use client";

type NoticeBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "formula"; title: string; lines: string[] }
  | { kind: "list"; title?: string; items: string[] };

type NoticeItem = {
  title: string;
  blocks: NoticeBlock[];
};

const NOTICE_ITEMS: NoticeItem[] = [
  {
    title: "KOSPI Dawn 개요 · 퀀트투자모델 개발을 위한 연구환경",
    blocks: [
      {
        kind: "paragraph",
        text: "KOSPI Dawn은 다음 거래일 코스피 시초가를 연구하기 위해 만든 공개 연구환경입니다. 단순 시황 페이지가 아니라, 해외 ETF·환율·미국 지수·금리·원자재·야간선물 참고값을 하나의 파이프라인으로 엮어 실제 시초가와 반복 검증하는 퀀트투자모델 테스트베드에 가깝습니다.",
      },
      {
        kind: "paragraph",
        text: "이 사이트의 주된 목적은 '매매 신호를 권유하는 서비스'가 아니라, 한국장 마감 이후 누적되는 해외 정보를 어떤 방식으로 개장가 nowcast에 번역할 수 있는지 연구하고 검증하는 것입니다. 따라서 화면에 보이는 예측값은 완제품 투자신호가 아니라, 공개적으로 검증 중인 모델 산출물입니다.",
      },
      {
        kind: "paragraph",
        text: "핵심 포인트는 단순 숫자 제공이 아니라 구조적 설명력입니다. 어떤 신호를 코어로 쓰는지, 어떤 신호는 잔차 보정에만 쓰는지, 어떤 보정이 성능 개선에 기여했는지, 그리고 그 결과가 최근 실측 기록에서 어느 정도 검증됐는지를 함께 보여주는 것이 KOSPI Dawn의 역할입니다.",
      },
    ],
  },
  {
    title: "현재 메인 예측모델 · 야간선물 없이 작동하는 독립형 예측 엔진",
    blocks: [
      {
        kind: "paragraph",
        text: "현재 화면에 표시되는 메인 예측값은 야간선물 지표를 직접 입력값으로 사용하지 않는 모델입니다. 즉 '야간선물이 몇 % 올랐으니 코스피도 그만큼 오른다'는 단순 추종 구조가 아니라, EWY와 USD/KRW를 중심으로 한국장 마감 이후 누적된 해외 정보를 다시 계산해 다음 날 개장가를 추정하는 독립형 예측 엔진입니다.",
      },
      {
        kind: "paragraph",
        text: "야간선물은 비교용 기준선으로만 남아 있습니다. 이는 메인 모델의 직접 입력값이 아니라, '기존 직접 지표'와 '현재 연구 모델'을 같은 화면에서 비교 검증하기 위한 공개 벤치마크입니다. 따라서 사이트의 핵심 산출물은 야간선물 환산치가 아니라, 야간선물 없이도 설명력을 확보하려는 EWY 코어 기반 예측모델입니다.",
      },
      {
        kind: "formula",
        title: "현재 메인 모델의 기본 구조",
        lines: [
          "Core signal = EWY + USD/KRW sync-adjusted return",
          "Residual layer = SOX + U.S. broad factor + US10Y + WTI + Gold",
          "Final prediction = Core signal + residual correction + stability guardrail",
        ],
      },
      {
        kind: "paragraph",
        text: "왜 굳이 야간선물을 빼고 이런 구조를 쓰느냐가 중요합니다. 연구 목적은 단순히 야간선물을 따라가는 것이 아니라, 야간선물 접근이 제한되거나 세션 종료 이후 정보 공백이 생기는 구간에서도 독립적인 fair-value nowcast를 만들 수 있는지를 검증하는 데 있기 때문입니다. 다시 말해 이 플랫폼은 야간선물 복제기가 아니라, 야간선물 없이도 작동하는 퀀트형 개장가 예측모델을 실험하는 공개 연구환경입니다.",
      },
    ],
  },
  {
    title: "활용 가이드 · 언제, 어떻게 보면 이 플랫폼이 가장 유용한가",
    blocks: [
      {
        kind: "paragraph",
        text: "KOSPI Dawn은 장중 트레이딩 보조도구라기보다, 한국장 마감 이후 해외 정보가 누적되는 시간을 해석하기 위한 장전 연구도구에 가깝습니다. 따라서 가장 유용한 구간은 저녁부터 다음 날 아침 개장 직전까지이며, 낮 시간에는 '실시간 장중 판단 도구'로 쓰기보다 최근 기록과 모델 구조를 참고하는 용도로 보는 편이 적합합니다.",
      },
      {
        kind: "list",
        title: "추천 활용 방식",
        items: [
          "18:00~09:00 구간에는 모델 예측값, 야간선물 단순환산, EWY·환율·반도체 지표를 함께 비교해 다음 날 개장 방향성을 점검합니다.",
          "09:00~15:30 정규장 시간에는 플랫폼이 주 운영 구간이 아니므로 장중 매매 판단은 공식 호가창과 증권사 HTS/MTS를 우선 참고합니다.",
          "최근 실측 기록에서는 모델 예측치와 실제 시초가의 거리, 그리고 야간선물 환산치와의 차이를 함께 보며 모델의 설명력을 해석합니다.",
          "공지·모델 설명 페이지를 함께 읽으면 왜 특정 밤에는 야간선물보다 EWY·환율 보정이 더 중요해지는지 맥락을 이해할 수 있습니다.",
        ],
      },
      {
        kind: "paragraph",
        text: "요약하면 이 플랫폼은 '낮에 계속 쳐다보는 장중 보조지표'보다, 밤사이 축적된 해외 시그널을 다음 날 시초가 관점으로 정리해 보는 리서치형 도구로 활용할 때 가장 강점을 발휘합니다.",
      },
    ],
  },
  {
    title: "지속 관찰 포인트 · 데이터가 쌓일수록 모델 설명력은 더 강해질 수 있습니다",
    blocks: [
      {
        kind: "paragraph",
        text: "현재 KOSPI Dawn은 단순한 야간선물 추종기가 아니라, 장마감 이후 해외 정보가 어떻게 다음 날 개장가에 반영되는지를 장기적으로 축적·검증하는 연구형 플랫폼입니다. 이런 유형의 모델은 하루나 일주일 성과보다, 데이터가 계속 쌓이면서 어떤 보정이 일관되게 설명력을 가지는지 확인할 때 비로소 강점이 드러납니다.",
      },
      {
        kind: "paragraph",
        text: "특히 EWY, 환율, 반도체, 금리, 원자재, 변동성 지표와 실제 시초가 사이의 관계를 밤마다 누적해 가면, 단순한 야간선물 지표를 넘어서는 독립형 예측모델로 발전할 가능성이 높습니다. 어떤 날에는 야간선물이 가장 직접적인 지표가 되지만, 또 어떤 날에는 야간선물만으로 설명되지 않는 공백 구간이 생기기 때문에 장기 누적 데이터는 이런 차이를 구분하는 데 매우 중요합니다.",
      },
      {
        kind: "paragraph",
        text: "따라서 이 플랫폼은 단기 적중률만 보는 서비스라기보다, 시간이 지날수록 더 강한 설명력을 갖춘 퀀트형 개장가 모델을 만들기 위한 공개 연구기반으로 이해하는 편이 맞습니다. 앞으로도 기록이 축적되고 검증 케이스가 늘어날수록 모델의 구조와 보정 방식은 더 정교해질 수 있으므로, 장기적인 관점에서 지속적으로 관심을 가지고 지켜봐 주시면 좋겠습니다.",
      },
    ],
  },
  {
    title: "EWY 기반 합성 KOSPI200 야간 환산지수 · 코어 설계와 핵심 수식",
    blocks: [
      {
        kind: "paragraph",
        text: "이 모델의 코어는 'EWY 기반 합성 KOSPI200 야간 환산지수'입니다. 이는 공식 야간선물의 완전한 대체재라기보다, 야간 fair-value nowcast에 가까운 연구용 지수입니다. EWY는 달러 표시 한국주식 바스켓이고 KOSPI200은 원화 표시 한국주식 지수이므로, USD/KRW를 함께 쓰면 EWY 움직임을 원화 기준 한국주식 흐름으로 다시 번역할 수 있습니다.",
      },
      {
        kind: "list",
        title: "기준 변수",
        items: [
          "K200_close(D): D일 KOSPI200 종가",
          "E_t: 시각 t의 EWY 가격",
          "F_t: 시각 t의 USD/KRW 환율",
          "t0: 야간 세션 기준 시각. 실무상 18:00 KST 또는 첫 유효 체결 시점",
        ],
      },
      {
        kind: "formula",
        title: "가장 단순한 코어 이론식",
        lines: [
          "R_core(t) = ln(E_t / E_t0) + ln(F_t / F_t0)",
          "K200_raw(t) = K200_close(D) * exp(R_core(t))",
        ],
      },
      {
        kind: "paragraph",
        text: "하지만 EWY와 KOSPI200은 구성과 가중치가 완전히 같지 않기 때문에 실전에서는 보정계수를 둡니다. 핵심은 EWY 민감도와 환율 민감도를 1로 고정하지 않고, 최근 구간에 더 높은 가중치를 두는 rolling regression으로 계속 다시 추정한다는 점입니다.",
      },
      {
        kind: "formula",
        title: "실전형 코어 보정식",
        lines: [
          "y_core(t) = alpha_D + beta_E * ln(E_t / E_t0) + beta_F * ln(F_t / F_t0)",
          "K200_core(t) = K200_close(D) * exp(y_core(t))",
        ],
      },
      {
        kind: "paragraph",
        text: "여기서 alpha_D는 당일 basis 보정치, beta_E는 EWY 민감도, beta_F는 환율 민감도입니다. 즉 현재 코어 엔진만 보더라도 단순히 'EWY 상승률을 곱한다'는 수준이 아니라, 기준 시점 정렬과 동적 민감도 추정을 포함한 정량 모델 구조를 사용합니다.",
      },
    ],
  },
  {
    title: "잔차 보정 알고리즘 · SOX, PCA, 금리, 원자재를 어떻게 넣는가",
    blocks: [
      {
        kind: "paragraph",
        text: "보조지표는 메인 식에 다 집어넣는 방식이 아니라, EWY+환율 코어가 설명하지 못한 잔차만 보정하는 구조를 사용합니다. 이 접근은 코어 신호를 보호하면서도 반도체, 기술주, 금리, 원자재가 만드는 초과 설명력을 별도 레이어로 흡수할 수 있게 해 줍니다.",
      },
      {
        kind: "formula",
        title: "잔차 정의",
        lines: [
          "u_t = y_target(t) - y_core(t)",
          "z_j(t) = ln(A_j,t / A_j,t0) / sigma_j",
          "z_10Y(t) = (Y_10Y,t - Y_10Y,t0) / sigma_dY",
        ],
      },
      {
        kind: "paragraph",
        text: "미국 3대 지수는 서로 상관이 매우 높기 때문에 raw로 그대로 넣지 않습니다. 대신 S&P500, NASDAQ, Dow를 broad factor로 압축하고, 그 위에 기술주 초과 강도와 반도체 초과 강도를 별도 특징량으로 분리합니다. 이 과정이 단순 지표 나열과 퀀트형 특징량 설계를 가르는 핵심 차이입니다.",
      },
      {
        kind: "formula",
        title: "주요 특징량",
        lines: [
          "U_t = PC1(z_SPX, z_NDX, z_DJI)",
          "T_t = z_NDX - z_SPX",
          "S_t = z_SOX - rho * z_NDX",
        ],
      },
      {
        kind: "formula",
        title: "잔차 보정식과 최종 합성 K200",
        lines: [
          "u_hat(t) = gamma1*U_t + gamma2*T_t + gamma3*S_t + gamma4*z_WTI,t + gamma5*z_Gold,t + gamma6*z_10Y,t",
          "y_final(t) = y_core(t) + u_hat(t)",
          "K200_night(t) = K200_close(D) * exp(y_final(t))",
        ],
      },
      {
        kind: "list",
        title: "보조지표 우선순위",
        items: [
          "SOX: EWY의 반도체·IT 편중을 가장 직접적으로 보정",
          "미국 broad factor: 미국장 전체 위험선호와 리스크오프 반영",
          "US 10Y: 할인율과 금리 쇼크 보정",
          "WTI / Gold: 인플레이션·리스크 프리미엄·안전자산 선호 보정",
        ],
      },
    ],
  },
  {
    title: "운영 파이프라인 · 데이터 수집부터 실측 검증까지",
    blocks: [
      {
        kind: "paragraph",
        text: "예측모델의 수준은 계산식만으로 결정되지 않습니다. 기준 시점 저장, 데이터 정제, 특징량 계산, 라이브 재연산, 최근 실측 기록 반영, 운영 상태 구분까지 하나의 파이프라인으로 안정적으로 이어져야 실제 검증이 가능합니다. KOSPI Dawn은 바로 이 운영 구조 전체를 모델 검증 범위에 포함합니다.",
      },
      {
        kind: "list",
        title: "운영 파이프라인 핵심",
        items: [
          "세션 시작값 고정: KOSPI/KOSPI200 종가, EWY 기준값, USD/KRW 기준값, 보조지표 기준값 저장",
          "데이터 정제: stale quote 제거, 장전·장후 값 분리, 필요 시 1~5분 VWAP 성격 반영",
          "학습 방식: 최근 120거래일 rolling, ridge 계열 정규화, walk-forward 검증",
          "이상치 관리: 이벤트성 밤(FOMC/CPI/NFP 등)은 winsorize 또는 더미 처리",
          "실시간 안정화: 예측값이 과도하게 튀지 않도록 범위 제한과 완충 로직 적용",
        ],
      },
      {
        kind: "formula",
        title: "basis EWMA 보정 예시",
        lines: [
          "alpha_D = lambda * alpha_(D-1) + (1 - lambda) * e_(D-1)",
          "e_(D-1) = y_target(D-1, t*) - y_final(D-1, t*)",
        ],
      },
      {
        kind: "paragraph",
        text: "즉, 어제의 예측 오차를 오늘 intercept에 일부 반영하는 식으로 basis를 계속 다듬습니다. 이런 구조는 단순 계산기에서는 거의 쓰지 않는 운영형 보정 로직이며, 공개 검증 사이트가 아닌 공개 연구환경에 가까운 이유이기도 합니다.",
      },
      {
        kind: "formula",
        title: "KOSPI 최종 환산 레이어",
        lines: [
          "ln(KOSPI_night(t) / KOSPI_close(D)) = alpha_K + beta_K * y_final(t)",
        ],
      },
      {
        kind: "paragraph",
        text: "즉 1차로 EWY에서 합성 KOSPI200을 만들고, 2차로 이를 KOSPI 시초가 성격에 맞게 다시 매핑합니다. 현재 사이트의 메인 예측값은 이 다단계 구조를 통해 산출되는 결과입니다.",
      },
    ],
  },
  {
    title: "야간선물 단순환산의 위치 · 메인 서비스가 아니라 비교 검증용 기준선",
    blocks: [
      {
        kind: "paragraph",
        text: "화면에 표시되는 야간선물 단순환산치는 직접적인 메인 서비스가 아닙니다. 이는 연구용 모델과 비교하기 위한 공개 기준선에 가깝습니다. 즉 '야간선물 자체를 서비스한다'기보다, 우리 모델이 기존 직접 지표와 비교해 어느 구간에서 더 강한 설명력을 보였는지를 확인하기 위한 벤치마크입니다.",
      },
      {
        kind: "paragraph",
        text: "야간선물은 장이 실제로 열려 있는 시간에는 매우 직접적인 선행지표가 될 수 있지만, 세션 종료 이후에는 프리마켓, 환율, 반도체, 금리, 원자재 변화가 추가로 누적됩니다. 따라서 장마감 이후 시간이 길어질수록 야간선물 하나만으로 다음 날 개장가를 완전히 설명하기는 어렵습니다.",
      },
      {
        kind: "paragraph",
        text: "바로 그 이유로 KOSPI Dawn은 야간선물 단순환산을 비교 검증용으로 분리하고, 메인 예측은 EWY 기반 합성 KOSPI200 nowcast와 잔차 보정 알고리즘으로 계산합니다. 서비스의 본질은 야간선물 추종이 아니라, 야간선물 이후 공백 구간까지 설명할 수 있는 독립형 퀀트모델을 만드는 데 있습니다.",
      },
    ],
  },
  {
    title: "활용 원칙 및 책임 범위 · 참고는 가능하지만 책임은 사용자 본인",
    blocks: [
      {
        kind: "paragraph",
        text: "KOSPI Dawn은 연구·검증 목적의 정보 플랫폼이며, 금융투자상품에 대한 자문 서비스가 아닙니다. 본 사이트의 예측값, 단순환산치, 지표 카드, 해설, 기록 비교는 모두 참고 자료일 뿐이며 특정 종목, ETF, 선물, 옵션의 매수·매도를 권유하지 않습니다.",
      },
      {
        kind: "paragraph",
        text: "예측모델은 통계적 추정 구조이므로 실제 개장 결과와 다를 수 있습니다. 정책 발표, 지정학 이슈, 유동성 급변, 비정상 체결, 데이터 지연 같은 변수는 모델이 완전하게 반영하지 못할 수 있습니다. 따라서 본 사이트 수치만으로 투자 결정을 확정하는 것은 바람직하지 않습니다.",
      },
      {
        kind: "paragraph",
        text: "운영자는 모델 구조와 운영 안정성을 계속 개선하지만, 외부 데이터 소스 지연, 제공 중단, 가격 급변, 네트워크 오류, 캐시 반영 지연 등으로 발생할 수 있는 손실이나 기회비용에 대해 책임을 지지 않습니다. 투자와 활용은 각자 스스로 판단하시기 바라며, 그 판단의 결과와 책임은 사용자 본인에게 있습니다.",
      },
    ],
  },
];

export function NoticeContent() {
  return (
    <section className="noticeSection" aria-label="공지 및 안내">
      <div className="sectionTitleRow">
        <h2 className="sectionTitle">공지 및 안내</h2>
      </div>
      <p className="sectionSubtext noticeLead">
        본 플랫폼은 퀀트투자모델 개발과 검증을 위한 연구환경입니다. 메인 예측값은 야간선물을 직접 입력하지 않는 독립형
        연구모델이며, 화면의 예측값과 야간선물 단순환산은 모두 연구·비교 목적의 참고 자료입니다. 최종 투자 판단과 책임은
        사용자 본인에게 있습니다.
      </p>
      <div className="noticeList">
        {NOTICE_ITEMS.map((item) => (
          <details key={item.title} className="noticeItem">
            <summary>{item.title}</summary>
            <div className="noticeBody">
              {item.blocks.map((block, blockIndex) => {
                if (block.kind === "paragraph") {
                  return <p key={`${item.title}-${blockIndex}`}>{block.text}</p>;
                }

                if (block.kind === "formula") {
                  return (
                    <div key={`${item.title}-${blockIndex}`} className="noticeFormula">
                      <div className="noticeFormulaTitle">{block.title}</div>
                      <pre className="noticeFormulaPre">{block.lines.join("\n")}</pre>
                    </div>
                  );
                }

                return (
                  <div key={`${item.title}-${blockIndex}`} className="noticeListBlock">
                    {block.title ? <div className="noticeListTitle">{block.title}</div> : null}
                    <ul className="noticeBulletList">
                      {block.items.map((listItem) => (
                        <li key={listItem}>{listItem}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
