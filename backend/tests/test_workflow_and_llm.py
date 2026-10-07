import os
import tempfile
import pandas as pd
import pytest

from app.llm.gemini_client import GeminiClient
from app.llm.schemas import (
    SupervisorOutput,
    SemanticResolverOutput,
    AnalystExplainerOutput,
    CriticOutput,
    RecommendationOutput
)
from app.schemas.dataset import DatasetProfile, ColumnProfile
from app.workflows.tools import (
    get_dataset_profile,
    list_columns,
    resolve_metric,
    run_correlation,
    validate_result,
    DatasetInput,
    ListColumnsInput,
    MetricResolveInput,
    AnalysisExecuteInput,
    ValidationResultInput
)
from app.workflows.analysis_graph import LangGraphWorkflowEngine

@pytest.fixture
def sample_dataset_path(tmp_path):
    csv_file = tmp_path / "test_workflow_data.csv"
    df = pd.DataFrame({
        "revenue": [100, 200, 300, 400, 500, 600, 700],
        "profit": [20, 40, 60, 80, 100, 120, 140],
        "category": ["A", "B", "A", "B", "C", "A", "B"]
    })
    df.to_csv(csv_file, index=False)
    return str(csv_file)

def test_gemini_fallback_without_api_key():
    client = GeminiClient()
    # Unset API key to test deterministic fallback
    client.api_key = None

    profile = DatasetProfile(
        dataset_id="ds1",
        filename="test.csv",
        file_size_bytes=100,
        row_count=50,
        column_count=2,
        memory_usage_kb=5.0,
        quality_score=90.0,
        duplicate_rows=0,
        columns=[ColumnProfile(name="revenue", data_type="float64", missing_count=0, missing_percent=0, unique_count=50)],
        warnings=[],
        data_summary="Test summary",
        created_at="2026-10-07"
    )

    sup = client.run_supervisor_role("What is the trend of revenue over time?", profile)
    assert sup.route in ["trend", "overview"]
    assert isinstance(sup.intent, str)

    sem = client.run_semantic_resolver_role("Show revenue", profile)
    assert "revenue" in sem.column_mappings

    expl = client.run_analyst_explainer_role("Show revenue", {"raw_summary_text": "Sample summary"})
    assert "Sample summary" in expl.detailed_explanation

    crit = client.run_critic_role(profile, {})
    assert crit.is_logically_sound is True

    rec = client.run_recommendation_role({}, crit)
    assert len(rec.operational_actions) > 0

def test_read_only_tools(sample_dataset_path):
    # 1. get_dataset_profile tool
    prof_res = get_dataset_profile(DatasetInput(file_path=sample_dataset_path, filename="test.csv"))
    assert prof_res["row_count"] == 7
    assert prof_res["column_count"] == 3

    # 2. list_columns tool
    cols = list_columns(ListColumnsInput(file_path=sample_dataset_path))
    assert len(cols) == 3

    # 3. resolve_metric tool
    res_metric = resolve_metric(MetricResolveInput(file_path=sample_dataset_path, target_metric="revenue"))
    assert res_metric["resolved"] is True
    assert res_metric["column"] == "revenue"

    # Invalid column handling
    res_invalid = resolve_metric(MetricResolveInput(file_path=sample_dataset_path, target_metric="non_existent_column"))
    assert res_invalid["resolved"] is True  # Substituted available numeric column

    # 4. run_correlation tool
    corr_res = run_correlation(AnalysisExecuteInput(
        file_path=sample_dataset_path,
        filename="test.csv",
        analysis_type="CORRELATION_HYPOTHESIS",
        num_cols=["revenue", "profit"]
    ))
    assert corr_res["metrics"]["pearson_r"] == 1.0

    # 5. validate_result tool
    val = validate_result(ValidationResultInput(metrics={"pearson_r": 1.0}, row_count=7))
    assert val["valid"] is True

def test_langgraph_workflow_engine(sample_dataset_path):
    engine = LangGraphWorkflowEngine()
    resp = engine.run_graph_analysis(
        analysis_id="test_graph_01",
        dataset_id="ds_graph",
        file_path=sample_dataset_path,
        filename="test_workflow_data.csv",
        question="What is the correlation between revenue and profit?"
    )

    assert resp.analysis_id == "test_graph_01"
    assert resp.confidence_score > 0
    assert len(resp.findings) > 0
    assert len(resp.progress_steps) == 10
    assert len(set(s.step_id for s in resp.progress_steps)) == 5

def test_dashboard_agent(sample_dataset_path):
    from app.agents.dashboard_agent import GeminiDashboardAgent
    from app.agents.profiler_agent import DataProfilerAgent
    from app.main import DATASET_REGISTRY

    profiler = DataProfilerAgent()
    df, profile = profiler.profile_dataset(sample_dataset_path, "test_workflow_data.csv")

    DATASET_REGISTRY["test_dash_ds"] = {
        "dataset_id": "test_dash_ds",
        "filename": "test_workflow_data.csv",
        "file_path": sample_dataset_path,
        "profile": profile.model_dump(),
        "created_at": profile.created_at
    }

    dash_agent = GeminiDashboardAgent()
    dash_res = dash_agent.generate_dashboard("test_dash_ds")

    assert dash_res["dataset_id"] == "test_dash_ds"
    assert "dashboard_title" in dash_res
    assert len(dash_res["kpis"]) > 0
    assert len(dash_res["charts"]) > 0
    assert len(dash_res["dataset_summary"]["columns"]) == 3

