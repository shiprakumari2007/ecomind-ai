from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Settings
class SettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class SettingResponse(SettingBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SystemConfig(BaseModel):
    electricity_rate: float = 0.15
    carbon_factor: float = 0.72
    currency: str = "USD"
    has_gemini_key: bool = False
    record_count: int = 0
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None


# Dataset Schemas
class DataQualityReport(BaseModel):
    total_rows: int
    valid_rows: int
    missing_values_count: int
    missing_by_column: Dict[str, int]
    duplicate_rows: int
    date_range_start: Optional[str] = None
    date_range_end: Optional[str] = None
    buildings_detected: List[str]
    departments_detected: List[str]
    appliances_detected: List[str]
    negative_energy_values_fixed: int
    quality_score: float  # 0 to 100


class DatasetPreview(BaseModel):
    columns: List[str]
    sample_records: List[Dict[str, Any]]
    total_records: int
    quality_report: DataQualityReport


class UploadResponse(BaseModel):
    message: str
    filename: str
    records_processed: int
    quality_report: DataQualityReport


# Overview & Analytics Schemas
class OverviewMetrics(BaseModel):
    total_consumption_kwh: float
    total_bill: float
    total_co2_kg: float
    wastage_kwh: float
    wastage_percentage: float
    efficiency_score: float  # 0 to 100
    previous_period_comparison: float  # % change
    peak_hour: int
    peak_consumption_kwh: float
    top_department: str
    top_appliance: str
    active_anomalies_count: int
    currency: str = "USD"
    carbon_factor: float = 0.72


class TimeSeriesPoint(BaseModel):
    timestamp: str
    actual_kwh: float
    baseline_kwh: Optional[float] = None
    temperature: Optional[float] = None
    occupancy: Optional[int] = None
    is_anomaly: Optional[bool] = False


class DepartmentConsumption(BaseModel):
    department: str
    consumption_kwh: float
    percentage: float
    bill: float
    co2_kg: float


class ApplianceConsumption(BaseModel):
    appliance: str
    department: str
    category: str
    consumption_kwh: float
    percentage: float


class HourlyPattern(BaseModel):
    hour: int
    avg_kwh: float
    max_kwh: float
    min_kwh: float


class DayOfWeekPattern(BaseModel):
    day_name: str
    day_of_week: int
    avg_kwh: float
    total_kwh: float


class EnergyAnalyticsResponse(BaseModel):
    metrics: OverviewMetrics
    daily_trend: List[TimeSeriesPoint]
    department_distribution: List[DepartmentConsumption]
    appliance_distribution: List[ApplianceConsumption]
    hourly_patterns: List[HourlyPattern]
    day_of_week_patterns: List[DayOfWeekPattern]


# Anomaly Detection Schemas
class AnomalyItem(BaseModel):
    id: int
    record_id: Optional[int] = None
    timestamp: str
    building: str
    department: str
    appliance: str
    energy_kwh: float
    expected_kwh: float
    severity: str  # Low, Medium, High, Critical
    anomaly_type: str
    reason: str
    status: str

    class Config:
        from_attributes = True


class AnomalyDetectionResponse(BaseModel):
    total_anomalies: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    unoccupied_hour_count: int
    overnight_count: int
    spike_count: int
    anomalies_by_dept: Dict[str, int]
    items: List[AnomalyItem]


# Forecasting Schemas
class ForecastPoint(BaseModel):
    forecast_date: str
    predicted_kwh: float
    lower_bound: float
    upper_bound: float
    actual_kwh: Optional[float] = None


class ForecastResponse(BaseModel):
    horizon_days: int
    next_7_days_kwh: float
    expected_monthly_kwh: float
    estimated_future_bill: float
    potential_wastage_kwh: float
    model_name: str
    mae: float
    rmse: float
    mape: float
    confidence_level_pct: float
    points: List[ForecastPoint]
    model_limitations: str


# Recommendation Schemas
class RecommendationItem(BaseModel):
    id: int
    title: str
    category: str
    problem_statement: str
    supporting_data: str
    suggested_action: str
    est_savings_kwh: float
    est_monetary_savings: float
    est_co2_reduction: float
    priority: str
    difficulty: str
    status: str

    class Config:
        from_attributes = True


class RecommendationSummary(BaseModel):
    total_potential_kwh_savings: float
    total_monetary_savings: float
    total_co2_reduction_kg: float
    recommendation_count: int
    items: List[RecommendationItem]


# Carbon Footprint Schemas
class CarbonTrendPoint(BaseModel):
    period: str
    co2_kg: float
    target_co2_kg: float


class CarbonFootprintResponse(BaseModel):
    emission_factor_used: float
    total_co2_kg: float
    daily_avg_co2_kg: float
    monthly_co2_kg: float
    department_emissions: List[DepartmentConsumption]
    reduction_potential_co2_kg: float
    equivalent_trees_needed: int
    equivalent_cars_driven_miles: float
    trend: List[CarbonTrendPoint]


# What-If Simulator Schemas
class SimulationRequest(BaseModel):
    ac_temp_offset: float = Field(default=1.5, description="Thermostat offset in Celsius (+1 to +3°C)")
    ac_operating_hours_reduction: float = Field(default=2.0, description="Hours reduction per day")
    lighting_hours_reduction: float = Field(default=3.0, description="Lighting off-hours reduction")
    equipment_efficiency_boost_pct: float = Field(default=15.0, description="Equipment efficiency upgrade %")
    solar_offset_kwh_daily: float = Field(default=0.0, description="Daily solar generation in kWh")


class SimulationResponse(BaseModel):
    baseline_monthly_kwh: float
    simulated_monthly_kwh: float
    saved_monthly_kwh: float
    saved_kwh_percentage: float
    baseline_monthly_bill: float
    simulated_monthly_bill: float
    saved_monthly_bill: float
    baseline_monthly_co2_kg: float
    simulated_monthly_co2_kg: float
    saved_monthly_co2_kg: float
    annualized_financial_savings: float
    annualized_co2_savings_kg: float
    breakdown_by_initiative: Dict[str, Dict[str, float]]


# Chatbot Schemas
class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class ChatResponse(BaseModel):
    answer: str
    intent: Optional[str] = "sustainability_query"
    suggested_questions: List[str]
    model_used: str
    data_grounded: bool = True
