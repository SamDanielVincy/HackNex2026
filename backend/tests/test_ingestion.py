import os
import tempfile
import pandas as pd
import pytest
from app.agents.profiler_agent import DataProfilerAgent

def test_profiler_agent_basic_csv():
    # Create sample CSV
    data = {
        "category": ["A", "B", "A", "C", "B", "A", "C", "A"],
        "sales": [100.0, 150.5, 120.0, 300.0, 110.0, 105.0, 290.0, 115.0],
        "quantity": [10, 15, 12, 30, 11, 10, 29, 11]
    }
    df_sample = pd.DataFrame(data)
    
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        df_sample.to_csv(tmp.name, index=False)
        tmp_path = tmp.name

    try:
        profiler = DataProfilerAgent()
        df_loaded, profile = profiler.profile_dataset(tmp_path, "sample.csv")

        assert profile.row_count == 8
        assert profile.column_count == 3
        assert profile.quality_score >= 80.0
        assert len(profile.columns) == 3
        
        # Check sales column profile
        sales_col = next(c for c in profile.columns if c.name == "sales")
        assert sales_col.min == 100.0
        assert sales_col.max == 300.0
        assert sales_col.mean > 0

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
