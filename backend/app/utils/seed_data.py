import os
import random
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
import numpy as np


def generate_synthetic_dataset(
    output_path: str = None,
    days: int = 180,
    end_date: datetime = None,
    seed: int = 42
) -> pd.DataFrame:
    """
    Generates a realistic 6-month synthetic hourly energy consumption dataset
    with seasonal temperature variations, workday/weekend occupancy cycles,
    diurnal load patterns, and injected realistic anomalies.
    """
    random.seed(seed)
    np.random.seed(seed)

    if end_date is None:
        end_date = datetime(2026, 11, 15, 23, 0, 0)
    start_date = end_date - timedelta(days=days)

    # 4 distinct streams across buildings and departments
    streams = [
        {
            "building": "Main Innovation Center",
            "department": "HVAC & Facilities",
            "appliance": "Central Chiller 1",
            "base_kw": 45.0,
            "temp_sensitivity": 2.2,  # Strong correlation with temperature
            "occupancy_sensitivity": 0.4,
            "category": "HVAC",
        },
        {
            "building": "Main Innovation Center",
            "department": "Executive Offices",
            "appliance": "High-Bay LED & Workstations",
            "base_kw": 18.0,
            "temp_sensitivity": 0.1,
            "occupancy_sensitivity": 1.6,  # Strong correlation with occupancy
            "category": "Lighting & Office",
        },
        {
            "building": "Tech Research Lab",
            "department": "Data Center & IT",
            "appliance": "Precision Server Cooling & Racks",
            "base_kw": 55.0,
            "temp_sensitivity": 0.6,
            "occupancy_sensitivity": 0.05,  # High baseload 24/7
            "category": "IT Equipment",
        },
        {
            "building": "Operations & Logistics Facility",
            "department": "Precision Manufacturing",
            "appliance": "Industrial Air Compressor & Motors",
            "base_kw": 32.0,
            "temp_sensitivity": 0.3,
            "occupancy_sensitivity": 1.2,
            "category": "Machinery",
        },
    ]

    records = []
    current_time = start_date

    # Pre-determine specific anomaly dates for realism and explainability
    anomaly_events = [
        # 1. Overnight HVAC leak on weekends (AC running full blast with 0 occupancy)
        {"day_offset": 22, "hour_range": (1, 5), "stream_idx": 0, "type": "overnight_unoccupied_ac", "factor": 2.8},
        {"day_offset": 54, "hour_range": (0, 6), "stream_idx": 0, "type": "overnight_unoccupied_ac", "factor": 3.1},
        {"day_offset": 112, "hour_range": (2, 5), "stream_idx": 0, "type": "overnight_unoccupied_ac", "factor": 2.9},
        # 2. Severe compressor spike / valve stuck
        {"day_offset": 37, "hour_range": (14, 16), "stream_idx": 3, "type": "severe_spike", "factor": 3.4},
        {"day_offset": 88, "hour_range": (10, 12), "stream_idx": 3, "type": "severe_spike", "factor": 3.2},
        {"day_offset": 145, "hour_range": (15, 17), "stream_idx": 3, "type": "severe_spike", "factor": 3.6},
        # 3. Off-hours office lighting & computers left on overnight during holiday
        {"day_offset": 65, "hour_range": (20, 23), "stream_idx": 1, "type": "unoccupied_lighting", "factor": 2.6},
        {"day_offset": 130, "hour_range": (1, 6), "stream_idx": 1, "type": "unoccupied_lighting", "factor": 2.5},
        # 4. Data center cooling efficiency degradation (chiller COP drop during summer)
        {"day_offset": 95, "hour_range": (12, 17), "stream_idx": 2, "type": "cooling_degradation", "factor": 1.9},
        {"day_offset": 160, "hour_range": (13, 18), "stream_idx": 2, "type": "cooling_degradation", "factor": 2.1},
    ]

    total_hours = days * 24

    for h in range(total_hours):
        dt = start_date + timedelta(hours=h)
        day_of_year = dt.timetuple().tm_yday
        hour = dt.hour
        is_weekend = dt.weekday() >= 5

        # Realistic outdoor temperature curve:
        # Seasonal cycle (sinusoidal) + diurnal cycle (peaks at 14:00, coolest at 04:00) + random noise
        seasonal_temp = 20.0 + 9.0 * np.sin(2 * np.pi * (day_of_year - 80) / 365.0)
        diurnal_temp = 5.0 * np.sin(2 * np.pi * (hour - 9) / 24.0)
        temp_noise = np.random.normal(0, 0.8)
        temperature = round(float(seasonal_temp + diurnal_temp + temp_noise), 1)

        # Occupancy model
        for stream_idx, stream in enumerate(streams):
            if is_weekend:
                if stream["department"] == "Data Center & IT":
                    occupancy = random.randint(1, 3)
                elif stream["department"] == "Precision Manufacturing":
                    occupancy = random.randint(0, 5) if 8 <= hour <= 16 else 0
                else:
                    occupancy = 0
            else:
                if 8 <= hour <= 18:
                    if stream["department"] == "Executive Offices":
                        occupancy = random.randint(35, 75)
                    elif stream["department"] == "Precision Manufacturing":
                        occupancy = random.randint(20, 45)
                    elif stream["department"] == "HVAC & Facilities":
                        occupancy = random.randint(4, 10)
                    else:
                        occupancy = random.randint(5, 12)
                elif 7 <= hour < 8 or 18 < hour <= 20:
                    occupancy = random.randint(2, 15)
                else:
                    occupancy = 0 if stream["department"] != "Data Center & IT" else random.randint(1, 3)

            # Baseline calculation
            base_kw = stream["base_kw"]
            temp_effect = max(0.0, (temperature - 20.0) * stream["temp_sensitivity"])
            occ_effect = (occupancy / 50.0) * (base_kw * 0.4) * stream["occupancy_sensitivity"]
            noise = np.random.normal(0, base_kw * 0.04)

            consumption = base_kw + temp_effect + occ_effect + noise

            # Check for injected anomalies
            day_offset = (dt.date() - start_date.date()).days
            is_anomaly_injected = False
            for anom in anomaly_events:
                if (
                    anom["day_offset"] == day_offset
                    and anom["hour_range"][0] <= hour <= anom["hour_range"][1]
                    and anom["stream_idx"] == stream_idx
                ):
                    consumption *= anom["factor"]
                    is_anomaly_injected = True
                    break

            # Natural rare random spike (1 in 800)
            if not is_anomaly_injected and random.random() < 0.0012:
                consumption *= random.uniform(2.2, 2.8)

            consumption = max(0.5, round(float(consumption), 2))
            electricity_rate = 0.15  # Default standard tariff ($/kWh)

            records.append({
                "timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
                "building": stream["building"],
                "department": stream["department"],
                "appliance": stream["appliance"],
                "energy_consumption_kwh": consumption,
                "temperature": temperature,
                "occupancy": occupancy,
                "electricity_rate": electricity_rate,
            })

    df = pd.DataFrame(records)

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_csv(output_path, index=False)
        print(f"Synthetic dataset saved to {output_path} ({len(df)} records)")

    return df


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent.parent
    sample_csv_path = base_dir / "datasets" / "sample_energy_data.csv"
    generate_synthetic_dataset(str(sample_csv_path), days=180)
