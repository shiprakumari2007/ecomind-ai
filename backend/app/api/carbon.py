from typing import Dict, Any, List
import pandas as pd
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.session import get_db
from ..database.models import EnergyRecord, Setting
from ..schemas.schemas import CarbonFootprintResponse, DepartmentConsumption, CarbonTrendPoint

router = APIRouter()


@router.get("/summary", response_model=CarbonFootprintResponse)
def get_carbon_summary(
    emission_factor_override: float = Query(default=None, ge=0.01, le=5.0),
    db: Session = Depends(get_db),
):
    """
    Calculates comprehensive carbon emissions (Scope 2 electricity),
    department allocations, equivalent ecological offsets, and monthly trends.
    """
    factor = emission_factor_override if isinstance(emission_factor_override, (int, float)) else None
    if factor is None:
        setting = db.query(Setting).filter(Setting.key == "carbon_factor").first()
        factor = float(setting.value) if setting else 0.72

    rate_setting = db.query(Setting).filter(Setting.key == "electricity_rate").first()
    rate = float(rate_setting.value) if rate_setting else 0.15

    total_kwh = float(db.query(func.sum(EnergyRecord.energy_consumption_kwh)).scalar() or 0.0)

    if total_kwh == 0:
        return CarbonFootprintResponse(
            emission_factor_used=factor,
            total_co2_kg=0.0,
            daily_avg_co2_kg=0.0,
            monthly_co2_kg=0.0,
            department_emissions=[],
            reduction_potential_co2_kg=0.0,
            equivalent_trees_needed=0,
            equivalent_cars_driven_miles=0.0,
            trend=[],
        )

    total_co2_kg = total_kwh * factor

    # Department breakdown
    dept_rows = (
        db.query(
            EnergyRecord.department,
            func.sum(EnergyRecord.energy_consumption_kwh).label("kwh"),
        )
        .group_by(EnergyRecord.department)
        .all()
    )

    dept_emissions = []
    for d_name, d_kwh in dept_rows:
        d_kwh = float(d_kwh)
        d_co2 = d_kwh * factor
        pct = round((d_kwh / max(1.0, total_kwh)) * 100, 1)
        dept_emissions.append(
            DepartmentConsumption(
                department=d_name,
                consumption_kwh=round(d_kwh, 1),
                percentage=pct,
                bill=round(d_kwh * rate, 2),
                co2_kg=round(d_co2, 1),
            )
        )
    dept_emissions.sort(key=lambda x: x.co2_kg, reverse=True)

    # Monthly Trend calculation
    records = db.query(EnergyRecord.timestamp, EnergyRecord.energy_consumption_kwh).all()
    df = pd.DataFrame(records, columns=["timestamp", "kwh"])
    df["dt"] = pd.to_datetime(df["timestamp"])
    df["month_str"] = df["dt"].dt.strftime("%b %Y")
    df["year_month"] = df["dt"].dt.to_period("M")

    monthly_grouped = df.groupby(["year_month", "month_str"])["kwh"].sum().reset_index()

    trend = []
    for _, row in monthly_grouped.sort_values("year_month").iterrows():
        m_kwh = float(row["kwh"])
        m_co2 = round(m_kwh * factor, 1)
        # Target is a progressive 15% reduction glidepath
        m_target = round(m_co2 * 0.85, 1)
        trend.append(
            CarbonTrendPoint(
                period=row["month_str"],
                co2_kg=m_co2,
                target_co2_kg=m_target,
            )
        )

    num_days = max(1, (df["dt"].max() - df["dt"].min()).days) if not df.empty else 180
    daily_avg_co2 = round(total_co2_kg / num_days, 1)
    monthly_co2 = round(daily_avg_co2 * 30.0, 1)

    # Decarbonization reduction potential: ~18-24% via efficiency + controls
    reduction_potential = round(total_co2_kg * 0.185, 1)

    # Equivalence conversions (EPA Greenhouse Gas Equivalencies standards):
    # 1 mature urban tree sequesters ~21.77 kg CO2 / year
    # 1 typical passenger vehicle emits ~0.404 kg CO2 / mile
    trees_needed = int(round(total_co2_kg / 21.77))
    car_miles = round(total_co2_kg / 0.404, 1)

    return CarbonFootprintResponse(
        emission_factor_used=factor,
        total_co2_kg=round(total_co2_kg, 1),
        daily_avg_co2_kg=daily_avg_co2,
        monthly_co2_kg=monthly_co2,
        department_emissions=dept_emissions,
        reduction_potential_co2_kg=reduction_potential,
        equivalent_trees_needed=trees_needed,
        equivalent_cars_driven_miles=car_miles,
        trend=trend,
    )
