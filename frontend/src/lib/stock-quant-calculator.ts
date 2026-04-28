export type LossRecoveryResult = {
  lossRatePct: number;
  remainingCapitalPct: number;
  neededGainRatePct: number;
};

export type AverageDownInput = {
  currentAveragePrice: number;
  currentQuantity: number;
  currentPrice: number;
  extraBuyPrice: number;
  extraQuantity?: number | null;
  extraAmount?: number | null;
  portfolioValue?: number | null;
  downsideShockPct?: number | null;
};

export type AverageDownResult = {
  extraQuantity: number;
  extraCost: number;
  totalQuantity: number;
  totalCost: number;
  newAveragePrice: number;
  currentMarketValue: number;
  currentUnrealizedPnL: number;
  postBuyMarketValue: number;
  postBuyUnrealizedPnL: number;
  breakevenGainPctFromCurrent: number;
  positionWeightBeforePct: number | null;
  positionWeightAfterPct: number | null;
  lossIfPriceDropsPct: number;
  totalPositionLossAtShock: number;
  incrementalLossAtShock: number;
};

export type TargetExitInput = {
  averagePrice: number;
  quantity: number;
  targetNetReturnPct: number;
  sellFeePct?: number | null;
  taxRatePct?: number | null;
  buyFxRate?: number | null;
  sellFxRate?: number | null;
};

export type TargetExitResult = {
  investedAmount: number;
  targetPricePerShare: number;
  targetPriceInKrw: number;
  grossProceeds: number;
  sellFees: number;
  taxableGain: number;
  taxAmount: number;
  netProceeds: number;
  netProfit: number;
  netReturnPct: number;
};

type NormalizedTargetExitInput = {
  averagePrice: number;
  quantity: number;
  targetNetReturnPct: number;
  sellFeePct: number;
  taxRatePct: number;
  buyFxRate: number;
  sellFxRate: number;
};

export type StopPositionSizingInput = {
  allowedLossAmount: number;
  entryPrice: number;
  stopPrice: number;
};

export type StopPositionSizingResult = {
  maxQuantity: number;
  recommendedWholeShares: number;
  capitalRequired: number;
  lossPerShare: number;
  maxLossAtStop: number;
};

export type FxReturnBreakdownInput = {
  buyPrice: number;
  currentPrice: number;
  quantity: number;
  buyFxRate: number;
  currentFxRate: number;
  dividendPerShare?: number | null;
  dividendTaxPct?: number | null;
};

export type FxReturnBreakdownResult = {
  investedKrw: number;
  currentValueKrw: number;
  dividendNetKrw: number;
  stockEffectKrw: number;
  fxEffectKrw: number;
  dividendEffectKrw: number;
  totalProfitKrw: number;
  totalReturnPct: number;
  stockEffectPct: number;
  fxEffectPct: number;
  dividendEffectPct: number;
};

export type DividendIncomeInput = {
  investmentAmount: number;
  annualDividendYieldPct: number;
  taxRatePct?: number | null;
  targetMonthlyDividend?: number | null;
};

export type DividendIncomeResult = {
  grossAnnualDividend: number;
  netAnnualDividend: number;
  grossMonthlyDividend: number;
  netMonthlyDividend: number;
  requiredCapitalForTargetMonthlyNet: number | null;
};

export type FinancialMetricsInput = {
  netIncome: number;
  equity: number;
  sharesOutstanding: number;
  currentPrice: number;
  dividendPerShare?: number | null;
  freeCashFlow?: number | null;
  ebitda?: number | null;
  totalDebt?: number | null;
  cashAndEquivalents?: number | null;
};

export type FinancialMetricsResult = {
  marketCap: number;
  eps: number;
  bps: number;
  per: number | null;
  pbr: number | null;
  roePct: number | null;
  dividendYieldPct: number | null;
  fcfYieldPct: number | null;
  enterpriseValue: number | null;
  evToEbitda: number | null;
};

export type ValuationBridgeInput = {
  currentPrice: number;
  expectedEps: number;
  targetPer: number;
  sharesOutstanding: number;
};

export type ValuationBridgeResult = {
  targetPrice: number;
  requiredEpsForCurrentPrice: number;
  requiredNetIncomeForCurrentPrice: number;
  upsideDownsidePct: number;
};

