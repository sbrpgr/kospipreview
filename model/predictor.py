from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass
class PredictionInput:
    night_futures_change: float = 0.0
    ewy_change: float = 0.0
    ndf_change: float = 0.0
    wti_change: float = 0.0
    sp500_change: float = 0.0
    vix: float = 20.0
    night_futures_price: float = 0.0


@dataclass
class Coefficients:
    alpha0: float
    alpha1: float
    alpha2: float
    alpha3: float
    alpha4: float
    alpha5: float
    residual_std: float


def calculate_prediction(
    data: PredictionInput,
    coefficients: Coefficients,
    prev_kospi_close: float,
) -> dict[str, float | int | str]:
    predicted_change = (
        coefficients.alpha0
        + coefficients.alpha1 * data.night_futures_change
        + coefficients.alpha2 * data.ewy_change
        + coefficients.alpha3 * data.ndf_change
        + coefficients.alpha4 * data.wti_change
        + coefficients.alpha5 * data.sp500_change
    )

    point_prediction_a = prev_kospi_close * (1 + predicted_change / 100)
    point_prediction_b = 6.1948 * data.night_futures_price + 480.54 if data.night_futures_price else point_prediction_a
    divergence = abs(point_prediction_a - point_prediction_b) / prev_kospi_close * 100 if prev_kospi_close else 0.0

    if divergence < 0.5:
        point_prediction = point_prediction_a
    else:
        point_prediction = point_prediction_a * 0.7 + point_prediction_b * 0.3

    if data.vix < 20:
        band_multiplier = 1.0
    elif data.vix < 25:
        band_multiplier = 1.3
    elif data.vix < 30:
        band_multiplier = 1.5
    else:
        band_multiplier = 2.0

    band_width = coefficients.residual_std * band_multiplier
    directions_agree = _sign(data.night_futures_change) == _sign(data.ewy_change)
    all_agree = directions_agree and _sign(data.night_futures_change) == _sign(data.sp500_change)

    if all_agree and data.vix < 20 and divergence < 0.2:
        confidence = 5
    elif directions_agree and divergence < 0.3:
        confidence = 4
    elif data.vix < 25:
        confidence = 3
    elif data.vix < 30:
        confidence = 2
    else:
        confidence = 1

    return {
      "point_prediction": round(point_prediction, 2),
      "band_upper": round(point_prediction + band_width, 2),
      "band_lower": round(point_prediction - band_width, 2),
      "predicted_change_pct": round(predicted_change, 2),
      "confidence": confidence,
      "model_a": round(point_prediction_a, 2),
      "model_b": round(point_prediction_b, 2),
      "divergence_pct": round(divergence, 2),
      "band_multiplier": band_multiplier,
      "last_updated": datetime.now().isoformat(),
    }


def _sign(value: float) -> int:
    if value > 0:
        return 1
    if value < 0:
        return -1
    return 0
