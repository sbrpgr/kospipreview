import unittest

from model.predictor import Coefficients, PredictionInput, calculate_prediction


class PredictorTests(unittest.TestCase):
    def test_prediction_structure_and_band_order(self):
        result = calculate_prediction(
            PredictionInput(
                night_futures_change=0.5,
                ewy_change=0.8,
                ndf_change=-0.1,
                wti_change=0.3,
                sp500_change=0.4,
                vix=18.0,
                night_futures_price=0.0,
            ),
            Coefficients(
                alpha0=0.1,
                alpha1=0.2,
                alpha2=0.3,
                alpha3=-0.1,
                alpha4=0.05,
                alpha5=0.15,
                residual_std=8.0,
            ),
            2700.0,
        )
        self.assertIn("point_prediction", result)
        self.assertLess(result["band_lower"], result["band_upper"])
        self.assertIn(result["confidence"], {1, 2, 3, 4, 5})

    def test_vix_changes_band_multiplier(self):
        low_vix = calculate_prediction(
            PredictionInput(vix=19.0),
            Coefficients(0, 0, 0, 0, 0, 0, 10),
            2700,
        )
        high_vix = calculate_prediction(
            PredictionInput(vix=31.0),
            Coefficients(0, 0, 0, 0, 0, 0, 10),
            2700,
        )
        self.assertEqual(low_vix["band_multiplier"], 1.0)
        self.assertEqual(high_vix["band_multiplier"], 2.0)


if __name__ == "__main__":
    unittest.main()
