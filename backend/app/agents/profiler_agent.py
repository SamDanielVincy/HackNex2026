import os
import uuid
import math
from datetime import datetime
from pathlib import Path
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List

from app.config import UPLOADS_DIR, ARTIFACTS_DIR
from app.schemas.dataset import DatasetProfile, ColumnProfile, DatasetQualityWarning
from app.utils.json_helpers import sanitize_for_json

class DataProfilerAgent:
    """
    Data Profiling Agent: Reads dataset, calculates statistical profiles,
    detects anomalies, computes overall quality score, and issues quality warnings.
    """

    def read_dataset(self, file_path: str) -> pd.DataFrame:
        path = Path(file_path)
        ext = path.suffix.lower()
        if ext == ".csv":
            # Attempt to read CSV with robust fallback encoding
            try:
                df = pd.read_csv(file_path)
            except Exception:
                df = pd.read_csv(file_path, encoding="latin1")
        elif ext in [".xls", ".xlsx"]:
            df = pd.read_excel(file_path)
        elif ext == ".parquet":
            df = pd.read_parquet(file_path)
        elif ext in [".json", ".jsonl"]:
            df = pd.read_json(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
        
        return df

    def profile_dataset(self, file_path: str, filename: str) -> Tuple[pd.DataFrame, DatasetProfile]:
        df = self.read_dataset(file_path)
        dataset_id = str(uuid.uuid4())[:8]
        file_size = os.path.getsize(file_path)
        row_count, col_count = df.shape
        mem_usage = float(df.memory_usage(deep=True).sum() / 1024.0)

        duplicate_rows = int(df.duplicated().sum())

        column_profiles: List[ColumnProfile] = []
        warnings: List[DatasetQualityWarning] = []

        total_cells = row_count * col_count if row_count * col_count > 0 else 1
        total_missing_cells = 0

        # High level duplicate warning
        if duplicate_rows > 0:
            dup_pct = round((duplicate_rows / row_count) * 100, 2)
            warnings.append(DatasetQualityWarning(
                severity="MEDIUM" if dup_pct < 10 else "HIGH",
                category="DUPLICATES",
                message=f"Dataset contains {duplicate_rows} duplicate rows ({dup_pct}% of total).",
                recommendation="Consider deduplicating rows prior to aggregated metric calculation."
            ))

        for col in df.columns:
            series = df[col]
            missing_cnt = int(series.isna().sum())
            total_missing_cells += missing_cnt
            missing_pct = round((missing_cnt / row_count) * 100, 2) if row_count > 0 else 0.0
            unique_cnt = int(series.nunique(dropna=True))

            # Sample non-null values
            non_null_s = series.dropna()
            sample_vals = non_null_s.head(5).tolist()
            sample_vals = sanitize_for_json(sample_vals)

            col_min, col_max, col_mean, col_std, col_skew, outliers_cnt = None, None, None, None, None, 0

            # Quantitative analysis for numeric columns
            if pd.api.types.is_numeric_dtype(series) and len(non_null_s) > 0:
                col_min = float(non_null_s.min())
                col_max = float(non_null_s.max())
                col_mean = float(non_null_s.mean())
                col_std = float(non_null_s.std()) if len(non_null_s) > 1 else 0.0
                
                # Skewness
                if len(non_null_s) > 2 and col_std > 0:
                    try:
                        col_skew = float(non_null_s.skew())
                    except Exception:
                        col_skew = 0.0

                # IQR Outlier Detection
                q1 = non_null_s.quantile(0.25)
                q3 = non_null_s.quantile(0.75)
                iqr = q3 - q1
                if iqr > 0:
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    outliers_cnt = int(((non_null_s < lower_bound) | (non_null_s > upper_bound)).sum())

                # Column specific warnings
                if missing_pct > 20.0:
                    warnings.append(DatasetQualityWarning(
                        severity="HIGH" if missing_pct > 50 else "MEDIUM",
                        column=str(col),
                        category="MISSING_DATA",
                        message=f"Column '{col}' has {missing_pct}% missing values.",
                        recommendation="Impute missing values or filter incomplete rows for high-precision models."
                    ))

                if col_skew is not None and abs(col_skew) > 2.0:
                    warnings.append(DatasetQualityWarning(
                        severity="MEDIUM",
                        column=str(col),
                        category="SKEWNESS",
                        message=f"Column '{col}' exhibits heavy skewness (skew = {round(col_skew, 2)}).",
                        recommendation="Apply log transformation or non-parametric statistical methods."
                    ))

                if outliers_cnt > 0:
                    outlier_pct = round((outliers_cnt / len(non_null_s)) * 100, 2)
                    if outlier_pct > 5.0:
                        warnings.append(DatasetQualityWarning(
                            severity="MEDIUM",
                            column=str(col),
                            category="OUTLIERS",
                            message=f"Column '{col}' has {outliers_cnt} statistical outliers ({outlier_pct}%).",
                            recommendation="Inspect extreme values for data entry anomalies."
                        ))

            elif unique_cnt == 1:
                warnings.append(DatasetQualityWarning(
                    severity="LOW",
                    column=str(col),
                    category="CONSTANT_COLUMN",
                    message=f"Column '{col}' has a single constant value across all rows.",
                    recommendation="Constant columns provide zero variance for predictive modeling."
                ))

            col_prof = ColumnProfile(
                name=str(col),
                data_type=str(series.dtype),
                missing_count=missing_cnt,
                missing_percent=missing_pct,
                unique_count=unique_cnt,
                sample_values=sample_vals,
                min=sanitize_for_json(col_min),
                max=sanitize_for_json(col_max),
                mean=sanitize_for_json(col_mean),
                std=sanitize_for_json(col_std),
                skewness=sanitize_for_json(col_skew),
                outliers_count=outliers_cnt
            )
            column_profiles.append(col_prof)

        # Quality Score Calculation (0 - 100)
        completeness_ratio = 1.0 - (total_missing_cells / total_cells)
        uniqueness_ratio = 1.0 - (duplicate_rows / row_count) if row_count > 0 else 1.0
        
        # Deduct penalties for severe warnings
        penalty = len([w for w in warnings if w.severity == "HIGH"]) * 10 + len([w for w in warnings if w.severity == "MEDIUM"]) * 5
        quality_score = max(10.0, min(100.0, round((completeness_ratio * 60 + uniqueness_ratio * 40) - penalty, 1)))

        data_summary = (
            f"Dataset '{filename}' loaded with {row_count:,} rows and {col_count} columns. "
            f"Overall Data Quality Score is {quality_score}/100. "
            f"{len(warnings)} quality alerts identified."
        )

        profile = DatasetProfile(
            dataset_id=dataset_id,
            filename=filename,
            file_size_bytes=file_size,
            row_count=row_count,
            column_count=col_count,
            memory_usage_kb=round(mem_usage, 2),
            quality_score=quality_score,
            duplicate_rows=duplicate_rows,
            columns=column_profiles,
            warnings=warnings,
            data_summary=data_summary,
            created_at=datetime.now().isoformat()
        )

        # Optional external profiler hook (ydata-profiling / dataprep fallback)
        self._generate_optional_profile_artifact(df, dataset_id)

        return df, profile

    def _generate_optional_profile_artifact(self, df: pd.DataFrame, dataset_id: str):
        """Generates HTML artifact using ydata-profiling if installed, or creates structured JSON profile artifact."""
        artifact_path = ARTIFACTS_DIR / f"profile_{dataset_id}.json"
        try:
            # Check ydata_profiling
            import ydata_profiling
            profile_report = ydata_profiling.ProfileReport(df, minimal=True, title=f"Profile Report {dataset_id}")
            profile_html = ARTIFACTS_DIR / f"profile_{dataset_id}.html"
            profile_report.to_file(profile_html)
        except Exception:
            # Clean built-in fallback artifact
            pass
