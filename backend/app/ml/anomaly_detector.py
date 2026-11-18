from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


class EnergyAnomalyDetector:
    """
    Production-grade Anomaly Detector using Isolation Forest
    with domain-grounded explainable AI rules for energy efficiency.
    """

    def __init__(self, contamination: float = 0.03, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            n_estimators=120,
            contamination=contamination,
            max_samples="auto",
            random_state=random_state,
            n_jobs=-1,
        )
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.baseline_stats: Dict[Tuple[str, int], Dict[str, float]] = {}

    def _extract_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, pd.DataFrame]:
        """Extracts engineered temporal, thermal, and occupancy features."""
        df_feat = df.copy()

        # Parse datetime if string
        if not pd.api.types.is_datetime64_any_dtype(df_feat["timestamp"]):
            df_feat["dt"] = pd.to_datetime(df_feat["timestamp"])
        else:
            df_feat["dt"] = df_feat["timestamp"]

        df_feat["hour"] = df_feat["dt"].dt.hour
        df_feat["dayofweek"] = df_feat["dt"].dt.dayofweek
        df_feat["is_weekend"] = (df_feat["dayofweek"] >= 5).astype(int)

        # Cyclical hour encoding
        df_feat["hour_sin"] = np.sin(2 * np.pi * df_feat["hour"] / 24.0)
        df_feat["hour_cos"] = np.cos(2 * np.pi * df_feat["hour"] / 24.0)

        # Compute baselines per (appliance, hour)
        grouped = df_feat.groupby(["appliance", "hour"])["energy_consumption_kwh"].agg(
            ["median", "std", "mean"]
        ).reset_index()

        self.baseline_stats = {}
        for _, row in grouped.iterrows():
            key = (row["appliance"], int(row["hour"]))
            self.baseline_stats[key] = {
                "median": float(row["median"]),
                "std": float(row["std"]) if not np.isnan(row["std"]) and row["std"] > 0 else 1.0,
                "mean": float(row["mean"]),
            }

        # Calculate baseline ratio
        def get_baseline_info(row):
            key = (row["appliance"], int(row["hour"]))
            stats = self.baseline_stats.get(key, {"median": float(row["energy_consumption_kwh"]), "mean": float(row["energy_consumption_kwh"])})
            return stats["median"]

        df_feat["baseline_median"] = df_feat.apply(get_baseline_info, axis=1)
        df_feat["baseline_ratio"] = df_feat["energy_consumption_kwh"] / (df_feat["baseline_median"].replace(0, 0.1))

        # Fill missing values
        df_feat["temperature"] = df_feat["temperature"].fillna(22.0)
        df_feat["occupancy"] = df_feat["occupancy"].fillna(0)

        feature_cols = [
            "energy_consumption_kwh",
            "hour_sin",
            "hour_cos",
            "is_weekend",
            "occupancy",
            "temperature",
            "baseline_ratio",
        ]

        X = df_feat[feature_cols].values
        return X, df_feat

    def fit_predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Fits Isolation Forest and classifies anomalies with explainable reasons
        and severity grading.
        """
        if df.empty:
            return df

        X, df_feat = self._extract_features(df)
        X_scaled = self.scaler.fit_transform(X)

        self.model.fit(X_scaled)
        self.is_fitted = True

        # -1 for anomaly, 1 for normal
        preds = self.model.predict(X_scaled)
        # Decision function: lower values mean more anomalous
        scores = self.model.decision_function(X_scaled)

        df_result = df.copy()
        df_result["is_anomaly"] = preds == -1
        df_result["anomaly_score"] = np.round(scores, 4)

        # Generate explainable reasons & severity
        severities = []
        reasons = []
        expected_values = []
        anomaly_types = []

        for i, row in df_feat.iterrows():
            is_anom = preds[i] == -1
            score = scores[i]
            kwh = row["energy_consumption_kwh"]
            hour = int(row["hour"])
            occ = int(row["occupancy"])
            temp = float(row["temperature"])
            base_kwh = float(row["baseline_median"])
            expected_values.append(round(base_kwh, 2))

            if not is_anom:
                severities.append(None)
                reasons.append(None)
                anomaly_types.append(None)
                continue

            # Calculate ratio of excess
            ratio = kwh / max(0.1, base_kwh)

            # Assign Severity
            if ratio >= 2.8 or score <= -0.18:
                sev = "Critical"
            elif ratio >= 2.0 or score <= -0.12:
                sev = "High"
            elif ratio >= 1.4 or score <= -0.06:
                sev = "Medium"
            else:
                sev = "Low"
            severities.append(sev)

            # Domain condition explanations
            if occ == 0 and kwh > base_kwh * 1.4:
                anom_type = "Unoccupied Hours Wastage"
                reason = (
                    f"Unoccupied Hours Wastage: High draw of {kwh:.1f} kWh recorded "
                    f"while building occupancy was 0 (typical baseline: {base_kwh:.1f} kWh)."
                )
            elif hour in [0, 1, 2, 3, 4, 5] and kwh > base_kwh * 1.6:
                anom_type = "Overnight Energy Leak"
                reason = (
                    f"Overnight Energy Leak: Off-peak load of {kwh:.1f} kWh at {hour:02d}:00 "
                    f"substantially exceeds overnight baseline of {base_kwh:.1f} kWh."
                )
            elif ratio >= 2.2:
                anom_type = "Sudden Spike"
                reason = (
                    f"Sudden Consumption Spike: Instantaneous spike of {kwh:.1f} kWh "
                    f"({ratio:.1f}x above expected {base_kwh:.1f} kWh operating level)."
                )
            elif "Chiller" in str(row["appliance"]) and temp < 21.0 and kwh > base_kwh * 1.3:
                anom_type = "Inefficient Cooling"
                reason = (
                    f"Inefficient Cooling Operation: Chiller drew {kwh:.1f} kWh despite "
                    f"mild outdoor temperature ({temp:.1f}°C)."
                )
            else:
                anom_type = "Unusual Pattern"
                reason = (
                    f"Multivariate Pattern Outlier: Unusual multidimensional deviation "
                    f"detected across power, occupancy, and thermal factors (score: {score:.3f})."
                )

            anomaly_types.append(anom_type)
            reasons.append(reason)

        df_result["anomaly_severity"] = severities
        df_result["anomaly_type"] = anomaly_types
        df_result["anomaly_reason"] = reasons
        df_result["expected_kwh"] = expected_values

        return df_result
