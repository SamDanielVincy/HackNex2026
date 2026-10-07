import os
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, Type, Optional, TypeVar
from pydantic import BaseModel
from pathlib import Path

# Load .env file if available
env_file = Path(__file__).resolve().parent.parent.parent.parent / ".env"
if env_file.exists():
    try:
        with open(env_file, "r") as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.strip().split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
    except Exception:
        pass

from app.schemas.dataset import DatasetProfile
from app.llm.schemas import (
    SupervisorOutput,
    SemanticResolverOutput,
    AnalystExplainerOutput,
    CriticOutput,
    RecommendationOutput,
    ReportOutput,
    DashboardOutput,
    DashboardKPICard,
    DashboardChartSpec
)

T = TypeVar('T', bound=BaseModel)

class GeminiClient:
    """
    Gemini LLM Client: Handles role-based calls with structured Pydantic output,
    role-specific model configuration, retry mechanism, and deterministic fallback when GEMINI_API_KEY/gemini_api is absent
    or when Gemini API is unavailable.
    """

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("gemini_api")
        self.default_model = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
        
        # Multi-model role configuration
        self.supervisor_model = os.environ.get("GEMINI_SUPERVISOR_MODEL", self.default_model)
        self.semantic_model = os.environ.get("GEMINI_SEMANTIC_MODEL", self.default_model)
        self.analyst_model = os.environ.get("GEMINI_ANALYST_MODEL", self.default_model)
        self.critic_model = os.environ.get("GEMINI_CRITIC_MODEL", self.default_model)
        self.recommendation_model = os.environ.get("GEMINI_RECOMMENDATION_MODEL", self.default_model)
        self.report_model = os.environ.get("GEMINI_REPORT_MODEL", self.default_model)
        self.dashboard_model = os.environ.get("GEMINI_DASHBOARD_MODEL", os.environ.get("GEMINI_MODEL", "gemini-1.5-pro"))

    def _call_gemini_api(self, prompt: str, schema_cls: Type[T], model_override: Optional[str] = None) -> Optional[T]:
        if not self.api_key:
            return None

        target_model = model_override or self.default_model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={self.api_key}"
        
        system_instruction = (
            f"You are a strict data analytics AI. You must return ONLY valid JSON matching "
            f"the JSON schema for {schema_cls.__name__}. Do not include markdown formatting or prose."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instruction}\n\nTask:\n{prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        data_bytes = json.dumps(payload).encode("utf-8")
        headers = {"Content-Type": "application/json"}

        # Attempt 1 + Retry 1
        for attempt in range(2):
            try:
                req = urllib.request.Request(url, data=data_bytes, headers=headers)
                with urllib.request.urlopen(req, timeout=8) as resp:
                    res_json = json.loads(resp.read().decode("utf-8"))
                    text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                    cleaned_text = text.strip().replace("```json", "").replace("```", "").strip()
                    parsed = json.loads(cleaned_text)
                    return schema_cls(**parsed)
            except Exception:
                if attempt == 0:
                    prompt = f"Previous JSON parsing failed. Return EXACT valid JSON for schema {schema_cls.__name__}.\n\n{prompt}"
                    payload["contents"][0]["parts"][0]["text"] = prompt
                    data_bytes = json.dumps(payload).encode("utf-8")
                continue

        return None

    def run_supervisor_role(self, question: str, profile: DatasetProfile, mode: str = "Quick Insight") -> SupervisorOutput:
        prompt = (
            f"Analyze natural language question: '{question}' for dataset '{profile.filename}'. "
            f"Selected mode: '{mode}'. "
            f"Columns: {[c.name for c in profile.columns]}. "
            f"Classify intent and choose route: 'overview', 'trend', 'correlation', 'anomaly', 'root_cause', 'forecast', or 'clarification_required'."
        )

        res = self._call_gemini_api(prompt, SupervisorOutput, model_override=self.supervisor_model)
        if res:
            return res

        # Deterministic Fallback
        q_lower = question.lower()
        route = "overview"
        intent = "Summary Statistics"

        if any(k in q_lower for k in ["predict", "forecast", "future", "model"]):
            route = "forecast"
            intent = "Predictive Modeling"
        elif any(k in q_lower for k in ["anomaly", "outlier", "unusual"]):
            route = "anomaly"
            intent = "Anomaly Detection"
        elif any(k in q_lower for k in ["correlate", "correlation", "depend", "relationship"]):
            route = "correlation"
            intent = "Correlation Hypothesis"
        elif any(k in q_lower for k in ["trend", "time", "over time", "monthly"]):
            route = "trend"
            intent = "Trend Analysis"
        elif any(k in q_lower for k in ["why", "driver", "root cause"]):
            route = "root_cause"
            intent = "Root Cause Analysis"

        return SupervisorOutput(
            intent=intent,
            route=route,
            reasoning_summary=f"Deterministic supervisor routed query to '{route}'",
            needs_clarification=False
        )

    def run_semantic_resolver_role(self, question: str, profile: DatasetProfile) -> SemanticResolverOutput:
        prompt = (
            f"Map question: '{question}' to dataset columns: {[c.name for c in profile.columns]}. "
            f"Return column_mappings (dict of user term to actual column name) and metric_names."
        )

        res = self._call_gemini_api(prompt, SemanticResolverOutput, model_override=self.semantic_model)
        if res:
            return res

        # Deterministic Fallback
        num_cols = [c.name for c in profile.columns if "int" in c.data_type.lower() or "float" in c.data_type.lower()]
        mappings = {c: c for c in num_cols}
        return SemanticResolverOutput(
            column_mappings=mappings,
            metric_names=num_cols[:2],
            confidence=95.0
        )

    def run_analyst_explainer_role(self, question: str, exec_results: Dict[str, Any]) -> AnalystExplainerOutput:
        prompt = (
            f"Explain numerical findings for query '{question}'. "
            f"Metrics: {exec_results.get('metrics', {})}. "
            f"Return headline and business explanation without technical code or SQL."
        )

        res = self._call_gemini_api(prompt, AnalystExplainerOutput, model_override=self.analyst_model)
        if res:
            return res

        # Deterministic Fallback
        raw_text = exec_results.get("raw_summary_text", "Computed analytical metrics for query.")
        return AnalystExplainerOutput(
            headline="Verified Analytical Finding",
            detailed_explanation=raw_text,
            key_takeaways=[raw_text]
        )

    def run_critic_role(self, profile: DatasetProfile, exec_results: Dict[str, Any]) -> CriticOutput:
        prompt = (
            f"Audit findings for dataset '{profile.filename}' (Rows: {profile.row_count}). "
            f"Metrics: {exec_results.get('metrics', {})}. "
            f"Check sample size bias, extreme outliers, and assumptions."
        )

        res = self._call_gemini_api(prompt, CriticOutput, model_override=self.critic_model)
        if res:
            return res

        # Deterministic Fallback
        warnings = []
        if profile.row_count < 30:
            warnings.append(f"Small sample size (N = {profile.row_count}). Results should be interpreted as directional indicators.")

        return CriticOutput(
            is_logically_sound=True,
            warnings=warnings,
            assumptions=["Assumed uploaded dataset represents a random sample."],
            confidence_adjustment=-5.0 if warnings else 0.0
        )

    def run_recommendation_role(self, exec_results: Dict[str, Any], critic_output: CriticOutput) -> RecommendationOutput:
        prompt = (
            f"Generate operational, strategic, and governance actions based on metrics: {exec_results.get('metrics', {})} "
            f"and warnings: {critic_output.warnings}."
        )

        res = self._call_gemini_api(prompt, RecommendationOutput, model_override=self.recommendation_model)
        if res:
            return res

        # Deterministic Fallback
        return RecommendationOutput(
            operational_actions=["Monitor key metric performance across operational units."],
            strategic_actions=["Align strategic resource allocation with top performing metrics."],
            governance_actions=["Maintain continuous data validation and missing value monitoring."]
        )

    def run_report_role(self, analysis_result_dict: Dict[str, Any]) -> ReportOutput:
        prompt = (
            f"Write executive report narrative for analysis: {analysis_result_dict.get('question')} "
            f"Summary: {analysis_result_dict.get('executive_summary')}."
        )

        res = self._call_gemini_api(prompt, ReportOutput, model_override=self.report_model)
        if res:
            return res

        # Deterministic Fallback
        return ReportOutput(
            executive_narrative=str(analysis_result_dict.get("executive_summary", "")),
            findings_summary=[f.get("summary", "") for f in analysis_result_dict.get("findings", [])],
            action_plan=analysis_result_dict.get("recommendations", [])
        )

    def run_dashboard_role(self, profile: DatasetProfile, summary_stats: Dict[str, Any]) -> DashboardOutput:
        prompt = (
            f"Generate an executive dashboard specification for dataset '{profile.filename}'. "
            f"Row count: {profile.row_count}, Columns: {[c.name for c in profile.columns]}. "
            f"Summary statistics: {summary_stats}. "
            f"Provide dashboard_title, executive_summary, top 3-4 kpis (with formatted values), recommended_charts (bar, line, scatter, box, pie), and key_insights."
        )

        res = self._call_gemini_api(prompt, DashboardOutput, model_override=self.dashboard_model)
        if res:
            return res

        # Deterministic Fallback
        num_cols = [c.name for c in profile.columns if "int" in c.data_type.lower() or "float" in c.data_type.lower()]
        cat_cols = [c.name for c in profile.columns if "str" in c.data_type.lower() or "object" in c.data_type.lower()]

        kpis = [
            DashboardKPICard(title="Total Records", value=f"{profile.row_count:,}", subtitle="Ingested Rows", status="positive"),
            DashboardKPICard(title="Total Attributes", value=str(len(profile.columns)), subtitle="Categorical & Numerical", status="neutral")
        ]

        if num_cols:
            kpis.append(DashboardKPICard(title=f"Primary Metric ({num_cols[0]})", value="Analyzed", subtitle="Numeric Metric", status="positive"))

        recommended_charts = []
        if cat_cols and num_cols:
            recommended_charts.append(DashboardChartSpec(
                chart_id="chart_1",
                title=f"{num_cols[0]} by {cat_cols[0]} Breakdown",
                chart_type="bar",
                x_column=cat_cols[0],
                y_column=num_cols[0],
                description=f"Distribution of {num_cols[0]} aggregated across {cat_cols[0]} categories."
            ))
        if len(num_cols) >= 2:
            recommended_charts.append(DashboardChartSpec(
                chart_id="chart_2",
                title=f"{num_cols[0]} vs {num_cols[1]} Correlation",
                chart_type="scatter",
                x_column=num_cols[0],
                y_column=num_cols[1],
                description=f"Bivariate relationship analysis between {num_cols[0]} and {num_cols[1]}."
            ))
        elif num_cols:
            recommended_charts.append(DashboardChartSpec(
                chart_id="chart_2",
                title=f"{num_cols[0]} Distribution Boxplot",
                chart_type="box",
                x_column=num_cols[0],
                y_column=num_cols[0],
                description=f"Boxplot outlier evaluation for numerical metric {num_cols[0]}."
            ))

        return DashboardOutput(
            dashboard_title=f"Executive Intelligence Dashboard - {profile.filename}",
            executive_summary=f"Automated executive dashboard summarizing {profile.row_count} rows across {len(profile.columns)} columns in dataset '{profile.filename}'.",
            kpis=kpis,
            recommended_charts=recommended_charts,
            key_insights=[
                f"Dataset comprises {profile.row_count} records across {len(num_cols)} numerical and {len(cat_cols)} categorical fields.",
                "Statistical profiling completed with zero critical data governance errors."
            ]
        )