export type DcfValuationInput = {
  baseFreeCashFlow: number;
  growthRatePct: number;
  discountRatePct: number;
  terminalGrowthPct: number;
  netCash: number;
  sharesOutstanding: number;
  currentPrice?: number | null;
};

export type DcfProjectionRow = {
  year: number;
  freeCashFlow: number;
  presentValue: number;
};

export type DcfValuationResult = {
  projection: DcfProjectionRow[];
  terminalValue: number;
  presentValueOfTerminal: number;
  enterpriseValue: number;
  equityValue: number;
  intrinsicPricePerShare: number;
  gapVsCurrentPricePct: number | null;
};

export type DcfSensitivityCell = {
  discountRatePct: number;
  intrinsicPricePerShare: number | null;
};

export type DcfSensitivityRow = {
  growthRatePct: number;
  cells: DcfSensitivityCell[];
};

export type ReverseDcfInput = {
  baseFreeCashFlow: number;
  discountRatePct: number;
  terminalGrowthPct: number;
  netCash: number;
  sharesOutstanding: number;
  currentPrice: number;
};

export type ReverseDcfResult = {
  impliedGrowthRatePct: number;
  intrinsicPricePerShare: number;
};

const EPSILON = 1e-9;

function toRate(percent: number) {
  return percent / 100;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function nonNegativePercent(value: number | null | undefined) {
  return isFiniteNumber(value) ? Math.abs(value) : 0;
}

function nullableRatio(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || Math.abs(denominator) < EPSILON) {
    return null;
  }
  return numerator / denominator;
}

export function calculateLossRecovery(lossRatePct: number): LossRecoveryResult | null {
  if (!isFiniteNumber(lossRatePct)) {
    return null;
  }

  const normalizedLossRatePct = Math.abs(lossRatePct);
  if (normalizedLossRatePct >= 100) {
    return null;
  }

  const lossRate = toRate(normalizedLossRatePct);
  const remainingCapital = 1 - lossRate;
  if (remainingCapital <= EPSILON) {
    return null;
  }

  return {
    lossRatePct: normalizedLossRatePct,
    remainingCapitalPct: remainingCapital * 100,
    neededGainRatePct: ((1 / remainingCapital) - 1) * 100,
  };
}

export function calculateAverageDown(input: AverageDownInput): AverageDownResult | null {
  const {
    currentAveragePrice,
    currentQuantity,
    currentPrice,
    extraBuyPrice,
    extraQuantity,
    extraAmount,
    portfolioValue,
    downsideShockPct,
  } = input;

  if (
    !isFiniteNumber(currentAveragePrice) ||
    !isFiniteNumber(currentQuantity) ||
    !isFiniteNumber(currentPrice) ||
    !isFiniteNumber(extraBuyPrice) ||
    currentAveragePrice <= 0 ||
    currentQuantity <= 0 ||
    currentPrice <= 0 ||
    extraBuyPrice <= 0
  ) {
    return null;
  }

  let resolvedExtraQuantity = isFiniteNumber(extraQuantity) ? extraQuantity : null;
  if ((resolvedExtraQuantity === null || resolvedExtraQuantity <= 0) && isFiniteNumber(extraAmount) && extraAmount > 0) {
    resolvedExtraQuantity = extraAmount / extraBuyPrice;
  }

  if (resolvedExtraQuantity === null || resolvedExtraQuantity <= 0) {
    return null;
  }

  const currentCost = currentAveragePrice * currentQuantity;
  const currentMarketValue = currentPrice * currentQuantity;
  const currentUnrealizedPnL = currentMarketValue - currentCost;
  const extraCost = extraBuyPrice * resolvedExtraQuantity;
  const totalQuantity = currentQuantity + resolvedExtraQuantity;
  const totalCost = currentCost + extraCost;
  const newAveragePrice = totalCost / totalQuantity;
  const postBuyMarketValue = currentPrice * totalQuantity;
  const postBuyUnrealizedPnL = postBuyMarketValue - totalCost;
  const breakevenGainPctFromCurrent = ((newAveragePrice / currentPrice) - 1) * 100;

  const safePortfolioValue = isFiniteNumber(portfolioValue) && portfolioValue > 0 ? portfolioValue : null;
  const positionWeightBeforePct =
    safePortfolioValue !== null ? (currentMarketValue / safePortfolioValue) * 100 : null;
  const positionWeightAfterPct =
    safePortfolioValue !== null ? (postBuyMarketValue / safePortfolioValue) * 100 : null;

  const lossIfPriceDropsPct = nonNegativePercent(downsideShockPct ?? 10);
  const lossShockRate = toRate(lossIfPriceDropsPct);

  return {
    extraQuantity: resolvedExtraQuantity,
    extraCost,
    totalQuantity,
    totalCost,
    newAveragePrice,
    currentMarketValue,
    currentUnrealizedPnL,
    postBuyMarketValue,
    postBuyUnrealizedPnL,
    breakevenGainPctFromCurrent,
    positionWeightBeforePct,
    positionWeightAfterPct,
    lossIfPriceDropsPct,
    totalPositionLossAtShock: postBuyMarketValue * lossShockRate,
    incrementalLossAtShock: currentPrice * resolvedExtraQuantity * lossShockRate,
  };
}

