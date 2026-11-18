from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    Boolean,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from .session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(30), default="sustainability_officer")
    created_at = Column(DateTime, default=datetime.utcnow)


class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    location = Column(String(150), default="Main Campus")
    square_feet = Column(Float, default=25000.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    building_name = Column(String(100), nullable=False)


class Appliance(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    category = Column(String(50), default="HVAC")  # HVAC, Lighting, IT Equipment, Machinery, Refrigeration
    rated_power_kw = Column(Float, default=5.0)
    department = Column(String(100), default="General")
    building = Column(String(100), default="Main Building")


class EnergyRecord(Base):
    __tablename__ = "energy_records"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    building = Column(String(100), index=True, nullable=False)
    department = Column(String(100), index=True, nullable=False)
    appliance = Column(String(100), index=True, nullable=False)
    energy_consumption_kwh = Column(Float, nullable=False)
    temperature = Column(Float, nullable=True, default=22.0)  # Celsius
    occupancy = Column(Integer, nullable=True, default=0)
    electricity_rate = Column(Float, nullable=True, default=0.15)  # $ / kWh
    
    # Anomaly fields
    is_anomaly = Column(Boolean, default=False, index=True)
    anomaly_score = Column(Float, nullable=True)
    anomaly_severity = Column(String(20), nullable=True)  # Low, Medium, High, Critical
    anomaly_reason = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_records_time_bldg", "timestamp", "building"),
        Index("idx_records_dept", "department"),
    )


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("energy_records.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    building = Column(String(100), index=True, nullable=False)
    department = Column(String(100), index=True, nullable=False)
    appliance = Column(String(100), index=True, nullable=False)
    energy_kwh = Column(Float, nullable=False)
    expected_kwh = Column(Float, nullable=False)
    severity = Column(String(20), default="Medium")  # Low, Medium, High, Critical
    anomaly_type = Column(String(50), default="Unusual Consumption")  # Spike, Unoccupied, Overnight, Inefficient Equipment
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="Active")  # Active, Investigating, Resolved, Ignored
    detected_at = Column(DateTime, default=datetime.utcnow)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    forecast_date = Column(DateTime, index=True, nullable=False)
    horizon_days = Column(Integer, default=7)
    predicted_kwh = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    actual_kwh = Column(Float, nullable=True)
    model_name = Column(String(50), default="RandomForest-TimeSeries")
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), default="HVAC Optimization")
    problem_statement = Column(Text, nullable=False)
    supporting_data = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=False)
    est_savings_kwh = Column(Float, default=0.0)
    est_monetary_savings = Column(Float, default=0.0)
    est_co2_reduction = Column(Float, default=0.0)
    priority = Column(String(20), default="Medium")  # Critical, High, Medium, Low
    difficulty = Column(String(20), default="Moderate")  # Easy, Moderate, Complex
    status = Column(String(20), default="Pending")  # Pending, In Progress, Implemented, Dismissed
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), index=True, default="default")
    role = Column(String(20), nullable=False)  # user, assistant, system
    message = Column(Text, nullable=False)
    intent = Column(String(50), nullable=True)
    suggested_questions = Column(Text, nullable=True)  # JSON serialized list
    created_at = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size_kb = Column(Float, default=0.0)
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    summary_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
