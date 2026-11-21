import io
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple, List
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from ..database.models import EnergyRecord, Building, Department, Appliance, Setting


class DatasetService:
    """
    Handles CSV and Excel parsing, data validation, missing value imputation,
    data quality profiling, and database ingestion.
    """

    REQUIRED_COLUMNS = ["timestamp", "energy_consumption_kwh"]
    STANDARD_COLUMNS = [
        "timestamp",
        "building",
        "department",
        "appliance",
        "energy_consumption_kwh",
        "temperature",
        "occupancy",
        "electricity_rate",
    ]

    @classmethod
    def load_file_to_dataframe(cls, contents: bytes, filename: str) -> pd.DataFrame:
        """Loads uploaded file contents into a pandas DataFrame."""
        ext = filename.lower().split(".")[-1]
        try:
            if ext in ["csv", "txt"]:
                # Try UTF-8 then Latin-1
                try:
                    df = pd.read_csv(io.BytesIO(contents))
                except UnicodeDecodeError:
                    df = pd.read_csv(io.BytesIO(contents), encoding="latin1")
            elif ext in ["xlsx", "xls"]:
                df = pd.read_excel(io.BytesIO(contents))
            else:
                raise ValueError(f"Unsupported file extension '.{ext}'. Supported formats: CSV, Excel (.xlsx, .xls).")
        except Exception as e:
            raise ValueError(f"Could not parse file: {str(e)}")

        # Normalize column names (lowercase, stripped, replace spaces with underscores)
        df.columns = [str(c).strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]
        return df

    @classmethod
    def validate_and_profile_data(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Validates columns, checks data quality, handles missing values,
        and generates a detailed quality report.
        """
        total_rows = len(df)
        if total_rows == 0:
            raise ValueError("The uploaded dataset is empty.")

        # Check required columns with fuzzy match
        col_map = {}
        for col in df.columns:
            if "time" in col or "date" in col:
                col_map[col] = "timestamp"
            elif "energy" in col or "kwh" in col or "consumption" in col:
                col_map[col] = "energy_consumption_kwh"
            elif "build" in col:
                col_map[col] = "building"
            elif "dept" in col or "department" in col:
                col_map[col] = "department"
            elif "appliance" in col or "equipment" in col or "device" in col:
                col_map[col] = "appliance"
            elif "temp" in col:
                col_map[col] = "temperature"
            elif "occ" in col:
                col_map[col] = "occupancy"
            elif "rate" in col or "tariff" in col or "price" in col:
                col_map[col] = "electricity_rate"

        df = df.rename(columns=col_map)
        # Handle duplicate column names
        if df.columns.duplicated().any():
            df = df.T.groupby(level=0, sort=False).first().T
        if "timestamp" not in df.columns:
            raise ValueError("Missing required column: 'timestamp' (or 'date') could not be identified.")
        if "energy_consumption_kwh" not in df.columns:
            raise ValueError("Missing required column: 'energy_consumption_kwh' (or 'kwh', 'consumption') could not be identified.")

        # Assign defaults for optional columns if not present
        if "building" not in df.columns:
            df["building"] = "Main Facility"
        if "department" not in df.columns:
            df["department"] = "General Operations"
        if "appliance" not in df.columns:
            df["appliance"] = "General Load"
        if "temperature" not in df.columns:
            df["temperature"] = 22.0
        if "occupancy" not in df.columns:
            df["occupancy"] = 0
        if "electricity_rate" not in df.columns:
            df["electricity_rate"] = 0.15

        # Count missing values before cleaning
        missing_by_col = {col: int(df[col].isna().sum()) for col in df.columns}
        total_missing = sum(missing_by_col.values())
        duplicates_count = int(df.duplicated(subset=["timestamp", "building", "department", "appliance"]).sum())

        # Clean timestamp
        try:
            df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        except Exception:
            pass

        invalid_timestamps = df["timestamp"].isna().sum()
        df = df.dropna(subset=["timestamp"])

        # Clean energy_consumption_kwh
        df["energy_consumption_kwh"] = pd.to_numeric(df["energy_consumption_kwh"], errors="coerce")
        negative_fixed = int((df["energy_consumption_kwh"] < 0).sum())
        df["energy_consumption_kwh"] = df["energy_consumption_kwh"].abs()
        df["energy_consumption_kwh"] = df["energy_consumption_kwh"].fillna(0.0)

        # Impute optional fields
        df["temperature"] = pd.to_numeric(df["temperature"], errors="coerce").fillna(22.0)
        df["occupancy"] = pd.to_numeric(df["occupancy"], errors="coerce").fillna(0).astype(int)
        df["electricity_rate"] = pd.to_numeric(df["electricity_rate"], errors="coerce").fillna(0.15)
        df["building"] = df["building"].fillna("Main Facility").astype(str)
        df["department"] = df["department"].fillna("General Operations").astype(str)
        df["appliance"] = df["appliance"].fillna("General Load").astype(str)

        # Deduplicate
        df = df.drop_duplicates(subset=["timestamp", "building", "department", "appliance"])
        valid_rows = len(df)

        # Calculate Quality Score
        penalty = 0.0
        if total_rows > 0:
            penalty += (total_missing / (total_rows * len(df.columns))) * 40.0
            penalty += (duplicates_count / total_rows) * 30.0
            penalty += (invalid_timestamps / total_rows) * 30.0
        quality_score = max(5.0, round(100.0 - penalty, 1))

        # Format date range
        start_date_str = df["timestamp"].min().strftime("%Y-%m-%d %H:%M:%S") if not df.empty else None
        end_date_str = df["timestamp"].max().strftime("%Y-%m-%d %H:%M:%S") if not df.empty else None

        quality_report = {
            "total_rows": total_rows,
            "valid_rows": valid_rows,
            "missing_values_count": int(total_missing),
            "missing_by_column": missing_by_col,
            "duplicate_rows": duplicates_count,
            "date_range_start": start_date_str,
            "date_range_end": end_date_str,
            "buildings_detected": sorted(list(df["building"].unique())),
            "departments_detected": sorted(list(df["department"].unique())),
            "appliances_detected": sorted(list(df["appliance"].unique())),
            "negative_energy_values_fixed": negative_fixed,
            "quality_score": quality_score,
        }

        return df, quality_report

    @classmethod
    def ingest_dataframe_to_db(cls, df: pd.DataFrame, db: Session, replace_existing: bool = True) -> int:
        """Stores the processed DataFrame into the database."""
        if replace_existing:
            db.query(EnergyRecord).delete()
            db.commit()

        # Update metadata entities
        existing_buildings = {b.name for b in db.query(Building).all()}
        for b_name in df["building"].unique():
            if b_name not in existing_buildings:
                db.add(Building(name=b_name))
                existing_buildings.add(b_name)

        existing_depts = {d.name for d in db.query(Department).all()}
        for d_name in df["department"].unique():
            if d_name not in existing_depts:
                # Pair with first matching building
                matching_bldg = df[df["department"] == d_name]["building"].iloc[0]
                db.add(Department(name=d_name, building_name=matching_bldg))
                existing_depts.add(d_name)

        existing_appliances = {a.name for a in db.query(Appliance).all()}
        for a_name in df["appliance"].unique():
            if a_name not in existing_appliances:
                match = df[df["appliance"] == a_name].iloc[0]
                db.add(Appliance(
                    name=a_name,
                    category="Equipment",
                    department=match["department"],
                    building=match["building"],
                ))
                existing_appliances.add(a_name)

        db.commit()

        # Batch insert energy records
        records_to_create = []
for _, row in df.iterrows():
    occupancy_value = row["occupancy"]

    if isinstance(occupancy_value, pd.Series):
        occupancy_value = occupancy_value.iloc[0]

    occupancy_value = pd.to_numeric(occupancy_value, errors="coerce")
    occupancy_value = 0 if pd.isna(occupancy_value) else occupancy_value

    ts = row["timestamp"]
    if isinstance(ts, str):
        ts = datetime.fromisoformat(ts)
    elif hasattr(ts, "to_pydatetime"):
        ts = ts.to_pydatetime()

    records_to_create.append(
        EnergyRecord(
            timestamp=ts,
            building=str(row["building"]),
            department=str(row["department"]),
            appliance=str(row["appliance"]),
            energy_consumption_kwh=float(row["energy_consumption_kwh"]),
            temperature=float(row["temperature"]),
            occupancy=int(occupancy_value),
            electricity_rate=float(row["electricity_rate"]),
                )
            )

        # Insert in chunks of 2,000 for efficiency
    chunk_size = 2000
    for i in range(0, len(records_to_create), chunk_size):
        db.bulk_save_objects(records_to_create[i : i + chunk_size])
        db.commit()
return len(records_to_create)

    @classmethod
    def load_sample_dataset_into_db(cls, db: Session) -> Dict[str, Any]:
        """Loads or generates the 6-month synthetic dataset into database."""
        base_dir = Path(__file__).resolve().parent.parent.parent
        csv_path = base_dir / "datasets" / "sample_energy_data.csv"

        if not csv_path.exists():
            from ..utils.seed_data import generate_synthetic_dataset
            df = generate_synthetic_dataset(output_path=str(csv_path), days=180)
        else:
            df = pd.read_csv(str(csv_path))

        df, quality_report = cls.validate_and_profile_data(df)
        records_count = cls.ingest_dataframe_to_db(df, db, replace_existing=True)

        return {
            "records_count": records_count,
            "quality_report": quality_report,
            "message": f"Successfully loaded 6-month demonstration dataset with {records_count:,} records.",
        }
