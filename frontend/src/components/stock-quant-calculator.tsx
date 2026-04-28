"use client";

import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useState } from "react";
import {
  buildDcfSensitivityTable,
  calculateAverageDown,
  calculateDcfValuation,
  calculateDividendIncome,
  calculateFinancialMetrics,
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

type FieldState = Record<string, string>;
type ResultTone = "default" | "positive" | "negative" | "accent";
type CurrencyMode = "krw" | "usd";
type FxRateMode = "latest" | "manual";
type ToolId =
  | "return"
  | "opportunity"
  | "recovery"
  | "average"
  | "target"
  | "dividend"
  | "stop"
  | "metrics"
  | "valuation"
  | "dcf";

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
    fieldKeys: [
      "return.originalPrice",
      "return.currentPrice",
      "return.investmentAmount",
    ],
  },
  {
    id: "opportunity",
    label: "기회비용",
    keyLabel: "OC",
    description: "같은 예산의 두 종목 비교",
    fieldKeys: [
      "opportunity.budgetAmount",
      "opportunity.stockOneOriginalPrice",
      "opportunity.stockOneCurrentPrice",
      "opportunity.stockTwoOriginalPrice",
      "opportunity.stockTwoCurrentPrice",
    ],
  },
  {
    id: "recovery",
    label: "본전",
    keyLabel: "BE",
    description: "손실 복구율",
    fieldKeys: ["loss.lossRate"],
  },
  {
    id: "average",
    label: "평단",
    keyLabel: "AVG",
    description: "추가 매수 변화",
    fieldKeys: [
      "average.currentAveragePrice",
      "average.currentQuantity",
      "average.currentPrice",
      "average.extraBuyPrice",
      "average.extraQuantity",
      "average.extraAmount",
      "average.portfolioValue",
      "average.downsideShockPct",
    ],
  },
  {
    id: "target",
    label: "목표가",
    keyLabel: "TP",
    description: "순수익률 기준 매도가",
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
    label: "배당",
    keyLabel: "DIV",
    description: "월 환산 배당",
    fieldKeys: [
      "dividend.investmentAmount",
      "dividend.annualDividendYieldPct",
      "dividend.taxRatePct",
      "dividend.targetMonthlyDividend",
    ],
  },
  {
    id: "stop",
    label: "리스크",
    keyLabel: "RISK",
    description: "손절가 기준 수량",
    fieldKeys: ["stop.allowedLossAmount", "stop.entryPrice", "stop.stopPrice"],
  },
  {
    id: "metrics",
    label: "재무지표",
    keyLabel: "PER",
    description: "EPS, PER, ROE",
    fieldKeys: [
      "metrics.netIncome",
      "metrics.equity",
      "metrics.sharesOutstanding",
      "metrics.currentPrice",
      "metrics.dividendPerShare",
      "metrics.freeCashFlow",
      "metrics.ebitda",
      "metrics.totalDebt",
      "metrics.cashAndEquivalents",
    ],
  },
  {
    id: "valuation",
    label: "PER 역산",
    keyLabel: "PV",
    description: "가격이 요구하는 이익",
    fieldKeys: [
      "valuation.currentPrice",
      "valuation.expectedEps",
      "valuation.targetPer",
      "valuation.sharesOutstanding",
    ],
  },
  {
    id: "dcf",
    label: "DCF",
    keyLabel: "DCF",
    description: "내재가치와 Reverse DCF",
    fieldKeys: [
      "dcf.baseFreeCashFlow",
      "dcf.growthRatePct",
      "dcf.discountRatePct",
      "dcf.terminalGrowthPct",
      "dcf.netCash",
      "dcf.sharesOutstanding",
      "dcf.currentPrice",
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

function formatWon(value: number | null | undefined, digits = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatNumber(value, digits)}원`;
}

function formatCompactWon(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) {
    return `${formatNumber(value / 1_000_000_000_000, 2)}조 원`;
  }

  if (abs >= 100_000_000) {
    return `${formatNumber(value / 100_000_000, 2)}억 원`;
  }

  if (abs >= 10_000) {
    return `${formatNumber(value / 10_000, 2)}만 원`;
  }

  return formatWon(value);
}

function formatCurrency(value: number | null | undefined, currencyMode: CurrencyMode, digits = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  if (currencyMode === "usd") {
    return `${formatNumber(value, digits === 0 ? 2 : digits)} USD`;
  }

  return formatWon(value, digits);
}

function formatCompactCurrency(value: number | null | undefined, currencyMode: CurrencyMode) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  if (currencyMode === "usd") {
    return `${formatNumber(value, 2)} USD`;
  }

  return formatCompactWon(value);
}

function formatShares(value: number | null | undefined, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatNumber(value, digits)}주`;
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

function setField<T extends FieldState>(
  setter: Dispatch<SetStateAction<T>>,
  key: keyof T & string,
) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    setter((prev) => ({ ...prev, [key]: event.target.value }));
  };
}

