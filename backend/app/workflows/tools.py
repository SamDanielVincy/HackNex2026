from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import pandas as pd
from app.schemas.dataset import DatasetProfile
from app.agents.profiler_agent import DataProfilerAgent
from app.agents.execution_agent import AnalyticalExecutionAgent
from app.utils.json_helpers import sanitize_for_json

profiler = DataProfilerAgent()
executor = AnalyticalExecutionAgent()

# Tool Input/Output Schemas
class DatasetInput(BaseModel):
    file_path: str = Field(description="Absolute or relative path to the dataset file")
    filename: str = Field(description="Original filename")

class ListColumnsInput(BaseModel):
    file_path: str

class MetricResolveInput(BaseModel):
    file_path: str
    target_metric: str

class AnalysisExecuteInput(BaseModel):
    file_path: str
    filename: str
    analysis_type: str  # "AGGREGATION_BREAKDOWN", "CORRELATION_HYPOTHESIS", "TREND_ANALYSIS", "ANOMALY_DETECTION", "SEGMENTATION", "PREDICTIVE_MODELING"
    num_cols: List[str] = Field(default_factory=list)
    cat_cols: List[str] = Field(default_factory=list)

class ValidationResultInput(BaseModel):
    metrics: Dict[str, Any]
    row_count: int

# Read-Only Tool Functions
def get_dataset_profile(inp: DatasetInput) -> Dict[str, Any]:
    """Reads dataset safely and returns structured profile statistics."""
    try:
        df, profile = profiler.profile_dataset(inp.file_path, inp.filename)
        return sanitize_for_json(profile.model_dump())
    except Exception as e:
        return {"error": f"Failed to profile dataset: {str(e)}"}

def list_columns(inp: ListColumnsInput) -> List[Dict[str, str]]:
    """Lists columns and data types safely from dataset file."""
    try:
        df = profiler.read_dataset(inp.file_path)
        return [{"name": str(c), "type": str(df[c].dtype)} for c in df.columns]
    except Exception:
        return []

def resolve_metric(inp: MetricResolveInput) -> Dict[str, Any]:
    """Resolves target metric column availability and validates column data type."""
    try:
        df = profiler.read_dataset(inp.file_path)
        col = inp.target_metric
        if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
            return {"resolved": True, "column": col, "dtype": str(df[col].dtype)}
        
        # Search for closest numeric column
        num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        if num_cols:
            return {"resolved": True, "column": num_cols[0], "dtype": str(df[num_cols[0]].dtype), "note": "Substituted available numeric column"}
        return {"resolved": False, "error": "No valid numeric column found"}
    except Exception as e:
        return {"resolved": False, "error": str(e)}

def run_overview_analysis(inp: AnalysisExecuteInput) -> Dict[str, Any]:
    """Executes descriptive overview statistics tool."""
    return run_tool_execution(inp, "SUMMARY_STATISTICS")

def run_group_comparison(inp: AnalysisExecuteInput) -> Dict[str, Any]:
    """Executes categorical aggregation breakdown comparison tool."""
    return run_tool_execution(inp, "AGGREGATION_BREAKDOWN")

def run_time_trend(inp: AnalysisExecuteInput) -> Dict[str, Any]:
    """Executes time-series aggregate trend analysis tool."""
    return run_tool_execution(inp, "TREND_ANALYSIS")

def run_correlation(inp: AnalysisExecuteInput) -> Dict[str, Any]:
    """Executes Pearson correlation and hypothesis testing tool."""
    return run_tool_execution(inp, "CORRELATION_HYPOTHESIS")

def run_outlier_analysis(inp: AnalysisExecuteInput) -> Dict[str, Any]:
    """Executes Isolation Forest anomaly detection tool."""
    return run_tool_execution(inp, "ANOMALY_DETECTION")

def run_root_cause_analysis(inp: AnalysisExecuteInput) -> Dict[str, Any]:
    """Executes feature correlation driver & root-cause tool."""
    return run_tool_execution(inp, "CORRELATION_HYPOTHESIS")

def run_forecast(inp: AnalysisExecuteInput) -> Dict[str, Any]:
    """Executes predictive linear regression modeling tool."""
    return run_tool_execution(inp, "PREDICTIVE_MODELING")

def run_tool_execution(inp: AnalysisExecuteInput, target_type: str) -> Dict[str, Any]:
    """Generic read-only execution wrapper with row cap (max 500 rows processed)."""
    try:
        df = profiler.read_dataset(inp.file_path)
        # Cap row limit for safety & performance
        if len(df) > 500:
            df = df.head(500)

        intent = {
            "analysis_type": target_type,
            "target_num_cols": inp.num_cols or [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])][:2],
            "target_cat_cols": inp.cat_cols or [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])][:1],
            "all_num_cols": [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])],
            "all_cat_cols": [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
        }

        results = executor.execute_analysis(df, intent)
        return sanitize_for_json(results)
    except Exception as e:
        return {"error": f"Tool execution failed: {str(e)}"}

def validate_result(inp: ValidationResultInput) -> Dict[str, Any]:
    """Validates metrics sanity and returns quality status."""
    if not inp.metrics:
        return {"valid": False, "reason": "Empty metrics computed"}
    if inp.row_count < 5:
        return {"valid": False, "reason": "Insufficient rows for statistical validity"}
    return {"valid": True, "reason": "Passed validation checks"}
