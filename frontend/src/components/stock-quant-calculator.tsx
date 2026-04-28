"use client";

import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";
import { useState } from "react";
import {
  buildDcfSensitivityTable,
  calculateAverageDown,
  calculateDcfValuation,
  calculateDividendIncome,
  calculateFinancialMetrics,
  calculateFxReturnBreakdown,
  calculateLossRecovery,
  calculateReverseDcf,
  calculateStopPositionSizing,
  calculateTargetExit,
  calculateValuationBridge,
} from "@/lib/stock-quant-calculator";

type StockQuantCalculatorProps = {
  latestUsdKrw?: number | null;
  latestUsdKrwUpdatedAt?: string | null;
  latestUsdKrwChangePct?: number | null;
};

const DECIMAL_FORMATTER = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const INTEGER_FORMATTER = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

type FieldState = Record<string, string>;
type ResultTone = "default" | "positive" | "negative" | "accent";

function parseNumber(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return Number.NaN;
  }
  return Number(normalized);
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatSignedPercent(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, digits)}%`;
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatNumber(value, digits)}%`;
}

function formatMultiplier(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatNumber(value, digits)}배`;
}

function formatShares(value: number | null | undefined, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatNumber(value, digits)}주`;
}

function formatWon(value: number | null | undefined, digits = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value)}원`;
}

function formatCompactWon(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  const absolute = Math.abs(value);
  if (absolute >= 1_0000_0000_0000) {
    return `${formatNumber(value / 1_0000_0000_0000, 2)}조 원`;
  }
  if (absolute >= 1_0000_0000) {
    return `${formatNumber(value / 1_0000_0000, 2)}억 원`;
  }
  if (absolute >= 1_0000) {
    return `${formatNumber(value / 1_0000, 2)}만 원`;
  }
  return formatWon(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function getToneFromSignedValue(value: number | null | undefined): ResultTone {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "default";
  }

  if (value > 0) {
    return "positive";
  }
  if (value < 0) {
    return "negative";
  }
  return "accent";
}

function setField<T extends FieldState>(
  setter: Dispatch<SetStateAction<T>>,
  key: keyof T,
) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setter((current) => ({
      ...current,
      [key]: nextValue,
    }));
  };
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
  step = "any",
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  suffix?: string;
  hint?: string;
  step?: string;
}) {
  return (
    <label className="quantField">
      <span className="quantFieldLabel">{label}</span>
      <span className="quantInputWrap">
        <input className="quantInput" value={value} onChange={onChange} inputMode="decimal" step={step} />
        {suffix ? <span className="quantInputSuffix">{suffix}</span> : null}
      </span>
      {hint ? <span className="quantFieldHint">{hint}</span> : null}
    </label>
  );
}

function Metric({
  label,
  value,
  tone = "default",
  note,
}: {
  label: string;
  value: string;
  tone?: ResultTone;
  note?: string;
}) {
  return (
    <div className={`quantMetric quantMetric-${tone}`}>
      <span className="quantMetricLabel">{label}</span>
      <strong className="quantMetricValue">{value}</strong>
      {note ? <span className="quantMetricNote">{note}</span> : null}
    </div>
  );
}

function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="quantMetricGrid">{children}</div>;
}

function Formula({
  title,
  expression,
}: {
  title: string;
  expression: string;
}) {
  return (
    <details className="quantFormula">
      <summary>{title}</summary>
      <code>{expression}</code>
    </details>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="quantSectionHeader">
      <span className="quantSectionEyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function StockQuantCalculator({
  latestUsdKrw = null,
  latestUsdKrwUpdatedAt = null,
  latestUsdKrwChangePct = null,
}: StockQuantCalculatorProps) {
  const latestUsdKrwText = latestUsdKrw !== null ? DECIMAL_FORMATTER.format(latestUsdKrw) : "";
  const [recoveryFields, setRecoveryFields] = useState({
    lossPct: "30",
  });
  const [averageDownFields, setAverageDownFields] = useState({
    currentAveragePrice: "80000",
    currentQuantity: "10",
    currentPrice: "60000",
    extraBuyPrice: "60000",
    extraQuantity: "5",
    extraAmount: "300000",
    portfolioValue: "3500000",
    downsideShockPct: "10",
  });
  const [averageDownMode, setAverageDownMode] = useState<"quantity" | "amount">("quantity");
  const [targetExitFields, setTargetExitFields] = useState({
    averagePrice: "72000",
    quantity: "15",
    targetNetReturnPct: "15",
    sellFeePct: "0.015",
    taxRatePct: "0",
    buyFxRate: "1",
    sellFxRate: "1",
  });
  const [stopFields, setStopFields] = useState({
    allowedLossAmount: "200000",
    entryPrice: "72000",
    stopPrice: "66400",
  });
  const [fxFields, setFxFields] = useState({
    buyPrice: "220",
    currentPrice: "248",
    quantity: "10",
    buyFxRate: "1320",
    currentFxRate: latestUsdKrwText || "1365",
    dividendPerShare: "0",
    dividendTaxPct: "15",
  });
  const [fxConverterFields, setFxConverterFields] = useState({
    usdAmount: "100",
    krwAmount: "1000000",
  });
  const [dividendFields, setDividendFields] = useState({
    investmentAmount: "30000000",
    annualDividendYieldPct: "4.2",
    taxRatePct: "15.4",
    targetMonthlyDividend: "300000",
  });
  const [metricsFields, setMetricsFields] = useState({
    netIncome: "1000000000000",
    equity: "5000000000000",
    sharesOutstanding: "100000000",
    currentPrice: "150000",
    dividendPerShare: "3000",
    freeCashFlow: "900000000000",
    ebitda: "1400000000000",
    totalDebt: "800000000000",
    cashAndEquivalents: "1200000000000",
  });
  const [valuationFields, setValuationFields] = useState({
    currentPrice: "150000",
    expectedEps: "10000",
    targetPer: "12",
    sharesOutstanding: "100000000",
  });
  const [dcfFields, setDcfFields] = useState({
    baseFreeCashFlow: "1000000000000",
    growthRatePct: "6",
    discountRatePct: "9",
    terminalGrowthPct: "2",
    netCash: "300000000000",
    sharesOutstanding: "100000000",
    currentPrice: "100000",
  });

  const recoveryResult = calculateLossRecovery(parseNumber(recoveryFields.lossPct));
  const averageDownResult = calculateAverageDown({
    currentAveragePrice: parseNumber(averageDownFields.currentAveragePrice),
    currentQuantity: parseNumber(averageDownFields.currentQuantity),
    currentPrice: parseNumber(averageDownFields.currentPrice),
    extraBuyPrice: parseNumber(averageDownFields.extraBuyPrice),
    extraQuantity:
      averageDownMode === "quantity" ? parseNumber(averageDownFields.extraQuantity) : null,
    extraAmount:
      averageDownMode === "amount" ? parseNumber(averageDownFields.extraAmount) : null,
    portfolioValue: parseNumber(averageDownFields.portfolioValue),
    downsideShockPct: parseNumber(averageDownFields.downsideShockPct),
  });
  const targetExitResult = calculateTargetExit({
    averagePrice: parseNumber(targetExitFields.averagePrice),
    quantity: parseNumber(targetExitFields.quantity),
    targetNetReturnPct: parseNumber(targetExitFields.targetNetReturnPct),
    sellFeePct: parseNumber(targetExitFields.sellFeePct),
    taxRatePct: parseNumber(targetExitFields.taxRatePct),
    buyFxRate: parseNumber(targetExitFields.buyFxRate),
    sellFxRate: parseNumber(targetExitFields.sellFxRate),
  });
  const stopResult = calculateStopPositionSizing({
    allowedLossAmount: parseNumber(stopFields.allowedLossAmount),
    entryPrice: parseNumber(stopFields.entryPrice),
    stopPrice: parseNumber(stopFields.stopPrice),
  });
  const fxResult = calculateFxReturnBreakdown({
    buyPrice: parseNumber(fxFields.buyPrice),
    currentPrice: parseNumber(fxFields.currentPrice),
    quantity: parseNumber(fxFields.quantity),
    buyFxRate: parseNumber(fxFields.buyFxRate),
    currentFxRate: parseNumber(fxFields.currentFxRate),
    dividendPerShare: parseNumber(fxFields.dividendPerShare),
    dividendTaxPct: parseNumber(fxFields.dividendTaxPct),
  });
  const dividendResult = calculateDividendIncome({
    investmentAmount: parseNumber(dividendFields.investmentAmount),
    annualDividendYieldPct: parseNumber(dividendFields.annualDividendYieldPct),
    taxRatePct: parseNumber(dividendFields.taxRatePct),
    targetMonthlyDividend: parseNumber(dividendFields.targetMonthlyDividend),
  });
  const metricsResult = calculateFinancialMetrics({
    netIncome: parseNumber(metricsFields.netIncome),
    equity: parseNumber(metricsFields.equity),
    sharesOutstanding: parseNumber(metricsFields.sharesOutstanding),
    currentPrice: parseNumber(metricsFields.currentPrice),
    dividendPerShare: parseNumber(metricsFields.dividendPerShare),
    freeCashFlow: parseNumber(metricsFields.freeCashFlow),
    ebitda: parseNumber(metricsFields.ebitda),
    totalDebt: parseNumber(metricsFields.totalDebt),
    cashAndEquivalents: parseNumber(metricsFields.cashAndEquivalents),
  });
  const valuationResult = calculateValuationBridge({
    currentPrice: parseNumber(valuationFields.currentPrice),
    expectedEps: parseNumber(valuationFields.expectedEps),
    targetPer: parseNumber(valuationFields.targetPer),
    sharesOutstanding: parseNumber(valuationFields.sharesOutstanding),
  });
  const dcfResult = calculateDcfValuation({
    baseFreeCashFlow: parseNumber(dcfFields.baseFreeCashFlow),
    growthRatePct: parseNumber(dcfFields.growthRatePct),
    discountRatePct: parseNumber(dcfFields.discountRatePct),
    terminalGrowthPct: parseNumber(dcfFields.terminalGrowthPct),
    netCash: parseNumber(dcfFields.netCash),
    sharesOutstanding: parseNumber(dcfFields.sharesOutstanding),
    currentPrice: parseNumber(dcfFields.currentPrice),
  });
  const reverseDcfResult = calculateReverseDcf({
    baseFreeCashFlow: parseNumber(dcfFields.baseFreeCashFlow),
    discountRatePct: parseNumber(dcfFields.discountRatePct),
    terminalGrowthPct: parseNumber(dcfFields.terminalGrowthPct),
    netCash: parseNumber(dcfFields.netCash),
    sharesOutstanding: parseNumber(dcfFields.sharesOutstanding),
    currentPrice: parseNumber(dcfFields.currentPrice),
  });
  const dcfSensitivity =
    dcfResult !== null
      ? buildDcfSensitivityTable({
          baseFreeCashFlow: parseNumber(dcfFields.baseFreeCashFlow),
          growthRatePct: parseNumber(dcfFields.growthRatePct),
          discountRatePct: parseNumber(dcfFields.discountRatePct),
          terminalGrowthPct: parseNumber(dcfFields.terminalGrowthPct),
          netCash: parseNumber(dcfFields.netCash),
          sharesOutstanding: parseNumber(dcfFields.sharesOutstanding),
          currentPrice: parseNumber(dcfFields.currentPrice),
        })
      : [];
  const averageDownHasWeights =
    averageDownResult !== null &&
    averageDownResult.positionWeightAfterPct !== null &&
    averageDownResult.positionWeightBeforePct !== null;

  const fxDominantLabel =
    fxResult !== null
      ? Math.abs(fxResult.stockEffectKrw) >= Math.abs(fxResult.fxEffectKrw)
        ? "주가 변화가 손익의 중심입니다."
      : "환율 변화가 손익에 더 크게 기여했습니다."
      : "미국주식이나 해외 ETF 손익을 원화 기준으로 분해해 볼 수 있습니다.";
  const fxConverterUsdToKrw =
    latestUsdKrw !== null ? parseNumber(fxConverterFields.usdAmount) * latestUsdKrw : null;
  const fxConverterKrwToUsd =
    latestUsdKrw !== null ? parseNumber(fxConverterFields.krwAmount) / latestUsdKrw : null;
  const latestUsdKrwLabel =
    latestUsdKrw !== null
      ? `USD/KRW ${formatWon(latestUsdKrw, 2)}`
      : "최신 USD/KRW를 불러오지 못했습니다.";
  const latestUsdKrwMeta =
    latestUsdKrw !== null
      ? `${formatSignedPercent(latestUsdKrwChangePct, 2)} · ${formatDateTime(latestUsdKrwUpdatedAt)}`
      : "환율 값을 직접 입력해도 계산은 가능합니다.";

  const averageDownWeightMessage =
    averageDownHasWeights
      ? `비중이 ${formatPercent(averageDownResult.positionWeightBeforePct)}에서 ${formatPercent(
          averageDownResult.positionWeightAfterPct,
        )}로 바뀝니다.`
      : "포트폴리오 총액을 넣으면 종목 쏠림까지 같이 계산합니다.";

  const reverseDcfMessage =
    reverseDcfResult !== null
      ? `현재 가격은 향후 5년 FCF가 연평균 ${formatPercent(reverseDcfResult.impliedGrowthRatePct)} 성장하는 시나리오에 가깝습니다.`
      : "현재가를 정당화하는 성장률을 찾을 수 없으면 입력 가정을 다시 확인해 주세요.";
  const applyLatestFxToTargetExitSell = () => {
    if (!latestUsdKrwText) {
      return;
    }

    setTargetExitFields((current) => ({
      ...current,
      sellFxRate: latestUsdKrwText,
    }));
  };
  const applyLatestFxToTargetExitBoth = () => {
    if (!latestUsdKrwText) {
      return;
    }

    setTargetExitFields((current) => ({
      ...current,
      buyFxRate: latestUsdKrwText,
      sellFxRate: latestUsdKrwText,
    }));
  };
  const applyLatestFxToBreakdownCurrent = () => {
    if (!latestUsdKrwText) {
      return;
    }

    setFxFields((current) => ({
      ...current,
      currentFxRate: latestUsdKrwText,
    }));
  };
  const applyLatestFxToBreakdownBoth = () => {
    if (!latestUsdKrwText) {
      return;
    }

    setFxFields((current) => ({
      ...current,
      buyFxRate: latestUsdKrwText,
      currentFxRate: latestUsdKrwText,
    }));
  };

  return (
    <main className="quantPage">
      <section className="card quantHeroCard">
        <div className="quantHeroCopy">
          <span className="quantHeroEyebrow">별도 도구</span>
          <h1>주식용 퀀트 계산기</h1>
          <p>
            본전, 평단, 환율, 배당, 재무지표, DCF까지 한 화면에서 계산하는
            분리형 시나리오 도구입니다.
          </p>
        </div>
        <div className="quantHeroChips" aria-label="빠른 이동">
          <a href="#loss-recovery">본전 계산</a>
          <a href="#average-down">평단 계산</a>
          <a href="#target-exit">목표가 계산</a>
          <a href="#fx-breakdown">환율 손익</a>
          <a href="#dividend-income">배당 계산</a>
          <a href="#valuation-bridge">적정가 역산</a>
          <a href="#dcf-lab">DCF</a>
        </div>
        <div className="quantNotice">
          계산 결과는 입력값 기반 참고용입니다. 매수·매도 추천이 아니며 세금, 수수료,
          환율, 공시 정정에 따라 실제 결과는 달라질 수 있습니다.
        </div>
        <div className="quantLiveBar">
          <strong>{latestUsdKrwLabel}</strong>
          <span>{latestUsdKrwMeta}</span>
        </div>
      </section>

      <SectionTitle
        eyebrow="생존 계산"
        title="손실과 추가 매수의 의미를 먼저 읽습니다"
        description="초보가 가장 자주 묻는 본전, 물타기, 손절 기준을 바로 계산합니다."
      />
      <div className="quantToolGrid">
        <article id="loss-recovery" className="card quantToolCard">
          <div className="quantToolHeader">
            <div>
              <span className="quantToolBadge">손실 복구</span>
              <h3>본전까지 필요한 상승률</h3>
            </div>
            <p>손실률보다 회복에 필요한 상승률이 왜 더 큰지 바로 확인합니다.</p>
          </div>
          <div className="quantToolLayout">
            <div className="quantFieldGrid">
              <NumberField
                label="현재 손실률"
                value={recoveryFields.lossPct}
                onChange={setField(setRecoveryFields, "lossPct")}
                suffix="%"
                step="0.1"
              />
            </div>
            <MetricGrid>
              <Metric
                label="본전까지 필요 상승률"
                value={formatSignedPercent(recoveryResult?.neededGainRatePct)}
                tone={recoveryResult ? "positive" : "default"}
                note="하락 후 남은 가격을 기준으로 다시 올라와야 합니다."
              />
              <Metric
                label="현재 남아 있는 자본"
                value={formatPercent(recoveryResult?.remainingCapitalPct)}
                tone="accent"
              />
            </MetricGrid>
          </div>
          <p className="quantInsight">
            {recoveryResult
              ? recoveryResult.lossRatePct >= 40
                ? "손실 구간이 깊어질수록 회복 난도는 기하급수적으로 커집니다."
                : "손실률이 작을 때는 회복 난도도 비교적 완만하게 움직입니다."
              : "손실률을 입력하면 회복에 필요한 상승률을 계산합니다."}
          </p>
          <Formula title="계산식 보기" expression="필요 상승률 = (1 / (1 - 손실률)) - 1" />
        </article>

        <article id="average-down" className="card quantToolCard">
          <div className="quantToolHeader">
            <div>
              <span className="quantToolBadge">평단 / 물타기</span>
              <h3>추가 매수 후 새 평단</h3>
            </div>
            <p>평단만이 아니라 비중과 추가 하락 리스크까지 같이 봅니다.</p>
          </div>
          <div className="quantSegmented" role="tablist" aria-label="추가 매수 입력 방식">
            <button
              type="button"
              className={averageDownMode === "quantity" ? "isActive" : ""}
              onClick={() => setAverageDownMode("quantity")}
            >
              수량 입력
            </button>
            <button
              type="button"
              className={averageDownMode === "amount" ? "isActive" : ""}
              onClick={() => setAverageDownMode("amount")}
            >
              금액 입력
            </button>
          </div>
          <div className="quantToolLayout">
            <div className="quantFieldGrid">
              <NumberField
                label="현재 평단"
                value={averageDownFields.currentAveragePrice}
                onChange={setField(setAverageDownFields, "currentAveragePrice")}
                suffix="원"
              />
              <NumberField
                label="보유 수량"
                value={averageDownFields.currentQuantity}
                onChange={setField(setAverageDownFields, "currentQuantity")}
                suffix="주"
              />
              <NumberField
                label="현재가"
                value={averageDownFields.currentPrice}
                onChange={setField(setAverageDownFields, "currentPrice")}
                suffix="원"
              />
              <NumberField
                label="추가 매수 가격"
                value={averageDownFields.extraBuyPrice}
                onChange={setField(setAverageDownFields, "extraBuyPrice")}
                suffix="원"
              />
              {averageDownMode === "quantity" ? (
                <NumberField
                  label="추가 매수 수량"
                  value={averageDownFields.extraQuantity}
                  onChange={setField(setAverageDownFields, "extraQuantity")}
                  suffix="주"
                />
              ) : (
                <NumberField
                  label="추가 매수 금액"
                  value={averageDownFields.extraAmount}
                  onChange={setField(setAverageDownFields, "extraAmount")}
                  suffix="원"
                />
              )}
              <NumberField
                label="포트폴리오 총액"
                value={averageDownFields.portfolioValue}
                onChange={setField(setAverageDownFields, "portfolioValue")}
                suffix="원"
                hint="선택 입력"
              />
              <NumberField
                label="추가 하락 가정"
                value={averageDownFields.downsideShockPct}
                onChange={setField(setAverageDownFields, "downsideShockPct")}
                suffix="%"
              />
            </div>
            <MetricGrid>
              <Metric
                label="새 평단"
                value={formatWon(averageDownResult?.newAveragePrice, 0)}
                tone="accent"
              />
              <Metric
                label="총 보유 수량"
                value={formatShares(averageDownResult?.totalQuantity, 2)}
              />
              <Metric
                label="현재가 기준 본전까지"
                value={formatSignedPercent(averageDownResult?.breakevenGainPctFromCurrent)}
                tone={getToneFromSignedValue(averageDownResult?.breakevenGainPctFromCurrent)}
              />
              <Metric
                label="추가 하락 시 손실 증가"
                value={formatCompactWon(averageDownResult?.incrementalLossAtShock)}
                tone="negative"
              />
            </MetricGrid>
          </div>
          <p className="quantInsight">{averageDownWeightMessage}</p>
          <Formula
            title="계산식 보기"
            expression="새 평단 = (기존 평단×보유 수량 + 추가 매수가×추가 수량) / 총 수량"
          />
        </article>

        <article id="stop-position" className="card quantToolCard">
          <div className="quantToolHeader">
            <div>
              <span className="quantToolBadge">리스크</span>
              <h3>손절가 기준 포지션 크기</h3>
            </div>
            <p>허용 손실을 먼저 고정하고 몇 주까지 들고 갈 수 있는지 계산합니다.</p>
          </div>
          <div className="quantToolLayout">
            <div className="quantFieldGrid">
              <NumberField
                label="허용 손실금"
                value={stopFields.allowedLossAmount}
                onChange={setField(setStopFields, "allowedLossAmount")}
                suffix="원"
              />
              <NumberField
                label="매수 가격"
                value={stopFields.entryPrice}
                onChange={setField(setStopFields, "entryPrice")}
                suffix="원"
              />
              <NumberField
                label="손절 가격"
                value={stopFields.stopPrice}
                onChange={setField(setStopFields, "stopPrice")}
                suffix="원"
              />
            </div>
            <MetricGrid>
              <Metric
                label="권장 최대 수량"
                value={stopResult ? `${INTEGER_FORMATTER.format(stopResult.recommendedWholeShares)}주` : "-"}
                tone="accent"
              />
              <Metric label="이론상 최대 수량" value={formatShares(stopResult?.maxQuantity)} />
              <Metric label="투입 가능 금액" value={formatCompactWon(stopResult?.capitalRequired)} />
              <Metric label="주당 허용 손실" value={formatWon(stopResult?.lossPerShare, 0)} tone="negative" />
            </MetricGrid>
          </div>
          <p className="quantInsight">
            {stopResult
              ? `정수 주 기준으로는 ${INTEGER_FORMATTER.format(stopResult.recommendedWholeShares)}주까지가 보수적인 상한선입니다.`
              : "매수가보다 낮은 손절가를 넣어야 계산됩니다."}
          </p>
          <Formula
            title="계산식 보기"
            expression="매수 가능 수량 = 허용 손실금 / (매수가 - 손절가)"
          />
        </article>
      </div>

      <SectionTitle
        eyebrow="수익 계산"
        title="팔 때 얼마 남는지, 환율이 얼마나 섞였는지 분해합니다"
        description="목표가, 세후 손익, 해외주식 환율 효과, 배당 현금흐름을 한 번에 확인합니다."
      />
      <div className="quantToolGrid">
        <article id="fx-converter" className="card quantToolCard">
          <div className="quantToolHeader">
            <div>
              <span className="quantToolBadge">간편 환산</span>
              <h3>최신 달러 환산</h3>
            </div>
            <p>지금 들어온 USD/KRW 기준으로 달러와 원화를 바로 서로 바꿔 봅니다.</p>
          </div>
          <div className="quantFxToolbar">
            <div className="quantFxChip">
              <strong>{latestUsdKrwLabel}</strong>
              <span>{latestUsdKrwMeta}</span>
            </div>
          </div>
          <div className="quantToolLayout">
            <div className="quantFieldGrid">
              <NumberField
                label="달러 금액"
                value={fxConverterFields.usdAmount}
                onChange={setField(setFxConverterFields, "usdAmount")}
                suffix="USD"
              />
              <NumberField
                label="원화 금액"
                value={fxConverterFields.krwAmount}
                onChange={setField(setFxConverterFields, "krwAmount")}
                suffix="원"
              />
            </div>
            <MetricGrid>
              <Metric
                label="달러 → 원화"
                value={formatWon(fxConverterUsdToKrw, 0)}
                tone="accent"
              />
              <Metric
                label="원화 → 달러"
                value={
                  latestUsdKrw !== null && Number.isFinite(fxConverterKrwToUsd ?? Number.NaN)
                    ? `${formatNumber(fxConverterKrwToUsd, 2)} USD`
                    : "-"
                }
                tone="positive"
              />
            </MetricGrid>
          </div>
          <p className="quantInsight">
            달러 입력값은 최신 환율로 바로 원화 환산되고, 미국주식 계산 카드에도 같은 기준값을 빠르게 넣을 수 있습니다.
          </p>
        </article>

        <article id="target-exit" className="card quantToolCard">
          <div className="quantToolHeader">
            <div>
              <span className="quantToolBadge">익절 / 목표가</span>
              <h3>목표 수익률 기준 매도가</h3>
            </div>
            <p>수수료, 세금, 환율을 반영해 실제로 얼마에 팔아야 하는지 계산합니다.</p>
          </div>
          <div className="quantFxToolbar">
            <div className="quantFxChip">
              <strong>{latestUsdKrwLabel}</strong>
              <span>달러 주식이면 매도 환율이나 매수·매도 환율에 바로 넣어 계산할 수 있습니다.</span>
            </div>
            <div className="quantActionRow">
              <button type="button" className="quantActionButton" onClick={applyLatestFxToTargetExitSell}>
                매도 환율에 적용
              </button>
              <button type="button" className="quantActionButton" onClick={applyLatestFxToTargetExitBoth}>
                매수/매도 둘 다 적용
              </button>
            </div>
          </div>
          <div className="quantToolLayout">
            <div className="quantFieldGrid">
              <NumberField
                label="평단"
                value={targetExitFields.averagePrice}
                onChange={setField(setTargetExitFields, "averagePrice")}
                suffix="원 또는 달러"
              />
              <NumberField
                label="보유 수량"
                value={targetExitFields.quantity}
                onChange={setField(setTargetExitFields, "quantity")}
                suffix="주"
              />
              <NumberField
                label="목표 순수익률"
                value={targetExitFields.targetNetReturnPct}
                onChange={setField(setTargetExitFields, "targetNetReturnPct")}
                suffix="%"
              />
              <NumberField
                label="매도 수수료"
                value={targetExitFields.sellFeePct}
                onChange={setField(setTargetExitFields, "sellFeePct")}
                suffix="%"
              />
              <NumberField
                label="세율"
                value={targetExitFields.taxRatePct}
                onChange={setField(setTargetExitFields, "taxRatePct")}
                suffix="%"
              />
              <NumberField
                label="매수 환율"
                value={targetExitFields.buyFxRate}
                onChange={setField(setTargetExitFields, "buyFxRate")}
                suffix="원"
              />
              <NumberField
                label="매도 환율"
                value={targetExitFields.sellFxRate}
                onChange={setField(setTargetExitFields, "sellFxRate")}
                suffix="원"
              />
            </div>
            <MetricGrid>
              <Metric
                label="목표 매도가"
                value={formatNumber(targetExitResult?.targetPricePerShare, 2)}
                tone="accent"
                note="입력 통화 기준 1주 가격"
              />
              <Metric
                label="원화 환산 목표가"
                value={formatWon(targetExitResult?.targetPriceInKrw, 0)}
              />
              <Metric
                label="예상 순이익"
                value={formatCompactWon(targetExitResult?.netProfit)}
                tone="positive"
              />
              <Metric
                label="세후 수익률"
                value={formatSignedPercent(targetExitResult?.netReturnPct)}
                tone="positive"
              />
            </MetricGrid>
          </div>
          <p className="quantInsight">
            {targetExitResult
              ? `세금과 수수료를 빼고도 목표를 맞추려면 대략 ${formatNumber(
                  targetExitResult.targetPricePerShare,
                  2,
                )} 수준까지는 도달해야 합니다.`
              : "수익률, 수량, 환율을 넣으면 세후 목표 매도가를 계산합니다."}
          </p>
          <Formula
            title="계산식 보기"
            expression="목표 매도가 = 목표 총매각대금 / (보유 수량 × 매도 환율)"
          />
        </article>

        <article id="fx-breakdown" className="card quantToolCard">
          <div className="quantToolHeader">
            <div>
              <span className="quantToolBadge">해외주식</span>
              <h3>환율 포함 진짜 손익</h3>
            </div>
            <p>주가 효과와 환율 효과를 분리해서 무엇이 수익을 만들었는지 봅니다.</p>
          </div>
          <div className="quantFxToolbar">
            <div className="quantFxChip">
              <strong>{latestUsdKrwLabel}</strong>
              <span>현재 환율만 최신값으로 넣거나, 매수·현재 환율을 같은 기준으로 맞춰 볼 수 있습니다.</span>
            </div>
            <div className="quantActionRow">
              <button type="button" className="quantActionButton" onClick={applyLatestFxToBreakdownCurrent}>
                현재 환율에 적용
              </button>
              <button type="button" className="quantActionButton" onClick={applyLatestFxToBreakdownBoth}>
                매수/현재 둘 다 적용
              </button>
            </div>
          </div>
          <div className="quantToolLayout">
            <div className="quantFieldGrid">
              <NumberField
                label="매수 가격"
                value={fxFields.buyPrice}
                onChange={setField(setFxFields, "buyPrice")}
                suffix="달러"
              />
              <NumberField
                label="현재 가격"
                value={fxFields.currentPrice}
                onChange={setField(setFxFields, "currentPrice")}
                suffix="달러"
              />
              <NumberField
                label="보유 수량"
                value={fxFields.quantity}
                onChange={setField(setFxFields, "quantity")}
                suffix="주"
              />
              <NumberField
                label="매수 환율"
                value={fxFields.buyFxRate}
                onChange={setField(setFxFields, "buyFxRate")}
                suffix="원"
              />
              <NumberField
                label="현재 환율"
                value={fxFields.currentFxRate}
                onChange={setField(setFxFields, "currentFxRate")}
                suffix="원"
              />
              <NumberField
                label="주당 배당"
                value={fxFields.dividendPerShare}
                onChange={setField(setFxFields, "dividendPerShare")}
                suffix="달러"
              />
              <NumberField
                label="배당세율"
                value={fxFields.dividendTaxPct}
                onChange={setField(setFxFields, "dividendTaxPct")}
                suffix="%"
              />
            </div>
            <MetricGrid>
              <Metric
                label="총 수익률"
                value={formatSignedPercent(fxResult?.totalReturnPct)}
                tone={getToneFromSignedValue(fxResult?.totalReturnPct)}
              />
              <Metric
                label="주가 효과"
                value={formatSignedPercent(fxResult?.stockEffectPct)}
                tone={getToneFromSignedValue(fxResult?.stockEffectPct)}
              />
              <Metric
                label="환율 효과"
                value={formatSignedPercent(fxResult?.fxEffectPct)}
                tone={getToneFromSignedValue(fxResult?.fxEffectPct)}
              />
              <Metric
                label="배당 효과"
                value={formatSignedPercent(fxResult?.dividendEffectPct)}
                tone={getToneFromSignedValue(fxResult?.dividendEffectPct)}
              />
            </MetricGrid>
          </div>
          <p className="quantInsight">{fxDominantLabel}</p>
          <Formula
            title="계산식 보기"
            expression="총 손익 = 현재 평가금액 + 세후 배당금 - 최초 투자 원화 금액"
          />
        </article>

        <article id="dividend-income" className="card quantToolCard">
          <div className="quantToolHeader">
            <div>
              <span className="quantToolBadge">현금흐름</span>
              <h3>배당 월급 계산</h3>
            </div>
            <p>현재 투자금 기준 월 배당과 목표 월 배당에 필요한 투자금을 같이 보여줍니다.</p>
          </div>
          <div className="quantToolLayout">
            <div className="quantFieldGrid">
              <NumberField
                label="투자금"
                value={dividendFields.investmentAmount}
                onChange={setField(setDividendFields, "investmentAmount")}
                suffix="원"
              />
              <NumberField
                label="예상 배당수익률"
                value={dividendFields.annualDividendYieldPct}
                onChange={setField(setDividendFields, "annualDividendYieldPct")}
                suffix="%"
              />
              <NumberField
                label="세율"
                value={dividendFields.taxRatePct}
                onChange={setField(setDividendFields, "taxRatePct")}
                suffix="%"
              />
              <NumberField
                label="목표 월 배당"
                value={dividendFields.targetMonthlyDividend}
                onChange={setField(setDividendFields, "targetMonthlyDividend")}
                suffix="원"
              />
            </div>
            <MetricGrid>
              <Metric label="세후 월 배당" value={formatCompactWon(dividendResult?.netMonthlyDividend)} tone="accent" />
              <Metric label="세후 연 배당" value={formatCompactWon(dividendResult?.netAnnualDividend)} />
              <Metric
                label="목표 월 배당 필요 자금"
                value={formatCompactWon(dividendResult?.requiredCapitalForTargetMonthlyNet)}
                tone="positive"
              />
              <Metric label="세전 월 배당" value={formatCompactWon(dividendResult?.grossMonthlyDividend)} />
            </MetricGrid>
          </div>
          <p className="quantInsight">
            {dividendResult
              ? `현재 설정이라면 연간 세후 ${formatCompactWon(
                  dividendResult.netAnnualDividend,
                )} 정도의 현금흐름을 기대하는 구조입니다.`
              : "배당수익률과 세율을 넣으면 월 배당과 필요 자금을 계산합니다."}
          </p>
          <Formula
            title="계산식 보기"
            expression="목표 투자금 = 목표 월 배당 / (연 배당수익률 × (1-세율) / 12)"
          />
        </article>
      </div>

      <SectionTitle
        eyebrow="밸류 계산"
        title="재무제표 숫자를 주가 언어로 번역합니다"
        description="EPS, PER, PBR부터 필요한 실적 역산, DCF와 Reverse DCF까지 이어집니다."
      />
      <div className="quantToolGrid">
        <article id="financial-metrics" className="card quantToolCard">
          <div className="quantToolHeader">
            <div>
              <span className="quantToolBadge">재무 번역기</span>
              <h3>기본 밸류에이션 지표</h3>
            </div>
            <p>순이익과 자본, 주식 수를 EPS와 PER 언어로 바꿔 읽습니다.</p>
          </div>
          <div className="quantToolLayout">
            <div className="quantFieldGrid">
              <NumberField
                label="순이익"
                value={metricsFields.netIncome}
                onChange={setField(setMetricsFields, "netIncome")}
                suffix="원"
              />
              <NumberField
                label="자본"
                value={metricsFields.equity}
                onChange={setField(setMetricsFields, "equity")}
                suffix="원"
              />
              <NumberField
                label="유통주식 수"
                value={metricsFields.sharesOutstanding}
                onChange={setField(setMetricsFields, "sharesOutstanding")}
                suffix="주"
              />
              <NumberField
                label="현재 주가"
                value={metricsFields.currentPrice}
                onChange={setField(setMetricsFields, "currentPrice")}
                suffix="원"
              />
              <NumberField
                label="주당 배당금"
                value={metricsFields.dividendPerShare}
                onChange={setField(setMetricsFields, "dividendPerShare")}
                suffix="원"
              />
              <NumberField
                label="FCF"
                value={metricsFields.freeCashFlow}
                onChange={setField(setMetricsFields, "freeCashFlow")}
                suffix="원"
              />
              <NumberField
                label="EBITDA"
                value={metricsFields.ebitda}
                onChange={setField(setMetricsFields, "ebitda")}
                suffix="원"
              />
              <NumberField
                label="총차입금"
                value={metricsFields.totalDebt}
                onChange={setField(setMetricsFields, "totalDebt")}
                suffix="원"
              />
              <NumberField
                label="현금성 자산"
                value={metricsFields.cashAndEquivalents}
                onChange={setField(setMetricsFields, "cashAndEquivalents")}
                suffix="원"
              />
            </div>
            <MetricGrid>
              <Metric label="EPS" value={formatWon(metricsResult?.eps, 0)} tone="accent" />
              <Metric label="PER" value={formatMultiplier(metricsResult?.per)} />
              <Metric label="PBR" value={formatMultiplier(metricsResult?.pbr)} />
              <Metric label="ROE" value={formatPercent(metricsResult?.roePct)} tone="positive" />
              <Metric label="배당수익률" value={formatPercent(metricsResult?.dividendYieldPct)} />
              <Metric label="FCF Yield" value={formatPercent(metricsResult?.fcfYieldPct)} />
              <Metric label="시가총액" value={formatCompactWon(metricsResult?.marketCap)} />
              <Metric label="EV/EBITDA" value={formatMultiplier(metricsResult?.evToEbitda)} />
            </MetricGrid>
          </div>
          <p className="quantInsight">
            {metricsResult
              ? `현재 입력값 기준으로는 주당 ${formatWon(metricsResult.eps, 0)}를 벌고, 주가는 그 이익의 ${formatMultiplier(
                  metricsResult.per,
                )} 수준에서 거래되는 구조입니다.`
              : "순이익, 자본, 주식 수를 넣으면 핵심 지표를 자동 환산합니다."}
          </p>
          <Formula
            title="계산식 보기"
            expression="EPS = 순이익 / 주식 수, PER = 현재 주가 / EPS, ROE = 순이익 / 자본"
          />
        </article>

        <article id="valuation-bridge" className="card quantToolCard">
          <div className="quantToolHeader">
            <div>
              <span className="quantToolBadge">PER 역산</span>
              <h3>현재 주가가 요구하는 실적</h3>
            </div>
            <p>목표 PER을 기준으로 적정가를 계산하고, 현재 가격을 정당화하는 EPS를 역산합니다.</p>
          </div>
          <div className="quantToolLayout">
            <div className="quantFieldGrid">
              <NumberField
                label="현재 주가"
                value={valuationFields.currentPrice}
                onChange={setField(setValuationFields, "currentPrice")}
                suffix="원"
              />
              <NumberField
                label="예상 EPS"
                value={valuationFields.expectedEps}
                onChange={setField(setValuationFields, "expectedEps")}
                suffix="원"
              />
              <NumberField
                label="목표 PER"
                value={valuationFields.targetPer}
                onChange={setField(setValuationFields, "targetPer")}
                suffix="배"
              />
              <NumberField
                label="유통주식 수"
                value={valuationFields.sharesOutstanding}
                onChange={setField(setValuationFields, "sharesOutstanding")}
                suffix="주"
              />
            </div>
            <MetricGrid>
              <Metric label="목표 주가" value={formatWon(valuationResult?.targetPrice, 0)} tone="accent" />
              <Metric
                label="현재가 정당화 필요 EPS"
                value={formatWon(valuationResult?.requiredEpsForCurrentPrice, 0)}
              />
              <Metric
                label="현재가 정당화 필요 순이익"
                value={formatCompactWon(valuationResult?.requiredNetIncomeForCurrentPrice)}
              />
              <Metric
                label="현재가 대비 괴리"
                value={formatSignedPercent(valuationResult?.upsideDownsidePct)}
                tone={getToneFromSignedValue(valuationResult?.upsideDownsidePct)}
              />
            </MetricGrid>
          </div>
          <p className="quantInsight">
            {valuationResult
              ? `예상 EPS에 목표 PER을 적용하면 적정가는 ${formatWon(
                  valuationResult.targetPrice,
                  0,
                )}이고, 지금 가격을 유지하려면 더 높은 이익이 필요합니다.`
              : "현재가, 예상 EPS, 목표 PER을 넣으면 적정가와 필요 실적을 계산합니다."}
          </p>
          <Formula
            title="계산식 보기"
            expression="목표 주가 = 예상 EPS × 목표 PER, 필요 순이익 = (현재 주가 / 목표 PER) × 주식 수"
          />
        </article>
      </div>

      <article id="dcf-lab" className="card quantToolCard quantToolCardWide">
        <div className="quantToolHeader">
          <div>
            <span className="quantToolBadge">고급 밸류</span>
            <h3>DCF / Reverse DCF 실험실</h3>
          </div>
          <p>기준 FCF와 성장률, 할인율, 말기 성장률을 바탕으로 주당가치와 시장이 요구하는 성장률을 동시에 계산합니다.</p>
        </div>
        <div className="quantToolLayout quantToolLayoutWide">
          <div className="quantFieldGrid">
            <NumberField
              label="기준 FCF"
              value={dcfFields.baseFreeCashFlow}
              onChange={setField(setDcfFields, "baseFreeCashFlow")}
              suffix="원"
            />
            <NumberField
              label="5년 성장률"
              value={dcfFields.growthRatePct}
              onChange={setField(setDcfFields, "growthRatePct")}
              suffix="%"
            />
            <NumberField
              label="할인율"
              value={dcfFields.discountRatePct}
              onChange={setField(setDcfFields, "discountRatePct")}
              suffix="%"
            />
            <NumberField
              label="말기 성장률"
              value={dcfFields.terminalGrowthPct}
              onChange={setField(setDcfFields, "terminalGrowthPct")}
              suffix="%"
            />
            <NumberField
              label="순현금(순차입은 음수)"
              value={dcfFields.netCash}
              onChange={setField(setDcfFields, "netCash")}
              suffix="원"
            />
            <NumberField
              label="유통주식 수"
              value={dcfFields.sharesOutstanding}
              onChange={setField(setDcfFields, "sharesOutstanding")}
              suffix="주"
            />
            <NumberField
              label="현재 주가"
              value={dcfFields.currentPrice}
              onChange={setField(setDcfFields, "currentPrice")}
              suffix="원"
            />
          </div>
          <MetricGrid>
            <Metric
              label="내재 주당가치"
              value={formatWon(dcfResult?.intrinsicPricePerShare, 0)}
              tone="accent"
            />
            <Metric
              label="현재가 대비 괴리"
              value={formatSignedPercent(dcfResult?.gapVsCurrentPricePct)}
              tone={getToneFromSignedValue(dcfResult?.gapVsCurrentPricePct)}
            />
            <Metric label="기업가치" value={formatCompactWon(dcfResult?.enterpriseValue)} />
            <Metric label="지분가치" value={formatCompactWon(dcfResult?.equityValue)} />
            <Metric
              label="Reverse DCF 성장률"
              value={formatPercent(reverseDcfResult?.impliedGrowthRatePct)}
              tone="positive"
            />
            <Metric
              label="말기 가치 현재가치"
              value={formatCompactWon(dcfResult?.presentValueOfTerminal)}
            />
          </MetricGrid>
        </div>
        <p className="quantInsight">{reverseDcfMessage}</p>

        {dcfResult ? (
          <>
            <div className="quantMiniSection">
              <h4>5년 FCF 투영</h4>
              <div className="quantProjectionGrid">
                {dcfResult.projection.map((row) => (
                  <div key={row.year} className="quantProjectionItem">
                    <span>Year {row.year}</span>
                    <strong>{formatCompactWon(row.freeCashFlow)}</strong>
                    <small>현재가치 {formatCompactWon(row.presentValue)}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="quantMiniSection">
              <h4>민감도 표</h4>
              <div className="quantSensitivityWrap">
                <table className="quantSensitivityTable">
                  <thead>
                    <tr>
                      <th>성장률 / 할인율</th>
                      {dcfSensitivity[0]?.cells.map((cell) => (
                        <th key={cell.discountRatePct}>{formatPercent(cell.discountRatePct, 0)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dcfSensitivity.map((row) => (
                      <tr key={row.growthRatePct}>
                        <th>{formatPercent(row.growthRatePct, 0)}</th>
                        {row.cells.map((cell) => (
                          <td key={`${row.growthRatePct}-${cell.discountRatePct}`}>
                            {cell.intrinsicPricePerShare === null
                              ? "-"
                              : INTEGER_FORMATTER.format(Math.round(cell.intrinsicPricePerShare))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}

        <Formula
          title="계산식 보기"
          expression="기업가치 = 5년 FCF 현재가치 합 + 말기 가치 현재가치 / Reverse DCF는 현재가에 맞는 성장률을 역산"
        />
      </article>
    </main>
  );
}
