from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class SupervisorOutput(BaseModel):
    intent: str = Field(description="Inferred analytical intent, e.g. Aggregation, Correlation, Trend, Anomaly, Forecast")
    route: str = Field(description="Workflow route: overview, trend, correlation, anomaly, root_cause, forecast, or clarification_required")
    reasoning_summary: str = Field(description="Safe human-readable summary of routing choice")
    needs_clarification: bool = Field(default=False, description="True if query is ambiguous and requires user clarification")
    clarification_question: Optional[str] = Field(default=None, description="Safe user-facing clarification question if needed")
    clarification_options: Optional[List[str]] = Field(default=None, description="Selectable options for clarification")

class SemanticResolverOutput(BaseModel):
    column_mappings: Dict[str, str] = Field(default_factory=dict, description="Mapping of user terms to dataset column names")
    metric_names: List[str] = Field(default_factory=list, description="Target numerical metric columns")
    confidence: float = Field(default=90.0, description="Semantic mapping confidence score (0-100)")

class AnalystExplainerOutput(BaseModel):
    headline: str = Field(description="Executive summary headline of verified finding")
    detailed_explanation: str = Field(description="Human-readable business analysis without raw code or SQL")
    key_takeaways: List[str] = Field(default_factory=list, description="Key takeaway bullets")

class CriticOutput(BaseModel):
    is_logically_sound: bool = Field(default=True, description="True if computed findings are logically consistent")
    warnings: List[str] = Field(default_factory=list, description="List of logical, sample size, or variance warnings")
    assumptions: List[str] = Field(default_factory=list, description="Explicit analytical assumptions made")
    confidence_adjustment: float = Field(default=0.0, description="Penalty or bonus to confidence score (-20 to +10)")

class RecommendationOutput(BaseModel):
    operational_actions: List[str] = Field(default_factory=list, description="Immediate operational recommendations")
    strategic_actions: List[str] = Field(default_factory=list, description="Strategic resource allocation recommendations")
    governance_actions: List[str] = Field(default_factory=list, description="Data quality & governance recommendations")

class ReportOutput(BaseModel):
    executive_narrative: str = Field(description="Synthesized narrative for executive report")
    findings_summary: List[str] = Field(default_factory=list, description="Summary of key findings")
    action_plan: List[str] = Field(default_factory=list, description="Prioritized action plan steps")

class DashboardKPICard(BaseModel):
    title: str = Field(description="Title of KPI card, e.g. Total Revenue, Average Salary")
    value: str = Field(description="Formatted value string, e.g. $125.4K, 8.5 yrs")
    subtitle: Optional[str] = Field(default=None, description="Contextual subtitle or comparison")
    status: str = Field(default="neutral", description="Status indicator: positive, negative, neutral, warning")

class DashboardChartSpec(BaseModel):
    chart_id: str = Field(description="Unique identifier for chart")
    title: str = Field(description="Visual chart title")
    chart_type: str = Field(description="Type of chart: bar, line, scatter, box, pie, heatmap")
    x_column: Optional[str] = Field(default=None, description="Column for X axis")
    y_column: Optional[str] = Field(default=None, description="Column for Y axis")
    description: str = Field(description="Analytical explanation of what this chart highlights")

class DashboardOutput(BaseModel):
    dashboard_title: str = Field(description="Title of generated executive dashboard")
    executive_summary: str = Field(description="High-level executive overview of the entire dataset")
    kpis: List[DashboardKPICard] = Field(default_factory=list, description="Top executive KPI metrics")
    recommended_charts: List[DashboardChartSpec] = Field(default_factory=list, description="Recommended visual charts to render")
    key_insights: List[str] = Field(default_factory=list, description="Key strategic insights extracted from data")

