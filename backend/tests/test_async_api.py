import io
import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_async_analysis_pipeline_flow():
    # 1. Upload sample dataset
    csv_data = "store,sales,profit\nStoreA,100,20\nStoreB,200,40\nStoreC,150,30\nStoreD,300,60\n"
    file_bytes = io.BytesIO(csv_data.encode("utf-8"))

    upload_resp = client.post(
        "/api/datasets/upload",
        files={"file": ("async_sales.csv", file_bytes, "text/csv")}
    )
    assert upload_resp.status_code == 200
    dataset_id = upload_resp.json()["dataset_id"]

    # 2. Start async analysis job
    start_resp = client.post(
        "/api/analyze",
        json={
            "dataset_id": dataset_id,
            "question": "What is the correlation between sales and profit?",
            "analysis_mode": "Quick Insight"
        }
    )
    assert start_resp.status_code == 200
    start_data = start_resp.json()
    assert "analysis_id" in start_data
    assert start_data["status"] == "queued"

    analysis_id = start_data["analysis_id"]

    # 3. Poll status until completed (max 10s)
    completed = False
    for _ in range(20):
        status_resp = client.get(f"/api/analyze/{analysis_id}")
        assert status_resp.status_code == 200
        st = status_resp.json()
        assert st["analysis_id"] == analysis_id
        if st["status"] == "completed":
            completed = True
            break
        time.sleep(0.2)

    assert completed is True

    # 4. Get result
    result_resp = client.get(f"/api/analyze/{analysis_id}/result")
    assert result_resp.status_code == 200
    res = result_resp.json()
    assert res["analysis_id"] == analysis_id
    assert len(res["findings"]) > 0
    assert res["confidence_score"] > 0

    # 5. Fetch history
    hist_resp = client.get("/api/analyze/history")
    assert hist_resp.status_code == 200
    hist = hist_resp.json()
    assert any(h["analysis_id"] == analysis_id for h in hist)

def test_events_safety():
    # Fetch events for any run and ensure zero SQL/Python/Prompts
    upload_resp = client.post(
        "/api/datasets/upload",
        files={"file": ("safety.csv", io.BytesIO(b"x,y\n1,2\n3,4\n5,6\n"), "text/csv")}
    )
    ds_id = upload_resp.json()["dataset_id"]
    start_resp = client.post("/api/analyze", json={"dataset_id": ds_id, "question": "Show distribution"})
    aid = start_resp.json()["analysis_id"]

    # Wait for completion
    for _ in range(20):
        if client.get(f"/api/analyze/{aid}").json()["status"] == "completed":
            break
        time.sleep(0.1)

    events_resp = client.get(f"/api/analyze/{aid}/events?poll=true")
    assert events_resp.status_code == 200
    events = events_resp.json()
    assert len(events) > 0

    forbidden_terms = ["SELECT", "import pandas", "system_prompt", "chain_of_thought", "C:\\", "password"]
    for evt in events:
        msg = evt["safe_message"].upper()
        for term in forbidden_terms:
            assert term.upper() not in msg
