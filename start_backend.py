"""
Launcher script for EcoMind AI FastAPI Backend Server.
Runs on http://127.0.0.1:8000
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    print(f"🌿 Starting EcoMind AI Backend Server on http://{host}:{port}")
    print(f"📖 Interactive API Documentation available at http://{host}:{port}/docs")
    uvicorn.run("main:app", host=host, port=port, reload=True, app_dir=str(backend_dir))