function evaluateTargetExit(targetPricePerShare: number, input: NormalizedTargetExitInput) {
  const investedAmount = input.averagePrice * input.quantity * input.buyFxRate;
  const grossProceeds = targetPricePerShare * input.quantity * input.sellFxRate;
  const sellFees = grossProceeds * toRate(input.sellFeePct);
  const taxableGain = Math.max(grossProceeds - investedAmount, 0);
  const taxAmount = taxableGain * toRate(input.taxRatePct);
  const netProceeds = grossProceeds - sellFees - taxAmount;
  const netProfit = netProceeds - investedAmount;
  const netReturnRatio = nullableRatio(netProfit, investedAmount);

  return {
    investedAmount,
    targetPricePerShare,
    targetPriceInKrw: targetPricePerShare * input.sellFxRate,
    grossProceeds,
    sellFees,
    taxableGain,
    taxAmount,
    netProceeds,
    netProfit,
    netReturnPct: netReturnRatio === null ? 0 : netReturnRatio * 100,
  };
}

export function calculateTargetExit(input: TargetExitInput): TargetExitResult | null {
  const normalizedInput: NormalizedTargetExitInput = {
    ...input,
    sellFeePct: nonNegativePercent(input.sellFeePct),
    taxRatePct: nonNegativePercent(input.taxRatePct),
    buyFxRate: input.buyFxRate && input.buyFxRate > 0 ? input.buyFxRate : 1,
    sellFxRate: input.sellFxRate && input.sellFxRate > 0 ? input.sellFxRate : 1,
  };

  if (
    !isFiniteNumber(normalizedInput.averagePrice) ||
    !isFiniteNumber(normalizedInput.quantity) ||
    !isFiniteNumber(normalizedInput.targetNetReturnPct) ||
    normalizedInput.averagePrice <= 0 ||
    normalizedInput.quantity <= 0 ||
    normalizedInput.buyFxRate <= 0 ||
    normalizedInput.sellFxRate <= 0 ||
    normalizedInput.targetNetReturnPct <= -100
  ) {
    return null;
  }

  const feeRate = toRate(normalizedInput.sellFeePct);
  const taxRate = toRate(normalizedInput.taxRatePct);
  const denominator = 1 - feeRate - taxRate;
  if (denominator <= EPSILON) {
    return null;
  }

  const investedAmount =
    normalizedInput.averagePrice * normalizedInput.quantity * normalizedInput.buyFxRate;
  const targetReturnRate = toRate(normalizedInput.targetNetReturnPct);

  const grossRequiredInKrw =
    (investedAmount * (1 + targetReturnRate - taxRate)) / denominator;
  const targetPricePerShare =
    grossRequiredInKrw / (normalizedInput.quantity * normalizedInput.sellFxRate);
  if (!Number.isFinite(targetPricePerShare) || targetPricePerShare <= 0) {
    return null;
  }

  return evaluateTargetExit(targetPricePerShare, normalizedInput);
}

