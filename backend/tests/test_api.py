import io
import time
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "InsightForge AI" in data["app"]
    assert data["status"] == "online"

def test_dataset_upload_and_analysis_flow():
    # 1. Create a dummy CSV file buffer
    csv_content = "department,salary,experience\nEngineering,120000,5\nMarketing,90000,3\nEngineering,135000,7\nSales,95000,4\nEngineering,140000,8\nMarketing,92000,4\nSales,98000,5\n"
    file_bytes = io.BytesIO(csv_content.encode("utf-8"))

    # 2. Upload file
    upload_resp = client.post(
        "/api/datasets/upload",
        files={"file": ("salary_data.csv", file_bytes, "text/csv")}
    )
    assert upload_resp.status_code == 200
    upload_data = upload_resp.json()
    dataset_id = upload_data["dataset_id"]
    assert dataset_id is not None
    assert upload_data["profile"]["row_count"] == 7
    assert upload_data["profile"]["column_count"] == 3

    # 3. List datasets
    list_resp = client.get("/api/datasets")
    assert list_resp.status_code == 200
    datasets = list_resp.json()
    assert any(d["dataset_id"] == dataset_id for d in datasets)

    # 4. Get specific profile
    profile_resp = client.get(f"/api/datasets/{dataset_id}")
    assert profile_resp.status_code == 200
    assert profile_resp.json()["dataset_id"] == dataset_id

    # 5. Run async analysis query
    start_resp = client.post(
        "/api/analyze",
        json={
            "dataset_id": dataset_id,
            "question": "What is the average salary by department?"
        }
    )
    assert start_resp.status_code == 200
    start_data = start_resp.json()
    assert start_data["status"] == "queued"
    analysis_id = start_data["analysis_id"]

    # Poll status until completed
    completed = False
    for _ in range(20):
        st_resp = client.get(f"/api/analyze/{analysis_id}")
        if st_resp.status_code == 200 and st_resp.json()["status"] == "completed":
            completed = True
            break
        time.sleep(0.1)

    assert completed is True

    # Fetch result
    analysis_resp = client.get(f"/api/analyze/{analysis_id}/result")
    assert analysis_resp.status_code == 200
    analysis_data = analysis_resp.json()
    assert analysis_data["dataset_id"] == dataset_id
    assert len(analysis_data["findings"]) > 0
    assert analysis_data["confidence_score"] > 0
    assert len(analysis_data["progress_steps"]) == 10
    assert "quality_status" in analysis_data
