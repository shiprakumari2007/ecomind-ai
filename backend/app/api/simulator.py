from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.session import get_db
from ..database.models import EnergyRecord, Setting
from ..schemas.schemas import SimulationRequest, SimulationResponse

router = APIRouter()


@router.post("/simulate", response_model=SimulationResponse)
def run_what_if_simulation(
    params: SimulationRequest,
    db: Session = Depends(get_db),
):
    """
    Simulates operational adjustments (HVAC setpoints, lighting schedules,
    equipment upgrades, solar capacity) and calculates live energy, cost,
    and carbon savings.
    """
    rate_setting = db.query(Setting).filter(Setting.key == "electricity_rate").first()
    rate = float(rate_setting.value) if rate_setting else 0.15

    carbon_setting = db.query(Setting).filter(Setting.key == "carbon_factor").first()
    carbon_factor = float(carbon_setting.value) if carbon_setting else 0.72

    # Query total consumption to establish baseline
    total_kwh = float(db.query(func.sum(EnergyRecord.energy_consumption_kwh)).scalar() or 0.0)

    # Estimate 30-day baseline
    if total_kwh > 0:
        min_ts, max_ts = db.query(func.min(EnergyRecord.timestamp), func.max(EnergyRecord.timestamp)).first()
        days_covered = max(1, (max_ts - min_ts).days) if min_ts and max_ts else 180
        baseline_monthly_kwh = (total_kwh / days_covered) * 30.0
    else:
        baseline_monthly_kwh = 48500.0  # Synthetic fallback baseline

    # Approximate energy fractions by subsystem from building physics benchmarks:
    # HVAC ~ 40%, Lighting ~ 20%, Equipment & Machinery ~ 30%, Plug Loads ~ 10%
    hvac_baseline = baseline_monthly_kwh * 0.40
    lighting_baseline = baseline_monthly_kwh * 0.20
    equipment_baseline = baseline_monthly_kwh * 0.30

    # 1. AC Temperature Offset Savings (ASHRAE benchmark: ~6.5% savings per +1.0°C offset)
    ac_temp_pct = min(0.25, max(0.0, (params.ac_temp_offset * 0.065)))
    saved_ac_temp_kwh = hvac_baseline * ac_temp_pct

    # 2. AC Operating Hours Reduction (assuming 12h normal duty cycle, reduction saves proportionally)
    ac_hour_pct = min(0.40, max(0.0, (params.ac_operating_hours_reduction / 12.0) * 0.75))
    saved_ac_hours_kwh = (hvac_baseline - saved_ac_temp_kwh) * ac_hour_pct

    total_ac_saved_kwh = saved_ac_temp_kwh + saved_ac_hours_kwh

    # 3. Lighting Operating Hours Reduction (assuming 14h baseline schedule)
    light_pct = min(0.50, max(0.0, (params.lighting_hours_reduction / 14.0) * 0.85))
    saved_lighting_kwh = lighting_baseline * light_pct

    # 4. Equipment Efficiency Upgrade
    equip_pct = min(0.40, max(0.0, params.equipment_efficiency_boost_pct / 100.0))
    saved_equipment_kwh = equipment_baseline * equip_pct

    # 5. Solar Offset
    solar_monthly_kwh = params.solar_offset_kwh_daily * 30.0

    # Total Savings
    total_saved_kwh = round(total_ac_saved_kwh + saved_lighting_kwh + saved_equipment_kwh + solar_monthly_kwh, 1)
    simulated_monthly_kwh = max(100.0, round(baseline_monthly_kwh - total_saved_kwh, 1))
    saved_kwh_pct = round((total_saved_kwh / max(1.0, baseline_monthly_kwh)) * 100, 1)

    # Financials
    baseline_monthly_bill = round(baseline_monthly_kwh * rate, 2)
    simulated_monthly_bill = round(simulated_monthly_kwh * rate, 2)
    saved_monthly_bill = round(baseline_monthly_bill - simulated_monthly_bill, 2)

    # Carbon
    baseline_monthly_co2 = round(baseline_monthly_kwh * carbon_factor, 1)
    simulated_monthly_co2 = round(simulated_monthly_kwh * carbon_factor, 1)
    saved_monthly_co2 = round(baseline_monthly_co2 - simulated_monthly_co2, 1)

    # Annualized
    annual_financial = round(saved_monthly_bill * 12.0, 2)
    annual_co2 = round(saved_monthly_co2 * 12.0, 1)

    breakdown = {
        "HVAC Setpoint & Schedule": {
            "saved_kwh": round(total_ac_saved_kwh, 1),
            "saved_bill": round(total_ac_saved_kwh * rate, 2),
            "saved_co2": round(total_ac_saved_kwh * carbon_factor, 1),
        },
        "Lighting Reduction": {
            "saved_kwh": round(saved_lighting_kwh, 1),
            "saved_bill": round(saved_lighting_kwh * rate, 2),
            "saved_co2": round(saved_lighting_kwh * carbon_factor, 1),
        },
        "Equipment Upgrades": {
            "saved_kwh": round(saved_equipment_kwh, 1),
            "saved_bill": round(saved_equipment_kwh * rate, 2),
            "saved_co2": round(saved_equipment_kwh * carbon_factor, 1),
        },
        "Solar Clean Energy": {
            "saved_kwh": round(solar_monthly_kwh, 1),
            "saved_bill": round(solar_monthly_kwh * rate, 2),
            "saved_co2": round(solar_monthly_kwh * carbon_factor, 1),
        },
    }

    return SimulationResponse(
        baseline_monthly_kwh=round(baseline_monthly_kwh, 1),
        simulated_monthly_kwh=simulated_monthly_kwh,
        saved_monthly_kwh=total_saved_kwh,
        saved_kwh_percentage=saved_kwh_pct,
        baseline_monthly_bill=baseline_monthly_bill,
        simulated_monthly_bill=simulated_monthly_bill,
        saved_monthly_bill=saved_monthly_bill,
        baseline_monthly_co2_kg=baseline_monthly_co2,
        simulated_monthly_co2_kg=simulated_monthly_co2,
        saved_monthly_co2_kg=saved_monthly_co2,
        annualized_financial_savings=annual_financial,
        annualized_co2_savings_kg=annual_co2,
        breakdown_by_initiative=breakdown,
    )