export function calculateStopPositionSizing(
  input: StopPositionSizingInput,
): StopPositionSizingResult | null {
  const { allowedLossAmount, entryPrice, stopPrice } = input;
  if (
    !isFiniteNumber(allowedLossAmount) ||
    !isFiniteNumber(entryPrice) ||
    !isFiniteNumber(stopPrice) ||
    allowedLossAmount <= 0 ||
    entryPrice <= 0 ||
    stopPrice < 0 ||
    stopPrice >= entryPrice
  ) {
    return null;
  }

  const lossPerShare = entryPrice - stopPrice;
  const maxQuantity = allowedLossAmount / lossPerShare;
  const recommendedWholeShares = Math.floor(maxQuantity);

  return {
    maxQuantity,
    recommendedWholeShares,
    capitalRequired: entryPrice * maxQuantity,
    lossPerShare,
    maxLossAtStop: maxQuantity * lossPerShare,
  };
}

export function calculateFxReturnBreakdown(
  input: FxReturnBreakdownInput,
): FxReturnBreakdownResult | null {
  const {
    buyPrice,
    currentPrice,
    quantity,
    buyFxRate,
    currentFxRate,
    dividendPerShare,
    dividendTaxPct,
  } = input;

  if (
    !isFiniteNumber(buyPrice) ||
    !isFiniteNumber(currentPrice) ||
    !isFiniteNumber(quantity) ||
    !isFiniteNumber(buyFxRate) ||
    !isFiniteNumber(currentFxRate) ||
    buyPrice <= 0 ||
    currentPrice <= 0 ||
    quantity <= 0 ||
    buyFxRate <= 0 ||
    currentFxRate <= 0
  ) {
    return null;
  }

  const dividendTaxRate = toRate(nonNegativePercent(dividendTaxPct));
  const safeDividendPerShare = isFiniteNumber(dividendPerShare) ? dividendPerShare : 0;
  const investedKrw = buyPrice * buyFxRate * quantity;
  const currentValueKrw = currentPrice * currentFxRate * quantity;
  const stockEffectKrw = (currentPrice - buyPrice) * buyFxRate * quantity;
  const fxEffectKrw = currentPrice * (currentFxRate - buyFxRate) * quantity;
  const dividendNetKrw = safeDividendPerShare * quantity * currentFxRate * (1 - dividendTaxRate);
  const totalProfitKrw = currentValueKrw + dividendNetKrw - investedKrw;

  return {
    investedKrw,
    currentValueKrw,
    dividendNetKrw,
    stockEffectKrw,
    fxEffectKrw,
    dividendEffectKrw: dividendNetKrw,
    totalProfitKrw,
    totalReturnPct: (totalProfitKrw / investedKrw) * 100,
    stockEffectPct: (stockEffectKrw / investedKrw) * 100,
    fxEffectPct: (fxEffectKrw / investedKrw) * 100,
    dividendEffectPct: (dividendNetKrw / investedKrw) * 100,
  };
}

export function calculateDividendIncome(
  input: DividendIncomeInput,
): DividendIncomeResult | null {
  const { investmentAmount, annualDividendYieldPct, taxRatePct, targetMonthlyDividend } = input;

  if (
    !isFiniteNumber(investmentAmount) ||
    !isFiniteNumber(annualDividendYieldPct) ||
    investmentAmount < 0 ||
    annualDividendYieldPct < 0
  ) {
    return null;
  }

  const annualYieldRate = toRate(annualDividendYieldPct);
  const taxRate = toRate(nonNegativePercent(taxRatePct));
  const grossAnnualDividend = investmentAmount * annualYieldRate;
  const netAnnualDividend = grossAnnualDividend * (1 - taxRate);
  const netMonthlyYieldRate = annualYieldRate * (1 - taxRate) / 12;

  return {
    grossAnnualDividend,
    netAnnualDividend,
    grossMonthlyDividend: grossAnnualDividend / 12,
    netMonthlyDividend: netAnnualDividend / 12,
    requiredCapitalForTargetMonthlyNet:
      isFiniteNumber(targetMonthlyDividend) && targetMonthlyDividend >= 0 && netMonthlyYieldRate > EPSILON
        ? targetMonthlyDividend / netMonthlyYieldRate
        : null,
  };
}

