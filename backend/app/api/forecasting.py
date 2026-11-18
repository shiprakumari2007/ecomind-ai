from typing import Dict, Any, List
import pandas as pd
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import EnergyRecord, Setting
from ..ml.forecaster import EnergyForecaster
from ..schemas.schemas import ForecastResponse

router = APIRouter()


@router.get("/predict", response_model=ForecastResponse)
def get_energy_forecast(
    horizon: int = Query(default=7, ge=3, le=14),
    model_type: str = Query(default="GradientBoosting", pattern="^(GradientBoosting|RandomForest)$"),
    db: Session = Depends(get_db),
):
    """
    Executes time-series forecasting to predict future electricity consumption,
    calculates out-of-sample MAE/RMSE error metrics, and provides
    95% prediction confidence intervals.
    """
    records = db.query(
        EnergyRecord.timestamp,
        EnergyRecord.energy_consumption_kwh,
        EnergyRecord.temperature,
        EnergyRecord.occupancy,
        EnergyRecord.electricity_rate,
    ).all()

    if not records or len(records) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient historical records to generate accurate ML forecasts. Please load or upload dataset.",
        )

    rate_setting = db.query(Setting).filter(Setting.key == "electricity_rate").first()
    rate = float(rate_setting.value) if rate_setting else 0.15

    df = pd.DataFrame(records, columns=[
        "timestamp",
        "energy_consumption_kwh",
        "temperature",
        "occupancy",
        "electricity_rate",
    ])

    horizon_val = horizon if isinstance(horizon, int) else 7
    model_type_val = model_type if isinstance(model_type, str) else "GradientBoosting"

    try:
        forecaster = EnergyForecaster(horizon_days=horizon_val, model_type=model_type_val)
        forecast_result = forecaster.forecast(df, electricity_rate=rate)
        return ForecastResponse(**forecast_result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecasting calculation error: {str(e)}",
        )
