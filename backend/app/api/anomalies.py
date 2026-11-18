from typing import Dict, Any, List, Optional
import pandas as pd
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.session import get_db
from ..database.models import EnergyRecord, Anomaly
from ..ml.anomaly_detector import EnergyAnomalyDetector
from ..schemas.schemas import AnomalyDetectionResponse, AnomalyItem

router = APIRouter()


@router.get("/detect", response_model=AnomalyDetectionResponse)
def get_anomalies(
    severity: Optional[str] = Query(default=None),
    department: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    Returns detected energy anomalies with severity breakdown,
    explainable flags, and department distributions.
    """
    query = db.query(Anomaly)

    if isinstance(severity, str) and severity.lower() != "all":
        query = query.filter(Anomaly.severity == severity.capitalize())
    if isinstance(department, str) and department.lower() != "all":
        query = query.filter(Anomaly.department == department)
    if isinstance(status_filter, str) and status_filter.lower() != "all":
        query = query.filter(Anomaly.status == status_filter)

    total_count = db.query(func.count(Anomaly.id)).scalar() or 0
    critical_count = db.query(func.count(Anomaly.id)).filter(Anomaly.severity == "Critical").scalar() or 0
    high_count = db.query(func.count(Anomaly.id)).filter(Anomaly.severity == "High").scalar() or 0
    medium_count = db.query(func.count(Anomaly.id)).filter(Anomaly.severity == "Medium").scalar() or 0
    low_count = db.query(func.count(Anomaly.id)).filter(Anomaly.severity == "Low").scalar() or 0

    unoccupied_count = db.query(func.count(Anomaly.id)).filter(Anomaly.anomaly_type.contains("Unoccupied")).scalar() or 0
    overnight_count = db.query(func.count(Anomaly.id)).filter(Anomaly.anomaly_type.contains("Overnight")).scalar() or 0
    spike_count = db.query(func.count(Anomaly.id)).filter(Anomaly.anomaly_type.contains("Spike")).scalar() or 0

    # Department breakdown
    dept_counts = (
        db.query(Anomaly.department, func.count(Anomaly.id))
        .group_by(Anomaly.department)
        .all()
    )
    dept_map = {d: count for d, count in dept_counts}

    limit_val = limit if isinstance(limit, int) else 200
    anomalies = query.order_by(Anomaly.timestamp.desc()).limit(limit_val).all()

    items = [
        AnomalyItem(
            id=a.id,
            record_id=a.record_id,
            timestamp=a.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            building=a.building,
            department=a.department,
            appliance=a.appliance,
            energy_kwh=round(a.energy_kwh, 2),
            expected_kwh=round(a.expected_kwh, 2),
            severity=a.severity,
            anomaly_type=a.anomaly_type,
            reason=a.reason,
            status=a.status,
        )
        for a in anomalies
    ]

    return AnomalyDetectionResponse(
        total_anomalies=total_count,
        critical_count=critical_count,
        high_count=high_count,
        medium_count=medium_count,
        low_count=low_count,
        unoccupied_hour_count=unoccupied_count,
        overnight_count=overnight_count,
        spike_count=spike_count,
        anomalies_by_dept=dept_map,
        items=items,
    )


@router.post("/run", response_model=Dict[str, Any])
def run_anomaly_detection(contamination: float = 0.03, db: Session = Depends(get_db)):
    """
    Executes Isolation Forest algorithm over all stored energy records,
    classifies anomalies by severity, and updates the database.
    """
    records = db.query(EnergyRecord).all()
    if not records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No energy records found in database to analyze.",
        )

    df = pd.DataFrame([{
        "id": r.id,
        "timestamp": r.timestamp,
        "building": r.building,
        "department": r.department,
        "appliance": r.appliance,
        "energy_consumption_kwh": r.energy_consumption_kwh,
        "temperature": r.temperature,
        "occupancy": r.occupancy,
        "electricity_rate": r.electricity_rate,
    } for r in records])

    detector = EnergyAnomalyDetector(contamination=contamination)
    df_results = detector.fit_predict(df)

    # Clear existing anomaly table
    db.query(Anomaly).delete()

    anomalous_records = df_results[df_results["is_anomaly"]]
    anomalies_to_add = []

    # Map back to EnergyRecord entities
    record_map = {r.id: r for r in records}
    for _, row in anomalous_records.iterrows():
        rec_id = int(row["id"])
        rec = record_map.get(rec_id)
        if rec:
            rec.is_anomaly = True
            rec.anomaly_score = float(row["anomaly_score"])
            rec.anomaly_severity = str(row["anomaly_severity"])
            rec.anomaly_reason = str(row["anomaly_reason"])

        anomalies_to_add.append(
            Anomaly(
                record_id=rec_id,
                timestamp=pd.to_datetime(row["timestamp"]),
                building=str(row["building"]),
                department=str(row["department"]),
                appliance=str(row["appliance"]),
                energy_kwh=float(row["energy_consumption_kwh"]),
                expected_kwh=float(row["expected_kwh"]),
                severity=str(row["anomaly_severity"]),
                anomaly_type=str(row["anomaly_type"]),
                reason=str(row["anomaly_reason"]),
                status="Active",
            )
        )

    db.bulk_save_objects(anomalies_to_add)
    db.commit()

    return {
        "success": True,
        "total_records_analyzed": len(df),
        "anomalies_detected": len(anomalies_to_add),
        "contamination_rate": contamination,
        "message": f"Isolation Forest identified {len(anomalies_to_add)} abnormal consumption records.",
    }


@router.patch("/{anomaly_id}/status")
def update_anomaly_status(
    anomaly_id: int,
    status: str = Query(..., pattern="^(Active|Investigating|Resolved|Ignored)$"),
    db: Session = Depends(get_db),
):
    """Updates the workflow status of an identified anomaly."""
    anomaly = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly record not found")

    anomaly.status = status
    db.commit()
    return {"id": anomaly_id, "status": status, "message": f"Anomaly marked as {status}."}
