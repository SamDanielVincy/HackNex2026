from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentProgressStep(BaseModel):
    step_id: int
    agent_name: str
    title: str
    status: str  # "pending", "running", "completed", "failed"
    message: str
    timestamp: str

class StatisticalSummary(BaseModel):
    test_name: Optional[str] = None
    statistic_value: Optional[float] = None
    p_value: Optional[float] = None
    is_significant: Optional[bool] = None
    effect_size: Optional[float] = None
    details: Dict[str, Any] = {}

class VerifiedFinding(BaseModel):
    finding_id: str
    title: str
    summary: str
    detailed_explanation: str
    key_metrics: Dict[str, Any] = {}
    chart_spec: Optional[Dict[str, Any]] = None
    statistical_summary: Optional[StatisticalSummary] = None

class ConfidenceBreakdown(BaseModel):
    sample_size_score: float
    data_completeness_score: float
    statistical_validity_score: float
    distribution_normality_score: float
    overall_confidence: float
    confidence_level: str  # "HIGH", "MODERATE", "LOW"

class AnalysisRequest(BaseModel):
    dataset_id: str
    question: str
    analysis_mode: Optional[str] = "Quick Insight"

class AnalysisStartResponse(BaseModel):
    analysis_id: str
    status: str  # "queued"
    message: str
    created_at: str

class AnalysisStatus(BaseModel):
    analysis_id: str
    dataset_id: str
    question: str
    status: str  # "queued", "running", "needs_clarification", "completed", "failed"
    progress_percent: int
    current_agent: str
    current_message: str
    created_at: str
    updated_at: str
    error_message: Optional[str] = None
    clarification_question: Optional[str] = None
    clarification_options: Optional[List[str]] = None

class AnalysisEvent(BaseModel):
    analysis_id: str
    sequence: int
    agent: str  # "Supervisor", "Data Profiler", "Intent Strategy", "Analytical Execution", "Self Verification", "Synthesis and Visualization"
    status: str  # "waiting", "active", "completed", "warning", "failed"
    safe_message: str
    progress: int
    timestamp: str

class AnalysisHistoryItem(BaseModel):
    analysis_id: str
    dataset_id: str
    dataset_name: str
    question: str
    analysis_type: str
    quality_status: str
    confidence_score: float
    status: str
    created_at: str

class AnalysisResponse(BaseModel):
    analysis_id: str
    dataset_id: str
    question: str
    data_source: str
    analysis_type: str
    quality_status: str  # "HIGH_QUALITY", "VERIFIED_WITH_WARNINGS", "DEGRADED"
    confidence_score: float
    confidence_breakdown: ConfidenceBreakdown
    assumptions: List[str]
    warnings: List[str]
    executive_summary: str
    findings: List[VerifiedFinding]
    recommendations: List[str]
    progress_steps: List[AgentProgressStep]
    created_at: str
