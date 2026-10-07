import uuid
from typing import Dict, Any, List, Optional
from app.schemas.analysis import VerifiedFinding, StatisticalSummary
from app.utils.json_helpers import sanitize_for_json

class SynthesisVisualizationAgent:
    """
    Synthesis & Visualization Agent: Translates execution outputs and statistical
    metrics into verified human-readable findings, executive summaries,
    actionable recommendations, and Plotly visual specifications.
    """

    def synthesize(
        self,
        question: str,
        intent: Dict[str, Any],
        exec_results: Dict[str, Any],
        verification: Dict[str, Any]
    ) -> Dict[str, Any]:
        analysis_type = intent["analysis_type"]
        metrics = exec_results.get("metrics", {})
        chart_raw = exec_results.get("chart_data")
        stat_raw = exec_results.get("statistical_summary")
        raw_text = exec_results.get("raw_summary_text", "")
        conf_score = verification.get("confidence_score", 90.0)

        # 1. Executive Summary Generation
        exec_summary = (
            f"Analysis conducted for query '{question}'. "
            f"Using {analysis_type.replace('_', ' ').title()} strategy, "
            f"the analytical engine verified key findings with a confidence rating of {conf_score}%. "
            f"{raw_text}"
        )

        # 2. Plotly Visual Spec Generation
        chart_spec = self._build_plotly_spec(chart_raw) if chart_raw else None

        # 3. Statistical Summary Formatting
        stat_summary_obj = None
        if stat_raw:
            stat_summary_obj = StatisticalSummary(
                test_name=stat_raw.get("test_name"),
                statistic_value=stat_raw.get("statistic_value"),
                p_value=stat_raw.get("p_value"),
                is_significant=stat_raw.get("is_significant"),
                effect_size=stat_raw.get("effect_size"),
                details=stat_raw.get("details", {})
            )

        # 4. Key Verified Findings Formatting
        finding_id = f"find_{str(uuid.uuid4())[:6]}"
        finding_title = f"Verified Insight: {analysis_type.replace('_', ' ').title()}"
        
        detail_explanation = (
            f"The data engine processed target features according to analytical intent. "
            f"The overall confidence score is verified at {conf_score}%. "
            f"{raw_text}"
        )

        finding = VerifiedFinding(
            finding_id=finding_id,
            title=finding_title,
            summary=raw_text,
            detailed_explanation=detail_explanation,
            key_metrics=sanitize_for_json(metrics),
            chart_spec=chart_spec,
            statistical_summary=stat_summary_obj
        )

        # 5. Recommendations Formulation
        recommendations = self._formulate_recommendations(analysis_type, metrics, conf_score)

        return {
            "executive_summary": exec_summary,
            "findings": [finding],
            "recommendations": recommendations
        }

    def _build_plotly_spec(self, chart_raw: Dict[str, Any]) -> Dict[str, Any]:
        c_type = chart_raw.get("type", "bar")
        x_data = chart_raw.get("x", [])
        y_data = chart_raw.get("y", [])
        title = chart_raw.get("title", "Visual Analysis")
        x_label = chart_raw.get("x_label", "X Axis")
        y_label = chart_raw.get("y_label", "Y Axis")

        plotly_data = []

        if c_type == "bar":
            plotly_data.append({
                "type": "bar",
                "x": x_data,
                "y": y_data,
                "marker": {"color": "#6366f1", "line": {"color": "#4f46e5", "width": 1.5}},
                "hovertemplate": f"%{{x}}<br>{y_label}: %{{y}}<extra></extra>"
            })
        elif c_type == "line":
            plotly_data.append({
                "type": "scatter",
                "mode": "lines+markers",
                "x": x_data,
                "y": y_data,
                "line": {"color": "#06b6d4", "width": 3, "shape": "spline"},
                "marker": {"size": 6, "color": "#0891b2"},
                "hovertemplate": f"%{{x}}<br>{y_label}: %{{y}}<extra></extra>"
            })
        elif c_type == "scatter":
            plotly_data.append({
                "type": "scatter",
                "mode": "markers",
                "x": x_data,
                "y": y_data,
                "marker": {"size": 8, "color": "#8b5cf6", "opacity": 0.8},
                "hovertemplate": f"{x_label}: %{{x}}<br>{y_label}: %{{y}}<extra></extra>"
            })
        elif c_type == "scatter_category":
            categories = chart_raw.get("categories", [])
            unique_cats = list(set(categories))
            colors = ["#6366f1", "#06b6d4", "#ec4899", "#10b981", "#f59e0b"]
            for idx, cat in enumerate(unique_cats):
                indices = [i for i, c in enumerate(categories) if c == cat]
                plotly_data.append({
                    "type": "scatter",
                    "mode": "markers",
                    "name": str(cat),
                    "x": [x_data[i] for i in indices],
                    "y": [y_data[i] for i in indices],
                    "marker": {"size": 8, "color": colors[idx % len(colors)]}
                })

        layout = {
            "title": {"text": title, "font": {"family": "Inter, sans-serif", "size": 16, "color": "#f8fafc"}},
            "paper_bgcolor": "rgba(0,0,0,0)",
            "plot_bgcolor": "rgba(15, 23, 42, 0.6)",
            "xaxis": {
                "title": {"text": x_label, "font": {"color": "#94a3b8"}},
                "gridcolor": "rgba(255,255,255,0.08)",
                "tickfont": {"color": "#cbd5e1"}
            },
            "yaxis": {
                "title": {"text": y_label, "font": {"color": "#94a3b8"}},
                "gridcolor": "rgba(255,255,255,0.08)",
                "tickfont": {"color": "#cbd5e1"}
            },
            "margin": {"l": 50, "r": 30, "t": 50, "b": 50},
            "autosize": True
        }

        return {
            "data": plotly_data,
            "layout": layout
        }

    def _formulate_recommendations(self, analysis_type: str, metrics: Dict[str, Any], conf_score: float) -> List[str]:
        recs = [
            "Monitor key metric distributions regularly to ensure sample consistency over time."
        ]
        if conf_score < 80.0:
            recs.append("Collect additional sample observations to improve statistical power and confidence level.")
        
        if analysis_type == "AGGREGATION_BREAKDOWN":
            top_group = metrics.get("top_group")
            if top_group:
                recs.append(f"Focus strategic operational resources on top-performing segment '{top_group}'.")
        elif analysis_type == "CORRELATION_HYPOTHESIS":
            if metrics.get("is_significant"):
                recs.append(f"Leverage the statistically significant correlation between {metrics.get('var1')} and {metrics.get('var2')} for key performance driver modeling.")
        elif analysis_type == "ANOMALY_DETECTION":
            anom_cnt = metrics.get("anomalies_detected", 0)
            if anom_cnt > 0:
                recs.append(f"Perform root-cause audit on the {anom_cnt} identified statistical anomaly records.")
        elif analysis_type == "PREDICTIVE_MODELING":
            r2 = metrics.get("r2_score", 0.0)
            if r2 > 0.5:
                recs.append(f"Deploy predictive model equations for target metric forecasting with R² reliability score of {r2}.")

        return recs
