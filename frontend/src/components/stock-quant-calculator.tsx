"use client";

import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { calculateAverageDown, calculateTargetExit } from "@/lib/stock-quant-calculator";

type StockQuantCalculatorProps = {
  latestUsdKrw?: number | null;
  latestUsdKrwUpdatedAt?: string | null;
  latestUsdKrwChangePct?: number | null;
};

type ToolId = "return" | "opportunity" | "average" | "target" | "dividend";
type CurrencyMode = "krw" | "usd";
type FxRateMode = "latest" | "manual";
type FieldState = Record<string, string>;
type ResultTone = "default" | "positive" | "negative" | "accent";

type FieldController = {
  label: string;
  value: string;
  suffix?: string;
  setValue: (value: string) => void;
};

type MetricItem = {
  label: string;
  value: string;
  tone?: ResultTone;
  note?: string;
};

const TOOL_OPTIONS: Array<{
  id: ToolId;
  label: string;
  keyLabel: string;
  description: string;
  fieldKeys: string[];
}> = [
  {
    id: "return",
    label: "수익률",
    keyLabel: "RET",
    description: "원래 가격 대비 현재 수익률",
    fieldKeys: ["return.originalPrice", "return.currentPrice", "return.investmentAmount"],
  },
  {
    id: "opportunity",
    label: "기회비용",
    keyLabel: "OC",
    description: "같은 예산을 두 종목에 넣었을 때의 차이",
    fieldKeys: [
      "opportunity.budgetAmount",
      "opportunity.stockOneOriginalPrice",
      "opportunity.stockOneCurrentPrice",
      "opportunity.stockTwoOriginalPrice",
      "opportunity.stockTwoCurrentPrice",
    ],
  },
  {
    id: "average",
    label: "물타기 계산기",
    keyLabel: "AVG",
    description: "추가 매수 후 평단과 본전 필요 상승률",
    fieldKeys: [
      "average.currentAveragePrice",
      "average.currentQuantity",
      "average.currentPrice",
      "average.extraBuyPrice",
      "average.extraQuantity",
      "average.extraAmount",
    ],
  },
  {
    id: "target",
    label: "목표가",
    keyLabel: "TP",
    description: "원하는 순수익률 기준 매도가",
    fieldKeys: [
      "target.averagePrice",
      "target.quantity",
      "target.targetNetReturnPct",
      "target.sellFeePct",
      "target.taxRatePct",
    ],
  },
  {
    id: "dividend",
    label: "배당 재투자",
    keyLabel: "DIV",
    description: "배당수익과 재투자 시 자산 변화",
    fieldKeys: [
      "dividend.investmentAmount",
      "dividend.annualDividendYieldPct",
      "dividend.taxRatePct",
      "dividend.years",
    ],
  },
];

const TOOL_DEFAULT_FIELD = TOOL_OPTIONS.reduce<Record<ToolId, string>>((acc, tool) => {
  acc[tool.id] = tool.fieldKeys[0];
  return acc;
}, {} as Record<ToolId, string>);

const KEY_ROWS = [
  ["7", "8", "9", "back"],
  ["4", "5", "6", "clear"],
  ["1", "2", "3", "sign"],
  ["0", "00", ".", "next"],
] as const;

