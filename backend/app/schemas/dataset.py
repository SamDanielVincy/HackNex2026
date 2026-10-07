from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ColumnProfile(BaseModel):
    name: str
    data_type: str
    missing_count: int
    missing_percent: float
    unique_count: int
    sample_values: List[Any] = []
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    std: Optional[float] = None
    skewness: Optional[float] = None
    outliers_count: Optional[int] = 0

class DatasetQualityWarning(BaseModel):
    severity: str  # "HIGH", "MEDIUM", "LOW"
    column: Optional[str] = None
    category: str  # "MISSING_DATA", "DUPLICATES", "SKEWNESS", "OUTLIERS", "CONSTANT_COLUMN"
    message: str
    recommendation: str

class DatasetProfile(BaseModel):
    dataset_id: str
    filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    memory_usage_kb: float
    quality_score: float  # 0.0 to 100.0
    duplicate_rows: int
    columns: List[ColumnProfile]
    warnings: List[DatasetQualityWarning]
    data_summary: str
    created_at: str

class DatasetUploadResponse(BaseModel):
    dataset_id: str
    filename: str
    message: str
    profile: DatasetProfile
