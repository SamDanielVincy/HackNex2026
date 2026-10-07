import pandas as pd
from typing import Dict, Any, List, Optional
from app.agents.profiler_agent import DataProfilerAgent
from app.schemas.dataset import DatasetProfile
from app.llm.gemini_client import GeminiClient
from app.utils.json_helpers import sanitize_for_json

class GeminiDashboardAgent:
    """
    Gemini Dashboard Agent: Builds an executive multi-chart visual dashboard
    and comprehensive dataset summary with KPI cards and rendered Plotly charts.
    """

    def __init__(self):
        self.gemini_client = GeminiClient()
        self.profiler = DataProfilerAgent()

    def generate_dashboard(self, dataset_id: str) -> Dict[str, Any]:
        from app.main import DATASET_REGISTRY
        if dataset_id not in DATASET_REGISTRY:
            raise ValueError(f"Dataset '{dataset_id}' not found.")

        item = DATASET_REGISTRY[dataset_id]
        file_path = item["file_path"]
        df = self.profiler.read_dataset(file_path)
        profile = DatasetProfile(**item["profile"])

        # Calculate base numeric summary stats for Gemini context
        num_df = df.select_dtypes(include=["number"])
        summary_stats = sanitize_for_json(num_df.describe().to_dict()) if not num_df.empty else {}



        # 1. Call Gemini Dashboard Agent role
        dash_output = self.gemini_client.run_dashboard_role(profile, summary_stats)

        # 2. Build exact Plotly chart specifications for each recommended chart
        rendered_charts: List[Dict[str, Any]] = []

        num_cols = [c.name for c in profile.columns if "int" in c.data_type.lower() or "float" in c.data_type.lower()]
        cat_cols = [c.name for c in profile.columns if "str" in c.data_type.lower() or "object" in c.data_type.lower()]

        for spec in dash_output.recommended_charts:
            chart_type = spec.chart_type.lower()
            x_col = spec.x_column if (spec.x_column and spec.x_column in df.columns) else (cat_cols[0] if cat_cols else (num_cols[0] if num_cols else None))
            y_col = spec.y_column if (spec.y_column and spec.y_column in df.columns) else (num_cols[0] if num_cols else None)

            if not x_col or not y_col:
                continue

            plotly_spec = None

            if chart_type == "bar" and x_col in df.columns and y_col in df.columns:
                grouped = df.groupby(x_col)[y_col].mean().reset_index().head(12)
                plotly_spec = {
                    "chart_type": "bar",
                    "data": [{
                        "x": grouped[x_col].astype(str).tolist(),
                        "y": grouped[y_col].tolist(),
                        "type": "bar",
                        "marker": {"color": "#6366f1"}
                    }],
                    "layout": {
                        "title": spec.title,
                        "xaxis": {"title": x_col},
                        "yaxis": {"title": f"Mean {y_col}"},
                        "paper_bgcolor": "transparent",
                        "plot_bgcolor": "transparent",
                        "font": {"color": "#f3f4f6"}
                    }
                }
            elif chart_type == "scatter" and x_col in df.columns and y_col in df.columns:
                sample_df = df.dropna(subset=[x_col, y_col]).head(200)
                plotly_spec = {
                    "chart_type": "scatter",
                    "data": [{
                        "x": sample_df[x_col].tolist(),
                        "y": sample_df[y_col].tolist(),
                        "mode": "markers",
                        "type": "scatter",
                        "marker": {"color": "#10b981", "size": 8, "opacity": 0.8}
                    }],
                    "layout": {
                        "title": spec.title,
                        "xaxis": {"title": x_col},
                        "yaxis": {"title": y_col},
                        "paper_bgcolor": "transparent",
                        "plot_bgcolor": "transparent",
                        "font": {"color": "#f3f4f6"}
                    }
                }
            else: # Fallback Boxplot or Line
                sample_df = df.dropna(subset=[y_col]).head(300)
                plotly_spec = {
                    "chart_type": "box",
                    "data": [{
                        "y": sample_df[y_col].tolist(),
                        "type": "box",
                        "name": y_col,
                        "marker": {"color": "#ec4899"}
                    }],
                    "layout": {
                        "title": spec.title,
                        "yaxis": {"title": y_col},
                        "paper_bgcolor": "transparent",
                        "plot_bgcolor": "transparent",
                        "font": {"color": "#f3f4f6"}
                    }
                }

            if plotly_spec:
                rendered_charts.append({
                    "chart_id": spec.chart_id,
                    "title": spec.title,
                    "description": spec.description,
                    "spec": plotly_spec
                })

        # 3. Build summary preview table
        preview_table = df.head(10).to_dict(orient="records")

        # 4. Construct complete response
        result = {
            "dataset_id": dataset_id,
            "filename": profile.filename,
            "row_count": profile.row_count,
            "column_count": len(profile.columns),
            "dashboard_title": dash_output.dashboard_title,
            "executive_summary": dash_output.executive_summary,
            "kpis": [kpi.model_dump() for kpi in dash_output.kpis],
            "charts": rendered_charts,
            "key_insights": dash_output.key_insights,
            "dataset_summary": {
                "columns": [{"name": c.name, "type": c.data_type, "null_count": c.missing_count} for c in profile.columns],
                "sample_rows": preview_table
            }
        }


        return sanitize_for_json(result)
