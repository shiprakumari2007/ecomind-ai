from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error


class EnergyForecaster:
    """
    Time-Series Energy Forecaster using feature-engineered machine learning
    with residual-based confidence bounds and evaluation metrics.
    """

    def __init__(self, horizon_days: int = 7, model_type: str = "GradientBoosting"):
        self.horizon_days = horizon_days
        self.model_type = model_type
        if model_type == "GradientBoosting":
            self.model = GradientBoostingRegressor(
                n_estimators=150,
                max_depth=4,
                learning_rate=0.08,
                random_state=42,
            )
        else:
            self.model = RandomForestRegressor(
                n_estimators=120,
                max_depth=8,
                random_state=42,
                n_jobs=-1,
            )
        self.mae = 0.0
        self.rmse = 0.0
        self.mape = 0.0
        self.residual_std = 0.0

    def _prepare_daily_series(self, df: pd.DataFrame) -> pd.DataFrame:
        """Aggregates raw hourly records to daily level for robust forecasting."""
        df_copy = df.copy()
        if not pd.api.types.is_datetime64_any_dtype(df_copy["timestamp"]):
            df_copy["timestamp"] = pd.to_datetime(df_copy["timestamp"])

        daily = df_copy.groupby(pd.Grouper(key="timestamp", freq="D")).agg(
            total_kwh=("energy_consumption_kwh", "sum"),
            avg_temp=("temperature", "mean"),
            avg_occupancy=("occupancy", "mean"),
            rate=("electricity_rate", "mean"),
        ).reset_index()

        daily = daily.dropna(subset=["total_kwh"])
        daily = daily[daily["total_kwh"] > 0].sort_values("timestamp").reset_index(drop=True)
        return daily

    def _create_lag_features(self, daily: pd.DataFrame) -> pd.DataFrame:
        """Creates lag and calendar features for the forecasting model."""
        df = daily.copy()
        df["day_of_week"] = df["timestamp"].dt.dayofweek
        df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
        df["day_of_year"] = df["timestamp"].dt.dayofyear
        df["month"] = df["timestamp"].dt.month

        # Lags
        df["lag_1"] = df["total_kwh"].shift(1)
        df["lag_2"] = df["total_kwh"].shift(2)
        df["lag_7"] = df["total_kwh"].shift(7)

        # Rolling statistics
        df["rolling_mean_7"] = df["total_kwh"].shift(1).rolling(7).mean()
        df["rolling_std_7"] = df["total_kwh"].shift(1).rolling(7).std().fillna(0)

        # Fill early lags with backward fill
        df = df.bfill()
        return df

    def forecast(
        self,
        df: pd.DataFrame,
        electricity_rate: float = 0.15
    ) -> Dict[str, Any]:
        """
        Trains model on available historical data, computes out-of-sample metrics,
        and generates multi-step predictions for the next horizon_days.
        """
        daily = self._prepare_daily_series(df)
        if len(daily) < 14:
            raise ValueError(
                "Insufficient historical data: At least 14 days of data are required "
                "to train the energy forecasting model."
            )

        featured = self._create_lag_features(daily)
        feature_cols = [
            "day_of_week",
            "is_weekend",
            "day_of_year",
            "month",
            "avg_temp",
            "avg_occupancy",
            "lag_1",
            "lag_2",
            "lag_7",
            "rolling_mean_7",
            "rolling_std_7",
        ]

        # Train/Test Split (last 14 days for validation metrics)
        val_size = min(14, max(5, int(len(featured) * 0.15)))
        train_df = featured.iloc[:-val_size]
        val_df = featured.iloc[-val_size:]

        X_train = train_df[feature_cols].values
        y_train = train_df["total_kwh"].values
        X_val = val_df[feature_cols].values
        y_val = val_df["total_kwh"].values

        self.model.fit(X_train, y_train)

        # Out of sample validation evaluation
        val_preds = self.model.predict(X_val)
        residuals = y_val - val_preds
        self.mae = float(mean_absolute_error(y_val, val_preds))
        self.rmse = float(np.sqrt(mean_squared_error(y_val, val_preds)))
        self.mape = float(mean_absolute_percentage_error(y_val, val_preds) * 100.0)
        self.residual_std = float(np.std(residuals)) if len(residuals) > 1 else max(10.0, self.mae)

        # Refit model on full dataset for final future forecasting
        X_full = featured[feature_cols].values
        y_full = featured["total_kwh"].values
        self.model.fit(X_full, y_full)

        # Multi-step future forecast
        last_date = daily["timestamp"].max()
        last_row = featured.iloc[-1].copy()

        future_points = []
        recent_history = list(daily["total_kwh"].values[-14:])
        current_date = last_date

        next_7_days_kwh = 0.0

        for step in range(1, self.horizon_days + 1):
            target_date = current_date + timedelta(days=step)
            dow = target_date.weekday()
            is_wknd = 1 if dow >= 5 else 0
            doy = target_date.timetuple().tm_yday
            month = target_date.month

            # Estimated temperature from seasonal historical mean
            hist_temp_match = daily[daily["timestamp"].dt.month == month]["avg_temp"].mean()
            est_temp = hist_temp_match if not np.isnan(hist_temp_match) else 22.0

            # Estimated occupancy
            est_occ = 10.0 if is_wknd else 35.0

            lag1 = recent_history[-1]
            lag2 = recent_history[-2] if len(recent_history) >= 2 else lag1
            lag7 = recent_history[-7] if len(recent_history) >= 7 else lag1
            r_mean7 = float(np.mean(recent_history[-7:]))
            r_std7 = float(np.std(recent_history[-7:]))

            x_input = np.array([[
                dow, is_wknd, doy, month, est_temp, est_occ,
                lag1, lag2, lag7, r_mean7, r_std7
            ]])

            pred_kwh = float(self.model.predict(x_input)[0])
            pred_kwh = max(10.0, round(pred_kwh, 2))
            recent_history.append(pred_kwh)

            # 95% Confidence interval (+/- 1.96 * residual std)
            ci_margin = 1.96 * self.residual_std
            lower_bound = max(0.0, round(pred_kwh - ci_margin, 2))
            upper_bound = round(pred_kwh + ci_margin, 2)

            future_points.append({
                "forecast_date": target_date.strftime("%Y-%m-%d"),
                "predicted_kwh": pred_kwh,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
            })
            next_7_days_kwh += pred_kwh

        # Project 30 days monthly consumption
        daily_avg_forecast = next_7_days_kwh / self.horizon_days
        expected_monthly_kwh = round(daily_avg_forecast * 30.0, 2)
        estimated_future_bill = round(expected_monthly_kwh * electricity_rate, 2)

        # Potential wastage estimation (estimated at ~8-14% of projected load)
        potential_wastage_kwh = round(expected_monthly_kwh * 0.112, 2)

        # Historical last 14 days actuals for plotting continuity
        historical_points = []
        for _, row in daily.tail(14).iterrows():
            historical_points.append({
                "forecast_date": row["timestamp"].strftime("%Y-%m-%d"),
                "predicted_kwh": round(float(row["total_kwh"]), 2),
                "lower_bound": round(float(row["total_kwh"]), 2),
                "upper_bound": round(float(row["total_kwh"]), 2),
                "actual_kwh": round(float(row["total_kwh"]), 2),
            })

        all_points = historical_points + future_points

        limitations = (
            "Forecast assumes operational schedules and occupancy patterns remain consistent "
            "with historical training data. Extreme unforeseen weather events or unexpected "
            "equipment failure may cause variance beyond the 95% confidence bounds."
        )

        return {
            "horizon_days": self.horizon_days,
            "next_7_days_kwh": round(next_7_days_kwh, 2),
            "expected_monthly_kwh": expected_monthly_kwh,
            "estimated_future_bill": estimated_future_bill,
            "potential_wastage_kwh": potential_wastage_kwh,
            "model_name": f"{self.model_type}-TimeSeries",
            "mae": round(self.mae, 2),
            "rmse": round(self.rmse, 2),
            "mape": round(self.mape, 2),
            "confidence_level_pct": 95.0,
            "points": all_points,
            "model_limitations": limitations,
        }
