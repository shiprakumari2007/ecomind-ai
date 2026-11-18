from typing import Dict, Any, List
import pandas as pd
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import Recommendation, EnergyRecord, Setting
from ..ml.recommender import SustainabilityRecommender
from ..schemas.schemas import RecommendationSummary, RecommendationItem

router = APIRouter()


@router.get("", response_model=RecommendationSummary)
def get_recommendations(
    category: str = Query(default="all"),
    priority: str = Query(default="all"),
    db: Session = Depends(get_db),
):
    """
    Returns AI-generated actionable recommendations with
    supporting empirical evidence and transparent savings calculations.
    """
    recs = db.query(Recommendation).all()

    # If database has no recommendations yet, generate dynamically
    if not recs:
        records = db.query(
            EnergyRecord.timestamp,
            EnergyRecord.department,
            EnergyRecord.appliance,
            EnergyRecord.energy_consumption_kwh,
            EnergyRecord.occupancy,
            EnergyRecord.temperature,
        ).all()

        if records:
            rate_setting = db.query(Setting).filter(Setting.key == "electricity_rate").first()
            rate = float(rate_setting.value) if rate_setting else 0.15

            carbon_setting = db.query(Setting).filter(Setting.key == "carbon_factor").first()
            carbon = float(carbon_setting.value) if carbon_setting else 0.72

            df = pd.DataFrame(records, columns=[
                "timestamp", "department", "appliance", "energy_consumption_kwh", "occupancy", "temperature"
            ])
            recommender = SustainabilityRecommender(electricity_rate=rate, carbon_factor=carbon)
            generated = recommender.generate_recommendations(df)

            for g in generated:
                new_rec = Recommendation(
                    title=g["title"],
                    category=g["category"],
                    problem_statement=g["problem_statement"],
                    supporting_data=g["supporting_data"],
                    suggested_action=g["suggested_action"],
                    est_savings_kwh=g["est_savings_kwh"],
                    est_monetary_savings=g["est_monetary_savings"],
                    est_co2_reduction=g["est_co2_reduction"],
                    priority=g["priority"],
                    difficulty=g["difficulty"],
                    status=g["status"],
                )
                db.add(new_rec)
            db.commit()
            recs = db.query(Recommendation).all()

    # Filtering
    filtered = recs
    if isinstance(category, str) and category != "all":
        filtered = [r for r in filtered if r.category.lower() == category.lower()]
    if isinstance(priority, str) and priority != "all":
        filtered = [r for r in filtered if r.priority.lower() == priority.lower()]

    total_kwh_saved = sum(r.est_savings_kwh for r in recs)
    total_money_saved = sum(r.est_monetary_savings for r in recs)
    total_co2_saved = sum(r.est_co2_reduction for r in recs)

    items = [
        RecommendationItem(
            id=r.id,
            title=r.title,
            category=r.category,
            problem_statement=r.problem_statement,
            supporting_data=r.supporting_data,
            suggested_action=r.suggested_action,
            est_savings_kwh=round(r.est_savings_kwh, 1),
            est_monetary_savings=round(r.est_monetary_savings, 2),
            est_co2_reduction=round(r.est_co2_reduction, 1),
            priority=r.priority,
            difficulty=r.difficulty,
            status=r.status,
        )
        for r in filtered
    ]

    return RecommendationSummary(
        total_potential_kwh_savings=round(total_kwh_saved, 1),
        total_monetary_savings=round(total_money_saved, 2),
        total_co2_reduction_kg=round(total_co2_saved, 1),
        recommendation_count=len(items),
        items=items,
    )


@router.patch("/{rec_id}/status")
def update_recommendation_status(
    rec_id: int,
    status: str = Query(..., pattern="^(Pending|In Progress|Implemented|Dismissed)$"),
    db: Session = Depends(get_db),
):
    """Updates implementation status of a recommendation."""
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = status
    db.commit()
    return {"id": rec_id, "status": status, "message": f"Recommendation updated to '{status}'."}