function parseNumber(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  return normalized ? Number(normalized) : Number.NaN;
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (!isFiniteNumber(value)) {
    return "-";
  }

  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatSignedPercent(value: number | null | undefined, digits = 1) {
  if (!isFiniteNumber(value)) {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, digits)}%`;
}

function formatPercent(value: number | null | undefined, digits = 1) {
  return isFiniteNumber(value) ? `${formatNumber(value, digits)}%` : "-";
}

function formatWon(value: number | null | undefined, digits = 0) {
  return isFiniteNumber(value) ? `${formatNumber(value, digits)}원` : "-";
}

function formatCompactWon(value: number | null | undefined) {
  if (!isFiniteNumber(value)) {
    return "-";
  }

  const absolute = Math.abs(value);
  if (absolute >= 1_0000_0000_0000) {
    return `${formatNumber(value / 1_0000_0000_0000, 2)}조 원`;
  }
  if (absolute >= 1_0000_0000) {
    return `${formatNumber(value / 1_0000_0000, 2)}억 원`;
  }
  if (absolute >= 10_000) {
    return `${formatNumber(value / 10_000, 2)}만 원`;
  }
  return formatWon(value);
}

function formatCurrency(value: number | null | undefined, currencyMode: CurrencyMode, digits = 0) {
  if (!isFiniteNumber(value)) {
    return "-";
  }

  return currencyMode === "usd" ? `${formatNumber(value, digits === 0 ? 2 : digits)} USD` : formatWon(value, digits);
}

function formatCompactCurrency(value: number | null | undefined, currencyMode: CurrencyMode) {
  if (!isFiniteNumber(value)) {
    return "-";
  }

  return currencyMode === "usd" ? `${formatNumber(value, 2)} USD` : formatCompactWon(value);
}

function formatShares(value: number | null | undefined, digits = 2) {
  return isFiniteNumber(value) ? `${formatNumber(value, digits)}주` : "-";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "갱신 대기";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "갱신 대기";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function setFieldValue<T extends FieldState>(
  setter: Dispatch<SetStateAction<T>>,
  key: keyof T,
  value: string,
) {
  setter((prev) => ({ ...prev, [key]: value }));
}

function getToneFromSignedValue(value: number | null | undefined): ResultTone {
  if (!isFiniteNumber(value)) {
    return "default";
  }
  return value >= 0 ? "positive" : "negative";
}

function calculateBudgetScenario(budget: number, originalPrice: number, currentPrice: number) {
  if (!Number.isFinite(budget) || !Number.isFinite(originalPrice) || !Number.isFinite(currentPrice)) {
    return null;
  }
  if (budget < 0 || originalPrice <= 0) {
    return null;
  }

  const shares = budget / originalPrice;
  const currentValue = shares * currentPrice;
  const profit = currentValue - budget;
  const returnPct = ((currentPrice / originalPrice) - 1) * 100;

  return { shares, currentValue, profit, returnPct };
}

function calculateDividendReinvestment(
  investmentAmount: number,
  annualDividendYieldPct: number,
  taxRatePct: number,
  years: number,
) {
  if (
    !Number.isFinite(investmentAmount) ||
    !Number.isFinite(annualDividendYieldPct) ||
    investmentAmount < 0 ||
    annualDividendYieldPct < 0
  ) {
    return null;
  }

  const normalizedYears = Number.isFinite(years) ? Math.max(0, years) : 0;
  const grossYield = annualDividendYieldPct / 100;
  const taxRate = Number.isFinite(taxRatePct) ? Math.max(0, taxRatePct) / 100 : 0;
  const netYield = grossYield * (1 - taxRate);
  const grossAnnualDividend = investmentAmount * grossYield;
  const netAnnualDividend = investmentAmount * netYield;
  const reinvestedValue = investmentAmount * (1 + netYield) ** normalizedYears;
  const reinvestedProfit = reinvestedValue - investmentAmount;
  const reinvestedReturnPct = investmentAmount > 0 ? (reinvestedProfit / investmentAmount) * 100 : 0;

  return {
    years: normalizedYears,
    netYieldPct: netYield * 100,
    grossAnnualDividend,
    netAnnualDividend,
    netMonthlyDividend: netAnnualDividend / 12,
    reinvestedValue,
    reinvestedProfit,
    reinvestedReturnPct,
  };
}

function ResultGrid({ items }: { items: MetricItem[] }) {
  return (
    <div className="quantMetricGrid">
      {items.map((item) => (
        <div key={item.label} className={`quantMetric quantMetric-${item.tone ?? "default"}`}>
          <span className="quantMetricLabel">{item.label}</span>
          <strong className="quantMetricValue">{item.value}</strong>
          {item.note ? <span className="quantMetricNote">{item.note}</span> : null}
        </div>
      ))}
    </div>
  );
}

function NumericField({
  fieldKey,
  label,
  value,
  onChange,
  activeField,
  setActiveField,
  suffix,
  hint,
}: {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  activeField: string;
  setActiveField: (field: string) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className={`quantField ${activeField === fieldKey ? "isEditing" : ""}`}>
      <span className="quantFieldLabel">{label}</span>
      <span className="quantInputWrap">
        <input
          className="quantInput"
          value={value}
          onChange={onChange}
          onFocus={() => setActiveField(fieldKey)}
          inputMode="decimal"
          step="any"
        />
        {suffix ? <span className="quantInputSuffix">{suffix}</span> : null}
      </span>
      {hint ? <span className="quantFieldHint">{hint}</span> : null}
    </label>
  );
}

function Formula({ children }: { children: string }) {
  return (
    <details className="quantFormula">
      <summary>계산식</summary>
      <code>{children}</code>
    </details>
  );
}

export function StockQuantCalculator({
  latestUsdKrw = null,
  latestUsdKrwUpdatedAt = null,
  latestUsdKrwChangePct = null,
}: StockQuantCalculatorProps) {
  const latestUsdKrwText = latestUsdKrw !== null ? formatNumber(latestUsdKrw, 2) : "";
  const latestUsdKrwMeta =
    latestUsdKrw !== null
      ? `${formatSignedPercent(latestUsdKrwChangePct, 2)} · ${formatDateTime(latestUsdKrwUpdatedAt)}`
      : "환율 데이터 확인 중";

  const [activeTool, setActiveTool] = useState<ToolId>("return");
  const [activeField, setActiveField] = useState<string>(TOOL_DEFAULT_FIELD.return);
  const [memo, setMemo] = useState("");
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("krw");
  const [fxRateMode, setFxRateMode] = useState<FxRateMode>("latest");
  const [manualFxRate, setManualFxRate] = useState(latestUsdKrwText || "1470");
  const [averageDownMode, setAverageDownMode] = useState<"quantity" | "amount">("quantity");
  const [returnFields, setReturnFields] = useState({
    originalPrice: "65000",
    currentPrice: "91000",
    investmentAmount: "1000000",
  });
  const [opportunityFields, setOpportunityFields] = useState({
    budgetAmount: "1000000",
    stockOneOriginalPrice: "65000",
    stockOneCurrentPrice: "91000",
    stockTwoOriginalPrice: "120000",
    stockTwoCurrentPrice: "156000",
  });
  const [averageDownFields, setAverageDownFields] = useState({
    currentAveragePrice: "80000",
    currentQuantity: "10",
    currentPrice: "60000",
    extraBuyPrice: "60000",
    extraQuantity: "5",
    extraAmount: "300000",
  });
  const [targetExitFields, setTargetExitFields] = useState({
    averagePrice: "72000",
    quantity: "15",
    targetNetReturnPct: "15",
    sellFeePct: "0.015",
    taxRatePct: "0",
  });
  const [dividendFields, setDividendFields] = useState({
    investmentAmount: "10000000",
    annualDividendYieldPct: "4.2",
    taxRatePct: "15.4",
    years: "10",
  });

  useEffect(() => {
    const storedMemo = window.localStorage.getItem("stock-calculator-memo");
    if (storedMemo) {
      setMemo(storedMemo);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("stock-calculator-memo", memo);
  }, [memo]);

  useEffect(() => {
    setActiveField(TOOL_DEFAULT_FIELD[activeTool]);
  }, [activeTool]);

  const currencySuffix = currencyMode === "usd" ? "USD" : "원";
  const manualUsdKrw = parseNumber(manualFxRate);
  const effectiveUsdKrw =
    fxRateMode === "latest" ? latestUsdKrw : Number.isFinite(manualUsdKrw) ? manualUsdKrw : null;
  const calculationFxRate = currencyMode === "usd" ? (effectiveUsdKrw ?? Number.NaN) : 1;
  const fxModeLabel =
    currencyMode === "usd"
      ? fxRateMode === "latest"
        ? "당일 기준가"
        : "직접 입력"
      : "원화 계산";
  const fxRateSummary =
    currencyMode === "usd"
      ? effectiveUsdKrw !== null && Number.isFinite(effectiveUsdKrw)
        ? `${fxModeLabel} · USD/KRW ${formatNumber(effectiveUsdKrw, 2)}`
        : "환율 입력 필요"
      : "원화 기준 계산";

  const fieldControllers: Record<string, FieldController> = {
    "return.originalPrice": {
      label: "원래 가격",
      value: returnFields.originalPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setReturnFields, "originalPrice", value),
    },
    "return.currentPrice": {
      label: "현재 가격",
      value: returnFields.currentPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setReturnFields, "currentPrice", value),
    },
    "return.investmentAmount": {
      label: "넣었을 금액",
      value: returnFields.investmentAmount,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setReturnFields, "investmentAmount", value),
    },
    "opportunity.budgetAmount": {
      label: "예산",
      value: opportunityFields.budgetAmount,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setOpportunityFields, "budgetAmount", value),
    },
    "opportunity.stockOneOriginalPrice": {
      label: "원래 가격",
      value: opportunityFields.stockOneOriginalPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setOpportunityFields, "stockOneOriginalPrice", value),
    },
    "opportunity.stockOneCurrentPrice": {
      label: "현재 가격",
      value: opportunityFields.stockOneCurrentPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setOpportunityFields, "stockOneCurrentPrice", value),
    },
    "opportunity.stockTwoOriginalPrice": {
      label: "원래 가격",
      value: opportunityFields.stockTwoOriginalPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setOpportunityFields, "stockTwoOriginalPrice", value),
    },
    "opportunity.stockTwoCurrentPrice": {
      label: "현재 가격",
      value: opportunityFields.stockTwoCurrentPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setOpportunityFields, "stockTwoCurrentPrice", value),
    },
    "average.currentAveragePrice": {
      label: "현재 평단",
      value: averageDownFields.currentAveragePrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setAverageDownFields, "currentAveragePrice", value),
    },
    "average.currentQuantity": {
      label: "보유 수량",
      value: averageDownFields.currentQuantity,
      suffix: "주",
      setValue: (value) => setFieldValue(setAverageDownFields, "currentQuantity", value),
    },
    "average.currentPrice": {
      label: "현재가",
      value: averageDownFields.currentPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setAverageDownFields, "currentPrice", value),
    },
    "average.extraBuyPrice": {
      label: "추가 매수가",
      value: averageDownFields.extraBuyPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setAverageDownFields, "extraBuyPrice", value),
    },
    "average.extraQuantity": {
      label: "추가 수량",
      value: averageDownFields.extraQuantity,
      suffix: "주",
      setValue: (value) => setFieldValue(setAverageDownFields, "extraQuantity", value),
    },
    "average.extraAmount": {
      label: "추가 금액",
      value: averageDownFields.extraAmount,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setAverageDownFields, "extraAmount", value),
    },
    "target.averagePrice": {
      label: "평단",
      value: targetExitFields.averagePrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setTargetExitFields, "averagePrice", value),
    },
    "target.quantity": {
      label: "보유 수량",
      value: targetExitFields.quantity,
      suffix: "주",
      setValue: (value) => setFieldValue(setTargetExitFields, "quantity", value),
    },
    "target.targetNetReturnPct": {
      label: "목표 순수익률",
      value: targetExitFields.targetNetReturnPct,
      suffix: "%",
      setValue: (value) => setFieldValue(setTargetExitFields, "targetNetReturnPct", value),
    },
    "target.sellFeePct": {
      label: "수수료",
      value: targetExitFields.sellFeePct,
      suffix: "%",
      setValue: (value) => setFieldValue(setTargetExitFields, "sellFeePct", value),
    },
    "target.taxRatePct": {
      label: "세율",
      value: targetExitFields.taxRatePct,
      suffix: "%",
      setValue: (value) => setFieldValue(setTargetExitFields, "taxRatePct", value),
    },
    "dividend.investmentAmount": {
      label: "투자금",
      value: dividendFields.investmentAmount,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setDividendFields, "investmentAmount", value),
    },
    "dividend.annualDividendYieldPct": {
      label: "연 배당수익률",
      value: dividendFields.annualDividendYieldPct,
      suffix: "%",
      setValue: (value) => setFieldValue(setDividendFields, "annualDividendYieldPct", value),
    },
    "dividend.taxRatePct": {
      label: "배당세율",
      value: dividendFields.taxRatePct,
      suffix: "%",
      setValue: (value) => setFieldValue(setDividendFields, "taxRatePct", value),
    },
    "dividend.years": {
      label: "재투자 기간",
      value: dividendFields.years,
      suffix: "년",
      setValue: (value) => setFieldValue(setDividendFields, "years", value),
    },
  };

  const activeToolInfo = TOOL_OPTIONS.find((tool) => tool.id === activeTool) ?? TOOL_OPTIONS[0];
  const activeController =
    fieldControllers[activeField] ?? fieldControllers[TOOL_DEFAULT_FIELD[activeTool]];

  const returnOriginalPrice = parseNumber(returnFields.originalPrice);
  const returnCurrentPrice = parseNumber(returnFields.currentPrice);
  const returnInvestmentAmount = parseNumber(returnFields.investmentAmount);
  const returnShares =
    Number.isFinite(returnOriginalPrice) && returnOriginalPrice > 0
      ? returnInvestmentAmount / returnOriginalPrice
      : null;
  const returnCurrentValue =
    returnShares !== null && Number.isFinite(returnCurrentPrice) && returnCurrentPrice > 0
      ? returnShares * returnCurrentPrice
      : null;
  const returnProfit =
    returnCurrentValue !== null && Number.isFinite(returnInvestmentAmount)
      ? returnCurrentValue - returnInvestmentAmount
      : null;
  const returnPct =
    Number.isFinite(returnOriginalPrice) &&
    returnOriginalPrice > 0 &&
    Number.isFinite(returnCurrentPrice)
      ? ((returnCurrentPrice / returnOriginalPrice) - 1) * 100
      : null;
  const returnCurrentValueKrw =
    currencyMode === "usd" && returnCurrentValue !== null && effectiveUsdKrw !== null
      ? returnCurrentValue * effectiveUsdKrw
      : null;

  const opportunityBudgetAmount = parseNumber(opportunityFields.budgetAmount);
  const stockOneScenario = calculateBudgetScenario(
    opportunityBudgetAmount,
    parseNumber(opportunityFields.stockOneOriginalPrice),
    parseNumber(opportunityFields.stockOneCurrentPrice),
  );
  const stockTwoScenario = calculateBudgetScenario(
    opportunityBudgetAmount,
    parseNumber(opportunityFields.stockTwoOriginalPrice),
    parseNumber(opportunityFields.stockTwoCurrentPrice),
  );
  const opportunityGap =
    stockOneScenario && stockTwoScenario
      ? stockTwoScenario.currentValue - stockOneScenario.currentValue
      : null;
  const opportunityGapAbs = opportunityGap !== null ? Math.abs(opportunityGap) : null;
  const opportunityWinnerLabel =
    opportunityGap === null
      ? "-"
      : opportunityGap > 0
        ? "주식 2 우위"
        : opportunityGap < 0
          ? "주식 1 우위"
          : "동일";
  const opportunityGapKrw =
    currencyMode === "usd" && opportunityGapAbs !== null && effectiveUsdKrw !== null
      ? opportunityGapAbs * effectiveUsdKrw
      : null;

  const averageDown = calculateAverageDown({
    currentAveragePrice: parseNumber(averageDownFields.currentAveragePrice),
    currentQuantity: parseNumber(averageDownFields.currentQuantity),
    currentPrice: parseNumber(averageDownFields.currentPrice),
    extraBuyPrice: parseNumber(averageDownFields.extraBuyPrice),
    extraQuantity:
      averageDownMode === "quantity" ? parseNumber(averageDownFields.extraQuantity) : null,
    extraAmount: averageDownMode === "amount" ? parseNumber(averageDownFields.extraAmount) : null,
    portfolioValue: null,
    downsideShockPct: null,
  });

  const targetExit = calculateTargetExit({
    averagePrice: parseNumber(targetExitFields.averagePrice),
    quantity: parseNumber(targetExitFields.quantity),
    targetNetReturnPct: parseNumber(targetExitFields.targetNetReturnPct),
    sellFeePct: parseNumber(targetExitFields.sellFeePct),
    taxRatePct: parseNumber(targetExitFields.taxRatePct),
    buyFxRate: calculationFxRate,
    sellFxRate: calculationFxRate,
  });
  const targetNetProfitInCurrency =
    targetExit && Number.isFinite(calculationFxRate) && calculationFxRate > 0
      ? targetExit.netProfit / calculationFxRate
      : null;
  const targetNetProceedsInCurrency =
    targetExit && Number.isFinite(calculationFxRate) && calculationFxRate > 0
      ? targetExit.netProceeds / calculationFxRate
      : null;

  const dividendReinvestment = calculateDividendReinvestment(
    parseNumber(dividendFields.investmentAmount),
    parseNumber(dividendFields.annualDividendYieldPct),
    parseNumber(dividendFields.taxRatePct),
    parseNumber(dividendFields.years),
  );

  const activeResults: MetricItem[] = (() => {
    switch (activeTool) {
      case "return":
        return [
          {
            label: "현재 환산금액",
            value: formatCompactCurrency(returnCurrentValue, currencyMode),
            tone: "accent",
          },
          {
            label: "손익",
            value: formatCompactCurrency(returnProfit, currencyMode),
            tone: getToneFromSignedValue(returnProfit),
          },
          {
            label: "수익률",
            value: formatSignedPercent(returnPct),
            tone: getToneFromSignedValue(returnPct),
          },
          {
            label: currencyMode === "usd" ? "원화 환산" : "살 수 있었던 수량",
            value: currencyMode === "usd" ? formatCompactWon(returnCurrentValueKrw) : formatShares(returnShares),
            tone: "default",
          },
        ];
      case "opportunity":
        return [
          {
            label: "기회비용 차이",
            value: formatCompactCurrency(opportunityGapAbs, currencyMode),
            tone: "accent",
          },
          {
            label: "비교 우위",
            value: opportunityWinnerLabel,
            tone: "default",
          },
          {
            label: "주식 1 현재가치",
            value: formatCompactCurrency(stockOneScenario?.currentValue, currencyMode),
            tone: getToneFromSignedValue(stockOneScenario?.profit),
          },
          {
            label: "주식 2 현재가치",
            value: formatCompactCurrency(stockTwoScenario?.currentValue, currencyMode),
            tone: getToneFromSignedValue(stockTwoScenario?.profit),
          },
          {
            label: currencyMode === "usd" ? "차이 원화환산" : "주식 1 수익률",
            value:
              currencyMode === "usd"
                ? formatCompactWon(opportunityGapKrw)
                : formatSignedPercent(stockOneScenario?.returnPct),
            tone: currencyMode === "usd" ? "default" : getToneFromSignedValue(stockOneScenario?.returnPct),
          },
          {
            label: "주식 2 수익률",
            value: formatSignedPercent(stockTwoScenario?.returnPct),
            tone: getToneFromSignedValue(stockTwoScenario?.returnPct),
          },
        ];
      case "average":
        return [
          {
            label: "새 평단",
            value: formatCurrency(averageDown?.newAveragePrice, currencyMode),
            tone: "accent",
          },
          {
            label: "총 보유 수량",
            value: formatShares(averageDown?.totalQuantity),
            tone: "default",
          },
          {
            label: "총 투자금",
            value: formatCompactCurrency(averageDown?.totalCost, currencyMode),
            tone: "default",
          },
          {
            label: "본전 필요 상승률",
            value: formatSignedPercent(averageDown?.breakevenGainPctFromCurrent),
            tone: "positive",
          },
        ];
      case "target":
        return [
          {
            label: "목표 매도가",
            value: targetExit ? formatCurrency(targetExit.targetPricePerShare, currencyMode, 2) : "-",
            tone: "accent",
          },
          {
            label: "예상 순이익",
            value: formatCompactCurrency(targetNetProfitInCurrency, currencyMode),
            tone: "positive",
          },
          {
            label: "세후 수익률",
            value: formatSignedPercent(targetExit?.netReturnPct),
            tone: "positive",
          },
          {
            label: currencyMode === "usd" ? "목표가 원화환산" : "예상 회수금",
            value:
              currencyMode === "usd"
                ? formatWon(targetExit?.targetPriceInKrw, 2)
                : formatCompactCurrency(targetNetProceedsInCurrency, currencyMode),
            tone: "default",
          },
        ];
      case "dividend":
        return [
          {
            label: "연 세후 배당",
            value: formatCompactCurrency(dividendReinvestment?.netAnnualDividend, currencyMode),
            tone: "positive",
          },
          {
            label: "월 환산 배당",
            value: formatCompactCurrency(dividendReinvestment?.netMonthlyDividend, currencyMode),
            tone: "default",
          },
          {
            label: "재투자 후 자산",
            value: formatCompactCurrency(dividendReinvestment?.reinvestedValue, currencyMode),
            tone: "accent",
          },
          {
            label: "누적 재투자 수익",
            value: formatCompactCurrency(dividendReinvestment?.reinvestedProfit, currencyMode),
            tone: "positive",
          },
          {
            label: "재투자 수익률",
            value: formatSignedPercent(dividendReinvestment?.reinvestedReturnPct),
            tone: "positive",
          },
          {
            label: "세후 연수익률",
            value: formatPercent(dividendReinvestment?.netYieldPct),
            tone: "default",
          },
        ];
      default:
        return [];
    }
  })();

  const activeSummary =
    activeResults.length > 0
      ? `${activeToolInfo.label}: ${activeResults
          .slice(0, 3)
          .map((item) => `${item.label} ${item.value}`)
          .join(" / ")}`
      : `${activeToolInfo.label}: 계산값 없음`;

  const activeToolFieldControllers = activeToolInfo.fieldKeys
    .filter((key) => activeTool !== "average" || key !== (averageDownMode === "quantity" ? "average.extraAmount" : "average.extraQuantity"))
    .map((key) => ({ key, controller: fieldControllers[key] }))
    .filter((item): item is { key: string; controller: FieldController } => Boolean(item.controller));

  function handleKeypadPress(key: (typeof KEY_ROWS)[number][number]) {
    if (!activeController) {
      return;
    }

    if (key === "clear") {
      activeController.setValue("");
      return;
    }

    if (key === "back") {
      activeController.setValue(activeController.value.slice(0, -1));
      return;
    }

    if (key === "sign") {
      activeController.setValue(activeController.value.startsWith("-") ? activeController.value.slice(1) : `-${activeController.value || "0"}`);
      return;
    }

    if (key === "next") {
      const fieldKeys = activeToolFieldControllers.map((item) => item.key);
      const currentIndex = fieldKeys.indexOf(activeField);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % fieldKeys.length : 0;
      setActiveField(fieldKeys[nextIndex]);
      return;
    }

    if (key === "." && activeController.value.includes(".")) {
      return;
    }

    const currentValue = activeController.value;
    const nextValue =
      key === "."
        ? currentValue
          ? `${currentValue}.`
          : "0."
        : currentValue === "0"
          ? key
          : `${currentValue}${key}`;
    activeController.setValue(nextValue);
  }

  function appendActiveSummaryToMemo() {
    setMemo((prev) => `${prev.trimEnd()}${prev.trim() ? "\n" : ""}${activeSummary}`);
  }

  function renderField(key: string, label?: string, hint?: string) {
    const controller = fieldControllers[key];
    if (!controller) {
      return null;
    }

    return (
      <NumericField
        key={key}
        fieldKey={key}
        label={label ?? controller.label}
        value={controller.value}
        suffix={controller.suffix}
        hint={hint}
        activeField={activeField}
        setActiveField={setActiveField}
        onChange={(event) => controller.setValue(event.target.value)}
      />
    );
  }

  function renderActiveTool() {
    switch (activeTool) {
      case "return":
        return (
          <>
            <div className="quantFormAndResults">
              <div className="quantFieldGrid">
                {renderField("return.originalPrice")}
                {renderField("return.currentPrice")}
                {renderField("return.investmentAmount")}
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <p className="quantInsight">
              원래 가격에 넣었을 금액을 현재 가격으로 환산해, 가격 변화가 내 돈에 준 영향을 봅니다.
            </p>
            <Formula>현재 환산금액 = 넣었을 금액 / 원래 가격 × 현재 가격</Formula>
          </>
        );
      case "opportunity":
        return (
          <>
            <div className="quantFormAndResults">
              <div className="quantOpportunityLayout">
                <div className="quantOpportunityBudget">{renderField("opportunity.budgetAmount")}</div>
                <div className="quantOpportunityPair">
                  <strong>주식 1</strong>
                  {renderField("opportunity.stockOneOriginalPrice")}
                  {renderField("opportunity.stockOneCurrentPrice")}
                </div>
                <div className="quantOpportunityPair">
                  <strong>주식 2</strong>
                  {renderField("opportunity.stockTwoOriginalPrice")}
                  {renderField("opportunity.stockTwoCurrentPrice")}
                </div>
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <p className="quantInsight">
              같은 예산을 두 종목에 각각 넣었다고 가정하고, 현재 자산가치와 수익률 차이를 비교합니다.
            </p>
            <Formula>각 종목 현재가치 = 예산 / 원래 가격 × 현재 가격</Formula>
          </>
        );
      case "average":
        return (
          <>
            <div className="quantSegmented" role="tablist" aria-label="추가 매수 입력 방식">
              <button
                type="button"
                className={averageDownMode === "quantity" ? "isActive" : ""}
                onClick={() => {
                  setAverageDownMode("quantity");
                  setActiveField("average.extraQuantity");
                }}
              >
                수량으로 입력
              </button>
              <button
                type="button"
                className={averageDownMode === "amount" ? "isActive" : ""}
                onClick={() => {
                  setAverageDownMode("amount");
                  setActiveField("average.extraAmount");
                }}
              >
                금액으로 입력
              </button>
            </div>
            <div className="quantFormAndResults">
              <div className="quantFieldGrid">
                {renderField("average.currentAveragePrice")}
                {renderField("average.currentQuantity")}
                {renderField("average.currentPrice")}
                {renderField("average.extraBuyPrice")}
                {averageDownMode === "quantity"
                  ? renderField("average.extraQuantity")
                  : renderField("average.extraAmount")}
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <p className="quantInsight">
              추가 매수 뒤 새 평단과 현재가 기준 본전까지 필요한 상승률을 한 번에 계산합니다.
            </p>
            <Formula>새 평단 = (기존 평단 × 보유 수량 + 추가 매수가 × 추가 수량) / 총 수량</Formula>
          </>
        );
      case "target":
        return (
          <>
            <div className="quantFormAndResults">
              <div className="quantFieldGrid">
                {renderField("target.averagePrice")}
                {renderField("target.quantity")}
                {renderField("target.targetNetReturnPct")}
                {renderField("target.sellFeePct")}
                {renderField("target.taxRatePct")}
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <p className="quantInsight">
              달러 기준으로 계산할 때는 상단 환율 설정의 기준가가 원화 환산과 순이익 계산에 적용됩니다.
            </p>
            <Formula>목표 매도가 = 목표 총매각대금 / 보유 수량</Formula>
          </>
        );
      case "dividend":
        return (
          <>
            <div className="quantFormAndResults">
              <div className="quantFieldGrid">
                {renderField("dividend.investmentAmount")}
                {renderField("dividend.annualDividendYieldPct")}
                {renderField("dividend.taxRatePct")}
                {renderField("dividend.years")}
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <p className="quantInsight">
              주가 변동은 제외하고, 같은 세후 배당수익률로 매년 재투자한다고 가정합니다.
            </p>
            <Formula>재투자 후 자산 = 투자금 × (1 + 연 배당수익률 × (1 - 세율)) ^ 기간</Formula>
          </>
        );
      default:
        return null;
    }
  }

  return (
    <main className="quantPage quantCalculatorPage">
      <section className="quantTopPanel" aria-label="주식용 계산기">
        <div className="quantTitleBlock">
          <span className="quantHeroEyebrow">Stock Calculator</span>
          <h1>주식용 계산기</h1>
          <p>수익률, 기회비용, 물타기, 목표가, 배당 재투자를 계산합니다.</p>
        </div>
        <div className="quantCurrencyPanel" aria-label="계산 통화 및 환율">
          <div className="quantCurrencyGroup">
            <span>계산 통화</span>
            <div className="quantPillToggle">
              <button
                type="button"
                className={currencyMode === "krw" ? "isActive" : ""}
                onClick={() => setCurrencyMode("krw")}
              >
                원화
              </button>
              <button
                type="button"
                className={currencyMode === "usd" ? "isActive" : ""}
                onClick={() => setCurrencyMode("usd")}
              >
                달러
              </button>
            </div>
          </div>
          <div className="quantCurrencyGroup">
            <span>환율 기준</span>
            <div className="quantPillToggle">
              <button
                type="button"
                className={fxRateMode === "latest" ? "isActive" : ""}
                onClick={() => setFxRateMode("latest")}
                disabled={currencyMode !== "usd"}
              >
                당일 기준가
              </button>
              <button
                type="button"
                className={fxRateMode === "manual" ? "isActive" : ""}
                onClick={() => setFxRateMode("manual")}
                disabled={currencyMode !== "usd"}
              >
                직접 입력
              </button>
            </div>
          </div>
          <label className="quantManualFxInput">
            <span>USD/KRW</span>
            <input
              value={manualFxRate}
              onChange={(event) => setManualFxRate(event.target.value)}
              inputMode="decimal"
              disabled={currencyMode !== "usd" || fxRateMode !== "manual"}
            />
          </label>
          <div className="quantCurrencyMeta">
            <small>{fxRateSummary}</small>
            <small>{latestUsdKrwMeta}</small>
          </div>
        </div>
      </section>

      <section className="quantCalculatorShell">
        <aside className="quantCalculatorDock" aria-label="숫자 패드">
          <div className="quantCalcDisplay">
            <span>입력 중</span>
            <strong>{activeController?.label ?? "필드 선택"}</strong>
            <output>
              {activeController?.value || "0"}
              {activeController?.suffix ? <small>{activeController.suffix}</small> : null}
            </output>
          </div>

          <div className="quantFieldPicker" aria-label="입력 필드">
            {activeToolFieldControllers.map(({ key, controller }) => (
              <button
                key={key}
                type="button"
                className={activeField === key ? "isActive" : ""}
                onClick={() => setActiveField(key)}
              >
                {controller.label}
              </button>
            ))}
          </div>

          <div className="quantKeypad">
            {KEY_ROWS.flat().map((key) => (
              <button
                key={key}
                type="button"
                className={`quantKeyButton quantKeyButton-${key}`}
                onClick={() => handleKeypadPress(key)}
              >
                {key === "back" ? "⌫" : key === "clear" ? "C" : key === "sign" ? "±" : key === "next" ? "↵" : key}
              </button>
            ))}
          </div>
        </aside>

        <section className="quantWorkSurface">
          <div className="quantModeBar" aria-label="계산 모드">
            {TOOL_OPTIONS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={activeTool === tool.id ? "isActive" : ""}
                onClick={() => setActiveTool(tool.id)}
              >
                <span>{tool.keyLabel}</span>
                {tool.label}
              </button>
            ))}
          </div>

          <aside className="quantResultPanel" aria-label="핵심 결과">
            <div className="quantResultDisplay">
              <span>결과</span>
              <strong>{activeResults[0]?.value ?? "-"}</strong>
              <small>{activeResults[0]?.label ?? activeToolInfo.label}</small>
            </div>
            <div className="quantResultList">
              {activeResults.slice(1).map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <button type="button" className="quantMemoAppendButton" onClick={appendActiveSummaryToMemo}>
              결과 메모
            </button>
          </aside>

          <article className="quantWorkCard">
            <div className="quantWorkHeader">
              <div>
                <span>{activeToolInfo.keyLabel}</span>
                <h2>{activeToolInfo.label}</h2>
              </div>
              <p>{activeToolInfo.description}</p>
            </div>
            {renderActiveTool()}
          </article>
        </section>
      </section>

      <section className="card quantMemoCard">
        <div className="quantMemoHeader">
          <div>
            <span className="quantSectionEyebrow">Memo</span>
            <h2>계산 메모</h2>
          </div>
          <button type="button" className="quantActionButton" onClick={() => setMemo("")}>
            비우기
          </button>
        </div>
        <textarea
          className="quantMemoTextarea"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="계산값, 매수 조건, 환율 가정, 리밸런싱 메모를 적어두세요."
        />
      </section>
    </main>
  );
}