export function calculateFinancialMetrics(
  input: FinancialMetricsInput,
): FinancialMetricsResult | null {
  const {
    netIncome,
    equity,
    sharesOutstanding,
    currentPrice,
    dividendPerShare,
    freeCashFlow,
    ebitda,
    totalDebt,
    cashAndEquivalents,
  } = input;

  if (
    !isFiniteNumber(netIncome) ||
    !isFiniteNumber(equity) ||
    !isFiniteNumber(sharesOutstanding) ||
    !isFiniteNumber(currentPrice) ||
    sharesOutstanding <= 0 ||
    currentPrice <= 0
  ) {
    return null;
  }

  const marketCap = currentPrice * sharesOutstanding;
  const eps = netIncome / sharesOutstanding;
  const bps = equity / sharesOutstanding;
  const per = nullableRatio(currentPrice, eps);
  const pbr = nullableRatio(currentPrice, bps);
  const roeRatio = nullableRatio(netIncome, equity);
  const safeDividendPerShare = isFiniteNumber(dividendPerShare) ? dividendPerShare : null;
  const safeFreeCashFlow = isFiniteNumber(freeCashFlow) ? freeCashFlow : null;
  const safeDebt = isFiniteNumber(totalDebt) ? totalDebt : null;
  const safeCash = isFiniteNumber(cashAndEquivalents) ? cashAndEquivalents : null;
  const safeEbitda = isFiniteNumber(ebitda) ? ebitda : null;
  const enterpriseValue =
    safeDebt !== null || safeCash !== null ? marketCap + (safeDebt ?? 0) - (safeCash ?? 0) : null;
  const evToEbitda =
    enterpriseValue !== null && safeEbitda !== null && Math.abs(safeEbitda) > EPSILON
      ? enterpriseValue / safeEbitda
      : null;

  return {
    marketCap,
    eps,
    bps,
    per,
    pbr,
    roePct: roeRatio === null ? null : roeRatio * 100,
    dividendYieldPct:
      safeDividendPerShare !== null ? (safeDividendPerShare / currentPrice) * 100 : null,
    fcfYieldPct:
      safeFreeCashFlow !== null && marketCap > EPSILON ? (safeFreeCashFlow / marketCap) * 100 : null,
    enterpriseValue,
    evToEbitda,
  };
}

export function calculateValuationBridge(
  input: ValuationBridgeInput,
): ValuationBridgeResult | null {
  const { currentPrice, expectedEps, targetPer, sharesOutstanding } = input;

  if (
    !isFiniteNumber(currentPrice) ||
    !isFiniteNumber(expectedEps) ||
    !isFiniteNumber(targetPer) ||
    !isFiniteNumber(sharesOutstanding) ||
    currentPrice <= 0 ||
    targetPer <= 0 ||
    sharesOutstanding <= 0
  ) {
    return null;
  }

  const targetPrice = expectedEps * targetPer;
  const requiredEpsForCurrentPrice = currentPrice / targetPer;
  const requiredNetIncomeForCurrentPrice = requiredEpsForCurrentPrice * sharesOutstanding;

  return {
    targetPrice,
    requiredEpsForCurrentPrice,
    requiredNetIncomeForCurrentPrice,
    upsideDownsidePct: ((targetPrice / currentPrice) - 1) * 100,
  };
}

