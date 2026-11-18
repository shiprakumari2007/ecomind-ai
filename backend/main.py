import os
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.database.session import init_db, SessionLocal
from app.database.models import Setting, EnergyRecord
from app.api import api_router
from app.services.dataset_service import DatasetService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle handler."""
    print("Initializing EcoMind AI Database...")
    init_db()

    # Seed initial default settings if not present
    db = SessionLocal()
    try:
        defaults = [
            ("electricity_rate", "0.15", "Electricity Tariff in $/kWh"),
            ("carbon_factor", "0.72", "Grid Carbon Emission Factor in kg CO2/kWh"),
            ("currency", "USD", "Display Currency Symbol/Code"),
        ]
        for key, val, desc in defaults:
            exists = db.query(Setting).filter(Setting.key == key).first()
            if not exists:
                db.add(Setting(key=key, value=val, description=desc))
        db.commit()

        # Check if database is empty; if so, automatically seed the 6-month sample dataset
        record_count = db.query(EnergyRecord).count()
        if record_count == 0:
            print("Database is empty. Automatically loading 6-month demonstration dataset...")
            try:
                DatasetService.load_sample_dataset_into_db(db)
                print("Demonstration dataset loaded and initialized successfully!")
            except Exception as e:
                print(f"Notice: Automatic sample dataset loading skipped: {e}")
    finally:
        db.close()

    yield
    print("EcoMind AI service shutdown.")


app = FastAPI(
    title="EcoMind AI – Smart Energy & Sustainability Agent",
    description=(
        "Production-quality AI platform for energy consumption analytics, "
        "Isolation Forest anomaly detection, time-series demand forecasting, "
        "and actionable sustainability recommendation engineering."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API router
app.include_router(api_router)


@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirects to interactive OpenAPI docs."""
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["System"])
def health_check():
    """Service health and diagnostics endpoint."""
    return {
        "status": "healthy",
        "service": "EcoMind AI",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