function setFieldValue<T extends FieldState>(
  setter: Dispatch<SetStateAction<T>>,
  key: keyof T & string,
  value: string,
) {
  setter((prev) => ({ ...prev, [key]: value }));
}

function getToneFromSignedValue(value: number | null | undefined): ResultTone {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "default";
  }

  return value >= 0 ? "positive" : "negative";
}

function calculateBudgetScenario(
  budgetAmount: number,
  originalPrice: number,
  currentPrice: number,
) {
  if (
    !Number.isFinite(budgetAmount) ||
    !Number.isFinite(originalPrice) ||
    !Number.isFinite(currentPrice) ||
    budgetAmount < 0 ||
    originalPrice <= 0
  ) {
    return null;
  }

  const shares = budgetAmount / originalPrice;
  const currentValue = shares * currentPrice;
  const profit = currentValue - budgetAmount;
  const returnPct = ((currentPrice / originalPrice) - 1) * 100;

  return {
    shares,
    currentValue,
    profit,
    returnPct,
  };
}

function Metric({ label, value, note, tone = "default" }: MetricItem) {
  return (
    <div className={`quantMetric quantMetric-${tone}`}>
      <span className="quantMetricLabel">{label}</span>
      <strong className="quantMetricValue">{value}</strong>
      {note ? <span className="quantMetricNote">{note}</span> : null}
    </div>
  );
}

