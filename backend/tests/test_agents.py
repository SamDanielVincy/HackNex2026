import pandas as pd
import pytest
from app.agents.profiler_agent import DataProfilerAgent
from app.agents.intent_agent import IntentStrategyAgent
from app.agents.execution_agent import AnalyticalExecutionAgent
from app.agents.verifier_agent import SelfVerificationAgent
from app.agents.synthesis_agent import SynthesisVisualizationAgent
from app.agents.orchestrator import MultiAgentOrchestrator

@pytest.fixture
def sample_df_and_profile():
    df = pd.DataFrame({
        "region": ["North", "South", "East", "West", "North", "South", "East", "West"],
        "revenue": [5000, 7000, 3000, 9000, 5200, 7100, 3100, 9200],
        "expenses": [3000, 4000, 2000, 5000, 3100, 4100, 2100, 5100]
    })
    profiler = DataProfilerAgent()
    # Mock profiling in-memory
    _, profile = profiler.profile_dataset.__func__(profiler, "", "test.csv") if False else (df, None)
    return df

def test_intent_agent():
    intent_agent = IntentStrategyAgent()
    # Mock profile schema
    from app.schemas.dataset import DatasetProfile, ColumnProfile
    profile = DatasetProfile(
        dataset_id="test1",
        filename="test.csv",
        file_size_bytes=100,
        row_count=100,
        column_count=2,
        memory_usage_kb=10.0,
        quality_score=95.0,
        duplicate_rows=0,
        columns=[
            ColumnProfile(name="revenue", data_type="float64", missing_count=0, missing_percent=0, unique_count=50),
            ColumnProfile(name="expenses", data_type="float64", missing_count=0, missing_percent=0, unique_count=50)
        ],
        warnings=[],
        data_summary="Test summary",
        created_at="2026-10-07"
    )

    res = intent_agent.analyze_intent("What is the correlation between revenue and expenses?", profile)
    assert res["analysis_type"] == "CORRELATION_HYPOTHESIS"
    assert res["primary_engine"] == "SciPy_Statsmodels"

def test_execution_agent_correlation():
    df = pd.DataFrame({
        "revenue": [10, 20, 30, 40, 50, 60, 70, 80],
        "expenses": [5, 10, 15, 20, 25, 30, 35, 40]
    })
    exec_agent = AnalyticalExecutionAgent()
    intent = {
        "analysis_type": "CORRELATION_HYPOTHESIS",
        "target_num_cols": ["revenue", "expenses"],
        "target_cat_cols": [],
        "all_num_cols": ["revenue", "expenses"],
        "all_cat_cols": []
    }
    results = exec_agent.execute_analysis(df, intent)
    assert results["metrics"]["pearson_r"] == 1.0
    assert results["metrics"]["is_significant"] is True
    assert results["chart_data"]["type"] == "scatter"

def test_orchestrator_end_to_end(tmp_path):
    csv_file = tmp_path / "sales_test.csv"
    df = pd.DataFrame({
        "store": ["StoreA", "StoreB", "StoreA", "StoreB", "StoreC", "StoreC"],
        "sales": [200, 300, 220, 310, 400, 410],
        "profit": [50, 80, 55, 82, 100, 105]
    })
    df.to_csv(csv_file, index=False)

    orchestrator = MultiAgentOrchestrator()
    resp = orchestrator.run_pipeline(
        dataset_id="ds_test",
        file_path=str(csv_file),
        filename="sales_test.csv",
        question="Show me sales breakdown by store"
    )

    assert resp.dataset_id == "ds_test"
    assert resp.confidence_score > 50.0
    assert len(resp.findings) > 0
    assert len(resp.progress_steps) == 10
    assert len(set(s.step_id for s in resp.progress_steps)) == 5
    assert resp.findings[0].chart_spec is not None
