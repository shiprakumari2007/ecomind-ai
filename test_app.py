"""
EcoMind AI — Automated Verification Test Suite
Tests all core modules and API endpoints end-to-end against the local database.
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.database.session import init_db, SessionLocal
from app.services.dataset_service import DatasetService
from app.api.analytics import get_energy_overview
from app.api.anomalies import get_anomalies, run_anomaly_detection
from app.api.forecasting import get_energy_forecast
from app.api.recommendations import get_recommendations
from app.api.carbon import get_carbon_summary
from app.api.simulator import run_what_if_simulation
from app.schemas.schemas import SimulationRequest
from app.services.llm_service import LLMService
from app.api.reports import generate_report
from app.api.settings import get_settings


def run_tests():
    print("=" * 70)
    print("🌿 EcoMind AI — End-to-End System Verification Test Suite")
    print("=" * 70)

    # 1. Database Initialization
    print("\n[1/10] Initializing Database & Seeding 6-Month Dataset...")
    init_db()
    db = SessionLocal()
    seed_res = DatasetService.load_sample_dataset_into_db(db)
    print(f"  ✓ Ingested {seed_res['records_count']:,} hourly telemetry records.")

    # 2. Analytics Overview
    print("\n[2/10] Testing Energy Analytics Overview (Module A)...")
    overview = get_energy_overview(days=180, department="all", building="all", db=db)
    print(f"  ✓ Total Consumption: {overview.metrics.total_consumption_kwh:,.1f} kWh")
    print(f"  ✓ Estimated Spend: ${overview.metrics.total_bill:,.2f}")
    print(f"  ✓ Carbon Footprint: {overview.metrics.total_co2_kg:,.1f} kg CO2e")
    print(f"  ✓ Efficiency Score: {overview.metrics.efficiency_score}/100")
    print(f"  ✓ Daily Trend Points: {len(overview.daily_trend)}")
    assert overview.metrics.total_consumption_kwh > 0, "Total consumption must be greater than 0"

    # 3. Anomaly Detection (Isolation Forest)
    print("\n[3/10] Testing AI Anomaly Detection with Isolation Forest (Module C)...")
    anom_run = run_anomaly_detection(contamination=0.03, db=db)
    print(f"  ✓ Model Run: {anom_run['message']}")
    anom_res = get_anomalies(db=db)
    print(f"  ✓ Flagged Anomalies: {anom_res.total_anomalies} (Critical: {anom_res.critical_count}, High: {anom_res.high_count})")
    assert anom_res.total_anomalies > 0, "Should detect anomalies"

    # 4. Energy Forecasting
    print("\n[4/10] Testing Machine Learning Forecasting Engine (Module D)...")
    forecast = get_energy_forecast(horizon=7, model_type="GradientBoosting", db=db)
    print(f"  ✓ Model: {forecast.model_name}")
    print(f"  ✓ Next 7-Day Forecast: {forecast.next_7_days_kwh:,.1f} kWh")
    print(f"  ✓ Projected Monthly Demand: {forecast.expected_monthly_kwh:,.1f} kWh")
    print(f"  ✓ Validation MAE: {forecast.mae} kWh | RMSE: {forecast.rmse} kWh")
    assert len(forecast.points) >= 21, "Must contain historical and forecast points"

    # 5. AI Sustainability Recommendations
    print("\n[5/10] Testing Sustainability Recommendation Engine (Module E)...")
    recs = get_recommendations(category="all", priority="all", db=db)
    print(f"  ✓ Generated {recs.recommendation_count} Actionable Initiatives.")
    print(f"  ✓ Total Potential kWh Saved: {recs.total_potential_kwh_savings:,.1f} kWh/yr")
    print(f"  ✓ Total Cost Savings: ${recs.total_monetary_savings:,.2f}/yr")
    assert recs.recommendation_count >= 5, "Should generate at least 5 structured recommendations"

    # 6. Carbon Footprint Analyzer
    print("\n[6/10] Testing Scope 2 Carbon Footprint Analyzer (Module G)...")
    carbon = get_carbon_summary(emission_factor_override=0.72, db=db)
    print(f"  ✓ Total CO2: {carbon.total_co2_kg:,.1f} kg ({(carbon.total_co2_kg / 1000):,.2f} metric tons)")
    print(f"  ✓ Mature Trees Needed: {carbon.equivalent_trees_needed:,} trees")
    print(f"  ✓ Passenger Car Offset: {carbon.equivalent_cars_driven_miles:,.1f} miles")
    assert carbon.total_co2_kg > 0, "Carbon emissions must be computed"

    # 7. What-If Energy Simulator
    print("\n[7/10] Testing What-If Energy Simulator (Module H)...")
    sim_params = SimulationRequest(
        ac_temp_offset=1.5,
        ac_operating_hours_reduction=2.0,
        lighting_hours_reduction=3.0,
        equipment_efficiency_boost_pct=15.0,
        solar_offset_kwh_daily=50.0,
    )
    sim_res = run_what_if_simulation(params=sim_params, db=db)
    print(f"  ✓ Baseline Monthly Load: {sim_res.baseline_monthly_kwh:,.1f} kWh")
    print(f"  ✓ Simulated Monthly Load: {sim_res.simulated_monthly_kwh:,.1f} kWh")
    print(f"  ✓ Monthly Savings: {sim_res.saved_monthly_kwh:,.1f} kWh ({sim_res.saved_kwh_percentage}%)")
    print(f"  ✓ Annualized Financial Savings: ${sim_res.annualized_financial_savings:,.2f}")
    assert sim_res.saved_monthly_kwh > 0, "Simulator must generate positive savings"

    # 8. EcoBot Grounded Chatbot
    print("\n[8/10] Testing EcoBot AI Sustainability Assistant (Module F)...")
    bot_res = LLMService.chat("Which department wastes the most energy?", "test_suite", db)
    print(f"  ✓ Model: {bot_res['model_used']}")
    print(f"  ✓ Grounded Answer: {bot_res['answer'][:110]}...")
    assert len(bot_res['answer']) > 50, "Chatbot must provide rich grounded response"

    # 9. PDF Report Generation
    print("\n[9/10] Testing Professional PDF Report Generation (Module I)...")
    report_res = generate_report(db=db)
    print(f"  ✓ Generated PDF: {report_res['filename']} ({report_res['file_size_kb']} KB)")
    assert Path(report_res['download_url'].replace('/api/reports/download/', 'backend/reports/')).exists(), "PDF file must exist on disk"

    # 10. System Configuration & Settings
    print("\n[10/10] Testing System Configuration & Settings...")
    settings = get_settings(db=db)
    print(f"  ✓ Tariff: ${settings.electricity_rate}/kWh | Carbon Factor: {settings.carbon_factor} kg/kWh")
    print(f"  ✓ Database Records: {settings.record_count:,}")

    db.close()
    print("\n" + "=" * 70)
    print("🎉 ALL 10 VERIFICATION MODULES PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
