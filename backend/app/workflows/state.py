from typing import Dict, Any, List, Optional, TypedDict
from app.schemas.dataset import DatasetProfile

class AnalysisGraphState(TypedDict, total=False):
    analysis_id: str
    dataset_id: str
    question: str
    analysis_mode: str
    profile: Optional[DatasetProfile]
    intent: Dict[str, Any]
    route: str
    semantic_mapping: Dict[str, Any]
    execution_result: Dict[str, Any]
    chart_specs: List[Dict[str, Any]]
    critic_result: Dict[str, Any]
    recommendations: List[str]
    warnings: List[str]
    confidence: float
    safe_events: List[Dict[str, Any]]
    final_result: Dict[str, Any]
