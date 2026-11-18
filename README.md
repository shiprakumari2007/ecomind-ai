# 🌿 EcoMind AI — Smart Energy & Sustainability Agent

> **Commercial-Grade AI Platform for Energy Consumption Analytics, Anomaly Detection, Predictive Demand Forecasting, and Actionable Sustainability Recommendation Engineering.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E.svg?logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB.svg?logo=python&logoColor=white)](https://python.org)

---

## 📌 Problem Statement

> *"Build an AI agent that analyzes energy consumption data, identifies inefficiencies, predicts potential wastage, and recommends actionable sustainability improvements."*

Commercial, institutional, and industrial facilities consume massive amounts of electrical power, often suffering from 10–25% preventable energy waste due to unoptimized thermostat setpoints, off-hours lighting leaks, undetected pneumatic distribution losses, and degraded chiller coefficients of performance. 

**EcoMind AI** solves this by providing a unified, data-grounded intelligence platform that combines **unsupervised machine learning (Isolation Forest)**, **feature-engineered time-series forecasting (Gradient Boosting)**, **rule-based building science recommenders**, and **Google Gemini conversational AI** with transparent financial and Scope 2 carbon abatement calculations.

---

## 🏗️ Architecture & Technology Stack

```
EcoMind-AI/
├── backend/
│   ├── app/
│   │   ├── api/             # REST Routers (Analytics, Anomalies, Forecast, Carbon, Chatbot, Reports, Settings)
│   │   ├── database/        # SQLAlchemy Models & Engine (Users, EnergyRecords, Anomalies, Predictions, etc.)
│   │   ├── ml/              # Machine Learning Engines (Isolation Forest, Gradient Boosting Forecaster, Recommender)
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   ├── services/        # Dataset cleaning, ReportLab PDF generation, LLM Service
│   │   └── utils/           # Synthetic 6-month realistic hourly dataset generator
│   ├── datasets/            # Storage for CSV/Excel datasets
│   ├── reports/             # Generated downloadable PDF audit reports
│   ├── main.py              # FastAPI application entrypoint with CORS & auto-seed lifespan
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Glassmorphic MetricCard, Sidebar, Navbar, LoadingSpinner
│   │   ├── context/         # ThemeContext (Dark/Light), AppContext (Settings, Formatters)
│   │   ├── pages/           # 11 Dedicated full-featured navigation pages
│   │   ├── services/        # REST API client
│   │   ├── App.jsx          # Dynamic layout router
│   │   └── main.jsx
│   ├── vite.config.js       # Vite 8 with Tailwind v4 & API reverse proxy
│   └── package.json
├── test_app.py              # Automated 10-module end-to-end verification test suite
├── start_backend.py         # Backend production launcher script
├── .env.example             # Environment configuration template
└── README.md
```

### Stack Breakdown
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Recharts, Lucide React icons.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy ORM, Pydantic v2.
- **AI & Machine Learning**: 
  - `Isolation Forest` (Scikit-Learn) with domain condition explainability.
  - `Gradient Boosting Regressor` with cyclical temporal encoding, lag features (lag_1d, lag_7d), rolling statistics, and 95% confidence intervals.
  - Domain-grounded `SustainabilityRecommender` using ASHRAE and EPA benchmarks.
  - Conversational AI powered by `Google Gemini 2.5 Flash` with a deterministic, data-grounded fallback assistant.
- **PDF Generation**: `ReportLab` publication-grade executive audit reports.
- **Database**: SQLite default (designed with clean SQLAlchemy models for seamless migration to PostgreSQL or MongoDB).

---

## 🚀 Core Functional Modules

### 1. Smart Energy Dashboard (Module A)
- **Real-Time KPIs**: Total Consumption (kWh), Estimated Electricity Spend ($), Scope 2 Carbon Emissions (kg & t CO2e), Energy Wastage %, Sustainability Score (0–100), and prior-period variance.
- **Time Horizons**: Dynamic 30-day, 90-day, and 180-day aggregations.
- **Diurnal Trajectory**: AreaChart comparing actual load against a 7-day rolling baseline.
- **Department & Appliance Distribution**: Recharts interactive Donut charts and ranked equipment power rosters.
- **Peak Hour Detection**: Automatic detection of coincident peak utility tariff windows.

### 2. Energy Data Ingestion & Quality Audit (Module B)
- Supports drag-and-drop file ingestion for **CSV** and **Excel (.xlsx, .xls)** files.
- **Automated Data Cleaner**: Imputes missing columns, cleans negative energy values, strips corrupted characters, and handles timestamps.
- **Data Quality Profiler**: Computes a 0–100 quality score, reporting missing cells, deduplications, and date ranges.
- **1-Click Synthetic Seeder**: Generates/loads 17,280 realistic hourly records spanning 6 months across 4 commercial building streams.

### 3. AI Energy Anomaly Detection (Module C)
- **Isolation Forest**: Multi-variate model evaluating `[energy_consumption_kwh, hour_sin, hour_cos, is_weekend, occupancy, temperature, baseline_ratio]`.
- **Explainable AI Classifications**:
  - *Unoccupied Hours Wastage*: High draw detected while occupancy is 0.
  - *Overnight Energy Leaks*: Continuous off-peak night load exceeding baseline.
  - *Sudden Load Spikes*: Instantaneous surge > 220% of expected operating bounds.
  - *Inefficient Cooling*: High chiller power draw despite mild ambient outdoor temperature.
- **Severity Tiers**: `Critical`, `High`, `Medium`, and `Low`.
- **Workflow State Management**: Interactive status toggling (`Active`, `Investigating`, `Resolved`, `Ignored`).

### 4. Machine Learning Energy Forecasting (Module D)
- **Multi-Step Recursive Forecaster**: Predicts next 7 days (and 30-day projection) of electricity consumption, utility spend, and preventable wastage.
- **Statistical Confidence**: 95% confidence intervals (+/- 1.96 * residual standard deviation) displayed as a shaded envelope.
- **Error Scorecard**: Live validation Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Mean Percentage Error (MAPE).
- **Explainable Limitations**: Transparent reporting of weather and occupancy assumptions.

### 5. AI Sustainability Recommendation Engine (Module E)
- Generates prioritized, high-ROI sustainability initiatives based on active telemetry.
- Each initiative card features:
  - **Identified Problem**: Exact empirical kWh wasted.
  - **Supporting Data**: Statistical observation benchmarks.
  - **Suggested Action**: Practical engineering steps.
  - **Quantified Savings**: Annual kWh saved, monetary cost payback ($/year), and carbon reduction (kg CO2e/year).
  - **Implementation Difficulty**: Easy, Moderate, or Complex.
  - **Lifecycle Tracking**: Pending, In Progress, Implemented.

### 6. AI Sustainability Chatbot — EcoBot (Module F)
- Conversational assistant grounded in live database telemetry and model outputs.
- Directly answers questions such as:
  - *"Why was my electricity consumption high yesterday?"*
  - *"Which department wastes the most energy?"*
  - *"How can I reduce my electricity bill?"*
  - *"What is my predicted consumption next month?"*
  - *"Which appliance should I optimize first?"*
  - *"How can I reduce my carbon footprint?"*
- **Dual Engine Architecture**: Google Gemini API integration through `GEMINI_API_KEY` with an intelligent, deterministic fallback assistant.

### 7. Scope 2 Carbon Footprint Analyzer (Module G)
- Computes greenhouse gas emissions based on configurable regional electricity grid factors (default: 0.72 kg CO2 / kWh).
- Monthly emissions trend compared against a progressive **15% decarbonization glidepath target**.
- **EPA Equivalency Conversions**:
  - Mature urban trees required for annual carbon sequestration.
  - Passenger vehicle miles avoided.

### 8. What-If Energy Simulator (Module H)
- Live interactive levers:
  - AC Thermostat Setpoint Rise (+0°C to +3°C)
  - AC Operating Hours Curtailment (0 to 6 hrs/day)
  - Lighting Off-Hours Setback (0 to 8 hrs/day)
  - Equipment Efficiency Upgrades (0% to 30%)
  - Rooftop Solar PV Generation (0 to 300 kWh/day)
- Dynamically recalculates baseline vs simulated monthly kWh, bill savings, carbon reduction, and annualized financial ROI.

### 9. Executive PDF Sustainability Reports (Module I)
- Single-click compilation of branded, publication-grade executive audit documents.
- Includes Executive Summary Scorecard, Departmental Allocation, Anomaly Incident Catalog, 30-Day Predictive Demand, and Phased Decarbonization Roadmap.
- Immediate browser download via streaming binary endpoint.

### 10. Global System Settings (Module J)
- Adjust global electricity tariff ($/kWh) and regional carbon emission factor (kg CO2/kWh).
- Currency localization (USD, EUR, GBP, INR, CAD, AUD).
- Gemini API key configuration and testing.
- Database reset and sample data re-seeding controls.

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Python**: Version 3.10 or newer (tested on Python 3.13)
- **Node.js**: Version 18 or newer (tested on Node v24)
- **Git**

---

### Step 1: Clone Repository & Configure Environment

```bash
git clone https://github.com/your-username/ecomind-ai.git
cd ecomind-ai

# Copy environment variables
cp .env.example .env
```

---

### Step 2: Backend Setup

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run automated verification test suite
python test_app.py

# Launch FastAPI backend server
python start_backend.py
```

*The FastAPI backend will run on `http://127.0.0.1:8000`.*
*Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.*

---

### Step 3: Frontend Setup

Open a new terminal window:

```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite React development server
npm run dev
```

*The Vite frontend will run on `http://localhost:5173`.*

---

## 🧪 Automated Verification Suite

EcoMind AI includes a comprehensive end-to-end verification script testing all 10 core modules:

```bash
python test_app.py
```

**Expected Output:**
```
======================================================================
🌿 EcoMind AI — End-to-End System Verification Test Suite
======================================================================

[1/10] Initializing Database & Seeding 6-Month Dataset...
  ✓ Ingested 17,280 hourly telemetry records.

[2/10] Testing Energy Analytics Overview (Module A)...
  ✓ Total Consumption: 753,464.0 kWh
  ✓ Estimated Spend: $113,019.60
  ✓ Carbon Footprint: 542,494.1 kg CO2e
  ✓ Efficiency Score: 79.1/100

[3/10] Testing AI Anomaly Detection with Isolation Forest (Module C)...
  ✓ Model Run: Isolation Forest identified 519 abnormal consumption records.
  ✓ Flagged Anomalies: 519 (Critical: 20, High: 27)

[4/10] Testing Machine Learning Forecasting Engine (Module D)...
  ✓ Model: GradientBoosting-TimeSeries
  ✓ Next 7-Day Forecast: 26,876.2 kWh
  ✓ Validation MAE: 89.74 kWh | RMSE: 101.03 kWh

[5/10] Testing Sustainability Recommendation Engine (Module E)...
  ✓ Generated 6 Actionable Initiatives.
  ✓ Total Potential kWh Saved: 705,165.0 kWh/yr

[6/10] Testing Scope 2 Carbon Footprint Analyzer (Module G)...
  ✓ Total CO2: 542,494.1 kg (542.49 metric tons)
  ✓ Mature Trees Needed: 24,919 trees

[7/10] Testing What-If Energy Simulator (Module H)...
  ✓ Simulated Monthly Load: 103,873.0 kWh
  ✓ Monthly Savings: 22,405.9 kWh (17.7%)

[8/10] Testing EcoBot AI Sustainability Assistant (Module F)...
  ✓ Model: EcoMind Grounded Intelligence Engine (Fallback)

[9/10] Testing Professional PDF Report Generation (Module I)...
  ✓ Generated PDF: EcoMind_Sustainability_Report_20261118_145150.pdf (6.4 KB)

[10/10] Testing System Configuration & Settings...
  ✓ Tariff: $0.15/kWh | Carbon Factor: 0.72 kg/kWh

======================================================================
🎉 ALL 10 VERIFICATION MODULES PASSED WITH 100% SUCCESS!
======================================================================
```

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Healthcheck and service diagnostic status |
| `GET` | `/api/analytics/overview` | Dashboard metrics, daily trends, department distributions |
| `POST` | `/api/datasets/upload` | Upload and validate CSV / Excel dataset |
| `POST` | `/api/datasets/load-sample` | 1-click load of 6-month synthetic dataset |
| `GET` | `/api/datasets/preview` | Preview loaded rows and data quality score |
| `GET` | `/api/anomalies/detect` | Retrieve Isolation Forest flagged anomalies with explainability |
| `POST` | `/api/anomalies/run` | Execute fresh Isolation Forest model training |
| `PATCH` | `/api/anomalies/{id}/status` | Update anomaly investigation status |
| `GET` | `/api/forecasting/predict` | 7-day forecast, monthly projection, MAE & RMSE metrics |
| `GET` | `/api/recommendations` | Prioritized sustainability initiatives with quantified savings |
| `PATCH` | `/api/recommendations/{id}/status` | Update initiative implementation status |
| `GET` | `/api/carbon/summary` | Scope 2 greenhouse gas emissions and tree equivalencies |
| `POST` | `/api/simulator/simulate` | Interactive What-If simulation engine |
| `POST` | `/api/chatbot/message` | EcoBot AI assistant interaction |
| `GET` | `/api/chatbot/history` | Retrieve conversation history |
| `POST` | `/api/reports/generate` | Compile executive audit report in PDF format |
| `GET` | `/api/reports/download/{filename}` | Stream binary PDF download |
| `GET` | `/api/settings` | Get tariff, carbon factor, and Gemini status |
| `POST` | `/api/settings` | Update system parameters |
| `POST` | `/api/settings/reset` | Clear all database tables |

---

## 📊 Synthetic Demonstration Dataset

EcoMind AI comes bundled with a synthetic dataset generator (`backend/app/utils/seed_data.py`) creating **17,280 hourly records across 180 days (6 months)** with:
- **Diurnal load cycles**: Peak afternoon consumption, night setbacks.
- **Seasonal thermal sensitivity**: Higher chiller loading during warm periods.
- **Workday/Weekend occupancy schedules**.
- **Four monitored facility streams**:
  1. *Main Innovation Center — HVAC & Facilities (Central Chiller 1)*
  2. *Main Innovation Center — Executive Offices (High-Bay LED & Workstations)*
  3. *Tech Research Lab — Data Center & IT (Precision Server Cooling & Racks)*
  4. *Operations & Logistics — Precision Manufacturing (Industrial Compressor & Motors)*
- **Injected realistic anomalies**:
  - Weekend chiller runtime during zero occupancy.
  - Sudden compressor motor valve surges.
  - Off-hours lighting left powered on overnight during holidays.
  - High chiller draw during mild ambient weather.

---

## 🛡️ License

This project is licensed under the MIT License — feel free to use and adapt for academic, innovation, and commercial initiatives.