export function calculateDcfValuation(input: DcfValuationInput): DcfValuationResult | null {
  const {
    baseFreeCashFlow,
    growthRatePct,
    discountRatePct,
    terminalGrowthPct,
    netCash,
    sharesOutstanding,
    currentPrice,
  } = input;

  if (
    !isFiniteNumber(baseFreeCashFlow) ||
    !isFiniteNumber(growthRatePct) ||
    !isFiniteNumber(discountRatePct) ||
    !isFiniteNumber(terminalGrowthPct) ||
    !isFiniteNumber(netCash) ||
    !isFiniteNumber(sharesOutstanding) ||
    sharesOutstanding <= 0
  ) {
    return null;
  }

  const growthRate = toRate(growthRatePct);
  const discountRate = toRate(discountRatePct);
  const terminalGrowthRate = toRate(terminalGrowthPct);

  if (
    growthRate <= -1 ||
    discountRate <= -1 ||
    terminalGrowthRate <= -1 ||
    discountRate - terminalGrowthRate <= EPSILON
  ) {
    return null;
  }

  const projection: DcfProjectionRow[] = [];
  let projectedFcf = baseFreeCashFlow;
  let explicitPresentValue = 0;

  for (let year = 1; year <= 5; year += 1) {
    projectedFcf *= 1 + growthRate;
    const presentValue = projectedFcf / (1 + discountRate) ** year;
    projection.push({ year, freeCashFlow: projectedFcf, presentValue });
    explicitPresentValue += presentValue;
  }

  const terminalCashFlow = projectedFcf * (1 + terminalGrowthRate);
  const terminalValue = terminalCashFlow / (discountRate - terminalGrowthRate);
  const presentValueOfTerminal = terminalValue / (1 + discountRate) ** 5;
  const enterpriseValue = explicitPresentValue + presentValueOfTerminal;
  const equityValue = enterpriseValue + netCash;
  const intrinsicPricePerShare = equityValue / sharesOutstanding;

  return {
    projection,
    terminalValue,
    presentValueOfTerminal,
    enterpriseValue,
    equityValue,
    intrinsicPricePerShare,
    gapVsCurrentPricePct:
      isFiniteNumber(currentPrice) && currentPrice > EPSILON
        ? ((intrinsicPricePerShare / currentPrice) - 1) * 100
        : null,
  };
}

export function buildDcfSensitivityTable(
  input: Omit<DcfValuationInput, "growthRatePct" | "discountRatePct"> & {
    growthRatePct: number;
    discountRatePct: number;
  },
): DcfSensitivityRow[] {
  const growthOffsets = [-2, 0, 2];
  const discountOffsets = [-1, 0, 1, 2];

  return growthOffsets.map((growthOffset) => {
    const growthRatePct = input.growthRatePct + growthOffset;

    return {
      growthRatePct,
      cells: discountOffsets.map((discountOffset) => {
        const discountRatePct = input.discountRatePct + discountOffset;
        const valuation = calculateDcfValuation({
          ...input,
          growthRatePct,
          discountRatePct,
        });

        return {
          discountRatePct,
          intrinsicPricePerShare: valuation?.intrinsicPricePerShare ?? null,
        };
      }),
    };
  });
}

export function calculateReverseDcf(input: ReverseDcfInput): ReverseDcfResult | null {
  const { currentPrice, ...valuationInput } = input;

  if (!isFiniteNumber(currentPrice) || currentPrice <= 0) {
    return null;
  }

  let lowGrowthPct = -80;
  let highGrowthPct = 60;

  let lowValuation = calculateDcfValuation({
    ...valuationInput,
    growthRatePct: lowGrowthPct,
    currentPrice,
  });
  let highValuation = calculateDcfValuation({
    ...valuationInput,
    growthRatePct: highGrowthPct,
    currentPrice,
  });

  if (!lowValuation || !highValuation) {
    return null;
  }

  while (
    highValuation.intrinsicPricePerShare < currentPrice &&
    highGrowthPct < 300
  ) {
    highGrowthPct += 20;
    highValuation = calculateDcfValuation({
      ...valuationInput,
      growthRatePct: highGrowthPct,
      currentPrice,
    });
    if (!highValuation) {
      return null;
    }
  }

  if (
    currentPrice < lowValuation.intrinsicPricePerShare ||
    currentPrice > highValuation.intrinsicPricePerShare
  ) {
    return null;
  }

  for (let index = 0; index < 70; index += 1) {
    const midGrowthPct = (lowGrowthPct + highGrowthPct) / 2;
    const midValuation = calculateDcfValuation({
      ...valuationInput,
      growthRatePct: midGrowthPct,
      currentPrice,
    });

    if (!midValuation) {
      return null;
    }

    if (midValuation.intrinsicPricePerShare < currentPrice) {
      lowGrowthPct = midGrowthPct;
      lowValuation = midValuation;
    } else {
      highGrowthPct = midGrowthPct;
      highValuation = midValuation;
    }
  }

  return {
    impliedGrowthRatePct: highGrowthPct,
    intrinsicPricePerShare: highValuation.intrinsicPricePerShare,
  };
}
