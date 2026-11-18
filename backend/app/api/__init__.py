"""EcoMind AI API Routers."""
from fastapi import APIRouter
from .analytics import router as analytics_router
from .datasets import router as datasets_router
from .anomalies import router as anomalies_router
from .forecasting import router as forecasting_router
from .recommendations import router as recommendations_router
from .carbon import router as carbon_router
from .simulator import router as simulator_router
from .chatbot import router as chatbot_router
from .reports import router as reports_router
from .settings import router as settings_router

api_router = APIRouter(prefix="/api")

api_router.include_router(analytics_router, prefix="/analytics", tags=["Energy Analytics"])
api_router.include_router(datasets_router, prefix="/datasets", tags=["Dataset Operations"])
api_router.include_router(anomalies_router, prefix="/anomalies", tags=["Anomaly Detection"])
api_router.include_router(forecasting_router, prefix="/forecasting", tags=["Energy Forecasting"])
api_router.include_router(recommendations_router, prefix="/recommendations", tags=["Sustainability Recommendations"])
api_router.include_router(carbon_router, prefix="/carbon", tags=["Carbon Footprint"])
api_router.include_router(simulator_router, prefix="/simulator", tags=["What-If Simulator"])
api_router.include_router(chatbot_router, prefix="/chatbot", tags=["EcoBot AI Assistant"])
api_router.include_router(reports_router, prefix="/reports", tags=["Sustainability Reports"])
api_router.include_router(settings_router, prefix="/settings", tags=["System Settings"])
