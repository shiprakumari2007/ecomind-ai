import os
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.session import get_db
from ..database.models import Setting, EnergyRecord, Anomaly, Recommendation, ChatHistory, Report
from ..schemas.schemas import SystemConfig

router = APIRouter()


class SettingsUpdatePayload(BaseModel):
    electricity_rate: float = None
    carbon_factor: float = None
    currency: str = None
    gemini_api_key: str = None


@router.get("", response_model=SystemConfig)
def get_settings(db: Session = Depends(get_db)):
    """Retrieves system configuration parameters and operational statistics."""
    rate_setting = db.query(Setting).filter(Setting.key == "electricity_rate").first()
    rate = float(rate_setting.value) if rate_setting else 0.15

    carbon_setting = db.query(Setting).filter(Setting.key == "carbon_factor").first()
    carbon = float(carbon_setting.value) if carbon_setting else 0.72

    currency_setting = db.query(Setting).filter(Setting.key == "currency").first()
    curr = currency_setting.value if currency_setting else "USD"

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    has_key = bool(gemini_key)

    total_records = db.query(func.count(EnergyRecord.id)).scalar() or 0
    min_ts = db.query(func.min(EnergyRecord.timestamp)).scalar()
    max_ts = db.query(func.max(EnergyRecord.timestamp)).scalar()

    return SystemConfig(
        electricity_rate=rate,
        carbon_factor=carbon,
        currency=curr,
        has_gemini_key=has_key,
        record_count=total_records,
        date_range_start=min_ts,
        date_range_end=max_ts,
    )


@router.post("", response_model=Dict[str, Any])
def update_settings(payload: SettingsUpdatePayload, db: Session = Depends(get_db)):
    """Updates global parameters such as electricity tariff and emission factor."""
    if payload.electricity_rate is not None:
        setting = db.query(Setting).filter(Setting.key == "electricity_rate").first()
        if not setting:
            setting = Setting(key="electricity_rate", value=str(payload.electricity_rate), description="Electricity Tariff $/kWh")
            db.add(setting)
        else:
            setting.value = str(payload.electricity_rate)

    if payload.carbon_factor is not None:
        setting = db.query(Setting).filter(Setting.key == "carbon_factor").first()
        if not setting:
            setting = Setting(key="carbon_factor", value=str(payload.carbon_factor), description="Carbon emission factor kg CO2/kWh")
            db.add(setting)
        else:
            setting.value = str(payload.carbon_factor)

    if payload.currency is not None:
        setting = db.query(Setting).filter(Setting.key == "currency").first()
        if not setting:
            setting = Setting(key="currency", value=payload.currency.upper(), description="Display Currency Code")
            db.add(setting)
        else:
            setting.value = payload.currency.upper()

    if payload.gemini_api_key is not None:
        os.environ["GEMINI_API_KEY"] = payload.gemini_api_key.strip()

    db.commit()
    return {"success": True, "message": "Settings updated successfully."}


@router.post("/reset", response_model=Dict[str, Any])
def reset_database(db: Session = Depends(get_db)):
    """Clears all records, anomalies, recommendations, and reports to start fresh."""
    db.query(EnergyRecord).delete()
    db.query(Anomaly).delete()
    db.query(Recommendation).delete()
    db.query(ChatHistory).delete()
    db.query(Report).delete()
    db.commit()

    return {
        "success": True,
        "message": "Database reset completed. All energy records and analytics have been cleared.",
    }
