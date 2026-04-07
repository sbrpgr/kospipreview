export type PredictionInput = {
  nightFuturesChange: number;
  ewyChange: number;
  ndfChange: number;
  wtiChange: number;
  sp500Change: number;
  vix: number;
  nightFuturesPrice: number;
};

export type Coefficients = {
  alpha0: number;
  alpha1: number;
  alpha2: number;
  alpha3: number;
  alpha4: number;
  alpha5: number;
  residualStd: number;
};

export function calculatePrediction(
  data: PredictionInput,
  coefficients: Coefficients,
  prevKospiClose: number,
) {
  const predictedChange =
    coefficients.alpha0 +
    coefficients.alpha1 * data.nightFuturesChange +
    coefficients.alpha2 * data.ewyChange +
    coefficients.alpha3 * data.ndfChange +
    coefficients.alpha4 * data.wtiChange +
    coefficients.alpha5 * data.sp500Change;

  const pointPredictionA = prevKospiClose * (1 + predictedChange / 100);
  const pointPredictionB = 6.1948 * data.nightFuturesPrice + 480.54;
  const divergence = Math.abs(pointPredictionA - pointPredictionB) / prevKospiClose * 100;

  const pointPrediction =
    divergence < 0.5 ? pointPredictionA : pointPredictionA * 0.7 + pointPredictionB * 0.3;

  const bandMultiplier =
    data.vix < 20 ? 1.0 : data.vix < 25 ? 1.3 : data.vix < 30 ? 1.5 : 2.0;

  const bandWidth = coefficients.residualStd * bandMultiplier;
  const directionsAgree = Math.sign(data.nightFuturesChange) === Math.sign(data.ewyChange);
  const allAgree =
    directionsAgree && Math.sign(data.nightFuturesChange) === Math.sign(data.sp500Change);

  const confidence =
    allAgree && data.vix < 20 && divergence < 0.2
      ? 5
      : directionsAgree && divergence < 0.3
        ? 4
        : data.vix < 25
          ? 3
          : data.vix < 30
            ? 2
            : 1;

  return {
    pointPrediction: Number(pointPrediction.toFixed(2)),
    bandUpper: Number((pointPrediction + bandWidth).toFixed(2)),
    bandLower: Number((pointPrediction - bandWidth).toFixed(2)),
    predictedChangePct: Number(predictedChange.toFixed(2)),
    confidence,
    modelA: Number(pointPredictionA.toFixed(2)),
    modelB: Number(pointPredictionB.toFixed(2)),
    divergencePct: Number(divergence.toFixed(2)),
    bandMultiplier,
  };
}