function ResultGrid({ items }: { items: MetricItem[] }) {
  return (
    <div className="quantMetricGrid">
      {items.map((item) => (
        <Metric key={item.label} {...item} />
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
  setActiveField: (key: string) => void;
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

function Formula({ children }: { children: ReactNode }) {
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
  const [lossRate, setLossRate] = useState("30");
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
  const [targetExitFields, setTargetExitFields] = useState({
    averagePrice: "72000",
    quantity: "15",
    targetNetReturnPct: "15",
    sellFeePct: "0.015",
    taxRatePct: "0",
  });
  const [stopFields, setStopFields] = useState({
    allowedLossAmount: "200000",
    entryPrice: "72000",
    stopPrice: "66400",
  });
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
  const [dividendFields, setDividendFields] = useState({
    investmentAmount: "10000000",
    annualDividendYieldPct: "4.2",
    taxRatePct: "15.4",
    targetMonthlyDividend: "300000",
  });
  const [financialFields, setFinancialFields] = useState({
    netIncome: "1000000000000",
    equity: "8000000000000",
    sharesOutstanding: "100000000",
    currentPrice: "150000",
    dividendPerShare: "3000",
    freeCashFlow: "750000000000",
    ebitda: "1800000000000",
    totalDebt: "1200000000000",
    cashAndEquivalents: "900000000000",
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
      : "원화 직접 계산";
  const fxRateSummary =
    currencyMode === "usd"
      ? effectiveUsdKrw !== null && Number.isFinite(effectiveUsdKrw)
        ? `${fxModeLabel} · USD/KRW ${formatWon(effectiveUsdKrw, 2)}`
        : "환율 입력 필요"
      : "원화 기준 계산";

  const fieldControllers: Record<string, FieldController> = {
    "loss.lossRate": {
      label: "손실률",
      value: lossRate,
      suffix: "%",
      setValue: setLossRate,
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
    "average.portfolioValue": {
      label: "포트 총액",
      value: averageDownFields.portfolioValue,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setAverageDownFields, "portfolioValue", value),
    },
    "average.downsideShockPct": {
      label: "하락 가정",
      value: averageDownFields.downsideShockPct,
      suffix: "%",
      setValue: (value) => setFieldValue(setAverageDownFields, "downsideShockPct", value),
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
      label: "목표 순수익",
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
    "stop.allowedLossAmount": {
      label: "허용 손실",
      value: stopFields.allowedLossAmount,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setStopFields, "allowedLossAmount", value),
    },
    "stop.entryPrice": {
      label: "매수가",
      value: stopFields.entryPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setStopFields, "entryPrice", value),
    },
    "stop.stopPrice": {
      label: "손절가",
      value: stopFields.stopPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setStopFields, "stopPrice", value),
    },
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
      label: "주식 1 원래 가격",
      value: opportunityFields.stockOneOriginalPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setOpportunityFields, "stockOneOriginalPrice", value),
    },
    "opportunity.stockOneCurrentPrice": {
      label: "주식 1 현재 가격",
      value: opportunityFields.stockOneCurrentPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setOpportunityFields, "stockOneCurrentPrice", value),
    },
    "opportunity.stockTwoOriginalPrice": {
      label: "주식 2 원래 가격",
      value: opportunityFields.stockTwoOriginalPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setOpportunityFields, "stockTwoOriginalPrice", value),
    },
    "opportunity.stockTwoCurrentPrice": {
      label: "주식 2 현재 가격",
      value: opportunityFields.stockTwoCurrentPrice,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setOpportunityFields, "stockTwoCurrentPrice", value),
    },
    "dividend.investmentAmount": {
      label: "투자금",
      value: dividendFields.investmentAmount,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setDividendFields, "investmentAmount", value),
    },
    "dividend.annualDividendYieldPct": {
      label: "배당률",
      value: dividendFields.annualDividendYieldPct,
      suffix: "%",
      setValue: (value) => setFieldValue(setDividendFields, "annualDividendYieldPct", value),
    },
    "dividend.taxRatePct": {
      label: "세율",
      value: dividendFields.taxRatePct,
      suffix: "%",
      setValue: (value) => setFieldValue(setDividendFields, "taxRatePct", value),
    },
    "dividend.targetMonthlyDividend": {
      label: "목표 월배당",
      value: dividendFields.targetMonthlyDividend,
      suffix: currencySuffix,
      setValue: (value) => setFieldValue(setDividendFields, "targetMonthlyDividend", value),
    },
    "metrics.netIncome": {
      label: "순이익",
      value: financialFields.netIncome,
      suffix: "원",
      setValue: (value) => setFieldValue(setFinancialFields, "netIncome", value),
    },
    "metrics.equity": {
      label: "자본",
      value: financialFields.equity,
      suffix: "원",
      setValue: (value) => setFieldValue(setFinancialFields, "equity", value),
    },
    "metrics.sharesOutstanding": {
      label: "주식 수",
      value: financialFields.sharesOutstanding,
      suffix: "주",
      setValue: (value) => setFieldValue(setFinancialFields, "sharesOutstanding", value),
    },
    "metrics.currentPrice": {
      label: "현재가",
      value: financialFields.currentPrice,
      suffix: "원",
      setValue: (value) => setFieldValue(setFinancialFields, "currentPrice", value),
    },
    "metrics.dividendPerShare": {
      label: "주당 배당",
      value: financialFields.dividendPerShare,
      suffix: "원",
      setValue: (value) => setFieldValue(setFinancialFields, "dividendPerShare", value),
    },
    "metrics.freeCashFlow": {
      label: "FCF",
      value: financialFields.freeCashFlow,
      suffix: "원",
      setValue: (value) => setFieldValue(setFinancialFields, "freeCashFlow", value),
    },
    "metrics.ebitda": {
      label: "EBITDA",
      value: financialFields.ebitda,
      suffix: "원",
      setValue: (value) => setFieldValue(setFinancialFields, "ebitda", value),
    },
    "metrics.totalDebt": {
      label: "총부채",
      value: financialFields.totalDebt,
      suffix: "원",
      setValue: (value) => setFieldValue(setFinancialFields, "totalDebt", value),
    },
    "metrics.cashAndEquivalents": {
      label: "현금",
      value: financialFields.cashAndEquivalents,
      suffix: "원",
      setValue: (value) => setFieldValue(setFinancialFields, "cashAndEquivalents", value),
    },
    "valuation.currentPrice": {
      label: "현재가",
      value: valuationFields.currentPrice,
      suffix: "원",
      setValue: (value) => setFieldValue(setValuationFields, "currentPrice", value),
    },
    "valuation.expectedEps": {
      label: "예상 EPS",
      value: valuationFields.expectedEps,
      suffix: "원",
      setValue: (value) => setFieldValue(setValuationFields, "expectedEps", value),
    },
    "valuation.targetPer": {
      label: "목표 PER",
      value: valuationFields.targetPer,
      suffix: "배",
      setValue: (value) => setFieldValue(setValuationFields, "targetPer", value),
    },
    "valuation.sharesOutstanding": {
      label: "주식 수",
      value: valuationFields.sharesOutstanding,
      suffix: "주",
      setValue: (value) => setFieldValue(setValuationFields, "sharesOutstanding", value),
    },
    "dcf.baseFreeCashFlow": {
      label: "기준 FCF",
      value: dcfFields.baseFreeCashFlow,
      suffix: "원",
      setValue: (value) => setFieldValue(setDcfFields, "baseFreeCashFlow", value),
    },
    "dcf.growthRatePct": {
      label: "성장률",
      value: dcfFields.growthRatePct,
      suffix: "%",
      setValue: (value) => setFieldValue(setDcfFields, "growthRatePct", value),
    },
    "dcf.discountRatePct": {
      label: "할인율",
      value: dcfFields.discountRatePct,
      suffix: "%",
      setValue: (value) => setFieldValue(setDcfFields, "discountRatePct", value),
    },
    "dcf.terminalGrowthPct": {
      label: "말기 성장률",
      value: dcfFields.terminalGrowthPct,
      suffix: "%",
      setValue: (value) => setFieldValue(setDcfFields, "terminalGrowthPct", value),
    },
    "dcf.netCash": {
      label: "순현금",
      value: dcfFields.netCash,
      suffix: "원",
      setValue: (value) => setFieldValue(setDcfFields, "netCash", value),
    },
    "dcf.sharesOutstanding": {
      label: "주식 수",
      value: dcfFields.sharesOutstanding,
      suffix: "주",
      setValue: (value) => setFieldValue(setDcfFields, "sharesOutstanding", value),
    },
    "dcf.currentPrice": {
      label: "현재가",
      value: dcfFields.currentPrice,
      suffix: "원",
      setValue: (value) => setFieldValue(setDcfFields, "currentPrice", value),
    },
  };

  const activeToolInfo = TOOL_OPTIONS.find((tool) => tool.id === activeTool) ?? TOOL_OPTIONS[0];
  const activeController =
    fieldControllers[activeField] ?? fieldControllers[TOOL_DEFAULT_FIELD[activeTool]];

  const lossRecovery = calculateLossRecovery(parseNumber(lossRate));

  const averageDown = calculateAverageDown({
    currentAveragePrice: parseNumber(averageDownFields.currentAveragePrice),
    currentQuantity: parseNumber(averageDownFields.currentQuantity),
    currentPrice: parseNumber(averageDownFields.currentPrice),
    extraBuyPrice: parseNumber(averageDownFields.extraBuyPrice),
    extraQuantity:
      averageDownMode === "quantity" ? parseNumber(averageDownFields.extraQuantity) : null,
    extraAmount: averageDownMode === "amount" ? parseNumber(averageDownFields.extraAmount) : null,
    portfolioValue: parseNumber(averageDownFields.portfolioValue),
    downsideShockPct: parseNumber(averageDownFields.downsideShockPct),
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

  const stopPosition = calculateStopPositionSizing({
    allowedLossAmount: parseNumber(stopFields.allowedLossAmount),
    entryPrice: parseNumber(stopFields.entryPrice),
    stopPrice: parseNumber(stopFields.stopPrice),
  });

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
  const returnCurrentValueKrw =
    currencyMode === "usd" && returnCurrentValue !== null && effectiveUsdKrw !== null
      ? returnCurrentValue * effectiveUsdKrw
      : null;
  const opportunityGapKrw =
    currencyMode === "usd" && opportunityGapAbs !== null && effectiveUsdKrw !== null
      ? opportunityGapAbs * effectiveUsdKrw
      : null;

  const dividendIncome = calculateDividendIncome({
    investmentAmount: parseNumber(dividendFields.investmentAmount),
    annualDividendYieldPct: parseNumber(dividendFields.annualDividendYieldPct),
    taxRatePct: parseNumber(dividendFields.taxRatePct),
    targetMonthlyDividend: parseNumber(dividendFields.targetMonthlyDividend),
  });

  const financialMetrics = calculateFinancialMetrics({
    netIncome: parseNumber(financialFields.netIncome),
    equity: parseNumber(financialFields.equity),
    sharesOutstanding: parseNumber(financialFields.sharesOutstanding),
    currentPrice: parseNumber(financialFields.currentPrice),
    dividendPerShare: parseNumber(financialFields.dividendPerShare),
    freeCashFlow: parseNumber(financialFields.freeCashFlow),
    ebitda: parseNumber(financialFields.ebitda),
    totalDebt: parseNumber(financialFields.totalDebt),
    cashAndEquivalents: parseNumber(financialFields.cashAndEquivalents),
  });

  const valuationBridge = calculateValuationBridge({
    currentPrice: parseNumber(valuationFields.currentPrice),
    expectedEps: parseNumber(valuationFields.expectedEps),
    targetPer: parseNumber(valuationFields.targetPer),
    sharesOutstanding: parseNumber(valuationFields.sharesOutstanding),
  });

  const dcfValuation = calculateDcfValuation({
    baseFreeCashFlow: parseNumber(dcfFields.baseFreeCashFlow),
    growthRatePct: parseNumber(dcfFields.growthRatePct),
    discountRatePct: parseNumber(dcfFields.discountRatePct),
    terminalGrowthPct: parseNumber(dcfFields.terminalGrowthPct),
    netCash: parseNumber(dcfFields.netCash),
    sharesOutstanding: parseNumber(dcfFields.sharesOutstanding),
    currentPrice: parseNumber(dcfFields.currentPrice),
  });

  const reverseDcf = calculateReverseDcf({
    baseFreeCashFlow: parseNumber(dcfFields.baseFreeCashFlow),
    discountRatePct: parseNumber(dcfFields.discountRatePct),
    terminalGrowthPct: parseNumber(dcfFields.terminalGrowthPct),
    netCash: parseNumber(dcfFields.netCash),
    sharesOutstanding: parseNumber(dcfFields.sharesOutstanding),
    currentPrice: parseNumber(dcfFields.currentPrice),
  });

  const dcfSensitivity = buildDcfSensitivityTable({
    baseFreeCashFlow: parseNumber(dcfFields.baseFreeCashFlow),
    growthRatePct: parseNumber(dcfFields.growthRatePct),
    discountRatePct: parseNumber(dcfFields.discountRatePct),
    terminalGrowthPct: parseNumber(dcfFields.terminalGrowthPct),
    netCash: parseNumber(dcfFields.netCash),
    sharesOutstanding: parseNumber(dcfFields.sharesOutstanding),
    currentPrice: parseNumber(dcfFields.currentPrice),
  });

  const averageDownWeightMessage =
    averageDown?.positionWeightBeforePct !== null && averageDown?.positionWeightAfterPct !== null
      ? `비중 ${formatPercent(averageDown?.positionWeightBeforePct)} → ${formatPercent(
          averageDown?.positionWeightAfterPct,
        )}`
      : "포트폴리오 총액을 넣으면 비중 변화도 같이 계산됩니다.";

  const reverseDcfMessage = reverseDcf
    ? `현재가는 5년 FCF 연평균 ${formatSignedPercent(reverseDcf.impliedGrowthRatePct)} 시나리오에 가깝습니다.`
    : "입력값 조합상 Reverse DCF를 계산할 수 없습니다.";

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
            value: currencyMode === "usd" ? formatCompactWon(opportunityGapKrw) : formatSignedPercent(stockOneScenario?.returnPct),
            tone: currencyMode === "usd" ? "default" : getToneFromSignedValue(stockOneScenario?.returnPct),
          },
          {
            label: "주식 2 수익률",
            value: formatSignedPercent(stockTwoScenario?.returnPct),
            tone: getToneFromSignedValue(stockTwoScenario?.returnPct),
          },
        ];
      case "recovery":
        return [
          {
            label: "본전 필요 상승률",
            value: lossRecovery ? formatSignedPercent(lossRecovery.neededGainRatePct) : "-",
            tone: "positive",
            note: "하락 후 남은 가격 기준",
          },
          {
            label: "남은 자본",
            value: lossRecovery ? formatPercent(lossRecovery.remainingCapitalPct, 0) : "-",
            tone: "accent",
          },
        ];
      case "average":
        return [
          { label: "새 평단", value: formatCurrency(averageDown?.newAveragePrice, currencyMode), tone: "accent" },
          { label: "총 보유 수량", value: formatShares(averageDown?.totalQuantity), tone: "default" },
          {
            label: "본전까지",
            value: formatSignedPercent(averageDown?.breakevenGainPctFromCurrent),
            tone: "positive",
          },
          {
            label: "추가 하락 손실",
            value: formatCompactCurrency(averageDown?.incrementalLossAtShock, currencyMode),
            tone: "negative",
          },
        ];
      case "target":
        return [
          {
            label: "목표 매도가",
            value: targetExit ? formatCurrency(targetExit.targetPricePerShare, currencyMode, 2) : "-",
            tone: "accent",
          },
          { label: "원화 환산", value: formatWon(targetExit?.targetPriceInKrw), tone: "default" },
          { label: "예상 순이익", value: formatCompactWon(targetExit?.netProfit), tone: "positive" },
          { label: "세후 수익률", value: formatSignedPercent(targetExit?.netReturnPct), tone: "positive" },
        ];
      case "dividend":
        return [
          { label: "월 세후 배당", value: formatCompactCurrency(dividendIncome?.netMonthlyDividend, currencyMode), tone: "positive" },
          { label: "연 세후 배당", value: formatCompactCurrency(dividendIncome?.netAnnualDividend, currencyMode), tone: "accent" },
          {
            label: "목표 필요 투자금",
            value: formatCompactCurrency(dividendIncome?.requiredCapitalForTargetMonthlyNet, currencyMode),
            tone: "default",
          },
        ];
      case "metrics":
        return [
          { label: "EPS", value: formatWon(financialMetrics?.eps), tone: "accent" },
          { label: "PER", value: formatMultiplier(financialMetrics?.per), tone: "default" },
          { label: "PBR", value: formatMultiplier(financialMetrics?.pbr), tone: "default" },
          { label: "ROE", value: formatPercent(financialMetrics?.roePct), tone: "positive" },
          { label: "FCF Yield", value: formatPercent(financialMetrics?.fcfYieldPct), tone: "accent" },
          { label: "EV/EBITDA", value: formatMultiplier(financialMetrics?.evToEbitda), tone: "default" },
        ];
      case "valuation":
        return [
          { label: "목표 주가", value: formatWon(valuationBridge?.targetPrice), tone: "accent" },
          {
            label: "필요 EPS",
            value: formatWon(valuationBridge?.requiredEpsForCurrentPrice),
            tone: "default",
          },
          {
            label: "필요 순이익",
            value: formatCompactWon(valuationBridge?.requiredNetIncomeForCurrentPrice),
            tone: "default",
          },
          {
            label: "현재가 대비",
            value: formatSignedPercent(valuationBridge?.upsideDownsidePct),
            tone: getToneFromSignedValue(valuationBridge?.upsideDownsidePct),
          },
        ];
      case "dcf":
        return [
          {
            label: "내재 주당가치",
            value: formatWon(dcfValuation?.intrinsicPricePerShare),
            tone: "accent",
          },
          {
            label: "현재가 대비",
            value: formatSignedPercent(dcfValuation?.gapVsCurrentPricePct),
            tone: getToneFromSignedValue(dcfValuation?.gapVsCurrentPricePct),
          },
          { label: "기업가치", value: formatCompactWon(dcfValuation?.enterpriseValue), tone: "default" },
          { label: "Reverse DCF", value: formatSignedPercent(reverseDcf?.impliedGrowthRatePct), tone: "positive" },
        ];
      case "stop":
        return [
          { label: "정수 기준 수량", value: formatShares(stopPosition?.recommendedWholeShares, 0), tone: "accent" },
          { label: "이론상 수량", value: formatShares(stopPosition?.maxQuantity), tone: "default" },
          { label: "투입 가능 금액", value: formatCompactCurrency(stopPosition?.capitalRequired, currencyMode), tone: "default" },
          { label: "주당 손실", value: formatCurrency(stopPosition?.lossPerShare, currencyMode), tone: "negative" },
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
      const currentIndex = activeToolInfo.fieldKeys.indexOf(activeField);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % activeToolInfo.fieldKeys.length : 0;
      setActiveField(activeToolInfo.fieldKeys[nextIndex]);
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
    const stamp = new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Seoul",
    }).format(new Date());
    setMemo((prev) => `${prev.trimEnd()}${prev.trim() ? "\n" : ""}[${stamp}] ${activeSummary}`);
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
      case "recovery":
        return (
          <>
            <div className="quantFormAndResults">
              <div className="quantFieldGrid">{renderField("loss.lossRate")}</div>
              <ResultGrid items={activeResults} />
            </div>
            <Formula>필요 상승률 = (1 / (1 - 손실률)) - 1</Formula>
          </>
        );
      case "average":
        return (
          <>
            <div className="quantSegmented" role="tablist" aria-label="추가 매수 입력 방식">
              <button
                type="button"
                className={averageDownMode === "quantity" ? "isActive" : ""}
                onClick={() => setAverageDownMode("quantity")}
              >
                수량
              </button>
              <button
                type="button"
                className={averageDownMode === "amount" ? "isActive" : ""}
                onClick={() => setAverageDownMode("amount")}
              >
                금액
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
                {renderField("average.portfolioValue", undefined, "선택")}
                {renderField("average.downsideShockPct")}
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <p className="quantInsight">{averageDownWeightMessage}</p>
            <Formula>새 평단 = (기존 평단×보유 수량 + 추가 매수가×추가 수량) / 총 수량</Formula>
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
              <div className="quantFieldGrid">
                {renderField("opportunity.budgetAmount")}
                {renderField("opportunity.stockOneOriginalPrice")}
                {renderField("opportunity.stockOneCurrentPrice")}
                {renderField("opportunity.stockTwoOriginalPrice")}
                {renderField("opportunity.stockTwoCurrentPrice")}
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <p className="quantInsight">
              같은 예산을 두 종목에 각각 넣었다고 가정하고, 현재 자산가치와 수익률 차이를 비교합니다.
            </p>
            <Formula>각 종목 현재가치 = 예산 / 원래 가격 × 현재 가격</Formula>
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
                {renderField("dividend.targetMonthlyDividend")}
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <Formula>세후 월배당 = 투자금 × 배당수익률 × (1 - 세율) / 12</Formula>
          </>
        );
      case "metrics":
        return (
          <>
            <div className="quantFormAndResults">
              <div className="quantFieldGrid">
                {renderField("metrics.netIncome")}
                {renderField("metrics.equity")}
                {renderField("metrics.sharesOutstanding")}
                {renderField("metrics.currentPrice")}
                {renderField("metrics.dividendPerShare")}
                {renderField("metrics.freeCashFlow")}
                {renderField("metrics.ebitda")}
                {renderField("metrics.totalDebt")}
                {renderField("metrics.cashAndEquivalents")}
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <Formula>EPS = 순이익 / 주식 수, PER = 현재가 / EPS, ROE = 순이익 / 자본</Formula>
          </>
        );
      case "valuation":
        return (
          <>
            <div className="quantFormAndResults">
              <div className="quantFieldGrid">
                {renderField("valuation.currentPrice")}
                {renderField("valuation.expectedEps")}
                {renderField("valuation.targetPer")}
                {renderField("valuation.sharesOutstanding")}
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <Formula>목표 주가 = 예상 EPS × 목표 PER, 필요 순이익 = (현재가 / 목표 PER) × 주식 수</Formula>
          </>
        );
      case "dcf":
        return (
          <>
            <div className="quantFormAndResults">
              <div className="quantFieldGrid">
                {renderField("dcf.baseFreeCashFlow")}
                {renderField("dcf.growthRatePct")}
                {renderField("dcf.discountRatePct")}
                {renderField("dcf.terminalGrowthPct")}
                {renderField("dcf.netCash")}
                {renderField("dcf.sharesOutstanding")}
                {renderField("dcf.currentPrice")}
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <p className="quantInsight">{reverseDcfMessage}</p>
            {dcfValuation ? (
              <div className="quantMiniSection">
                <h4>5년 FCF</h4>
                <div className="quantProjectionGrid">
                  {dcfValuation.projection.map((row) => (
                    <div key={row.year} className="quantProjectionItem">
                      <span>Y{row.year}</span>
                      <strong>{formatCompactWon(row.freeCashFlow)}</strong>
                      <small>{formatCompactWon(row.presentValue)}</small>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="quantMiniSection">
              <h4>민감도</h4>
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
                          <td key={cell.discountRatePct}>{formatNumber(cell.intrinsicPricePerShare, 0)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Formula>기업가치 = 5년 FCF 현재가치 합 + 말기 가치 현재가치</Formula>
          </>
        );
      case "stop":
        return (
          <>
            <div className="quantFormAndResults">
              <div className="quantFieldGrid">
                {renderField("stop.allowedLossAmount")}
                {renderField("stop.entryPrice")}
                {renderField("stop.stopPrice")}
              </div>
              <ResultGrid items={activeResults} />
            </div>
            <Formula>매수 가능 수량 = 허용 손실금 / (매수가 - 손절가)</Formula>
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
          <p>수익률과 기회비용을 먼저 보고, 필요한 계산만 이어서 확인합니다.</p>
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
          <small>{fxRateSummary}</small>
          <small>{latestUsdKrwMeta}</small>
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
