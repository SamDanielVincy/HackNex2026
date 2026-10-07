import os
import io
import json
import uuid
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from app.config import APP_TITLE, APP_VERSION, UPLOADS_DIR, ARTIFACTS_DIR
from app.schemas.dataset import DatasetProfile, DatasetUploadResponse
from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisStartResponse,
    AnalysisStatus,
    AnalysisEvent,
    AnalysisResponse,
    AnalysisHistoryItem
)
from app.agents.profiler_agent import DataProfilerAgent
from app.agents.orchestrator import MultiAgentOrchestrator
from app.workflows.analysis_graph import LangGraphWorkflowEngine
from app.utils.json_helpers import sanitize_for_json

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

profiler_agent = DataProfilerAgent()
orchestrator = MultiAgentOrchestrator()
graph_workflow_engine = LangGraphWorkflowEngine()

# Dataset Registry: dataset_id -> dict info
DATASET_REGISTRY: Dict[str, Dict[str, Any]] = {}

# Asynchronous Analysis Runs Registry: analysis_id -> dict state
ANALYSIS_RUNS: Dict[str, Dict[str, Any]] = {}

# Event Queues: analysis_id -> list of safe AnalysisEvent objects
ANALYSIS_EVENTS: Dict[str, List[Dict[str, Any]]] = {}

REGISTRY_FILE = ARTIFACTS_DIR / "analysis_registry.json"

def save_analysis_registry():
    try:
        data_to_save = {}
        for aid, info in ANALYSIS_RUNS.items():
            # Clone and sanitize
            item = dict(info)
            item.pop("result_object", None)
            data_to_save[aid] = item
        with open(REGISTRY_FILE, "w") as f:
            json.dump(sanitize_for_json(data_to_save), f, indent=2)
    except Exception:
        pass

def load_analysis_registry():
    if REGISTRY_FILE.exists():
        try:
            with open(REGISTRY_FILE, "r") as f:
                saved = json.load(f)
                ANALYSIS_RUNS.update(saved)
        except Exception:
            pass

@app.on_event("startup")
def startup_event():
    # Load dataset profiles from disk
    if ARTIFACTS_DIR.exists():
        for file in ARTIFACTS_DIR.glob("dataset_*.json"):
            try:
                with open(file, "r") as f:
                    data = json.load(f)
                    DATASET_REGISTRY[data["dataset_id"]] = data
            except Exception:
                pass
    load_analysis_registry()

@app.get("/")
def root():
    return {
        "app": APP_TITLE,
        "version": APP_VERSION,
        "status": "online",
        "datasets_loaded": len(DATASET_REGISTRY),
        "analyses_count": len(ANALYSIS_RUNS)
    }

@app.post("/api/datasets/upload", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    filename = file.filename
    if not filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a valid filename.")

    ext = Path(filename).suffix.lower()
    allowed_exts = [".csv", ".xlsx", ".xls", ".parquet", ".json", ".jsonl"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(allowed_exts)}"
        )

    file_id = str(uuid.uuid4())[:8]
    save_filename = f"{file_id}_{filename}"
    save_path = UPLOADS_DIR / save_filename

    try:
        content = await file.read()
        with open(save_path, "wb") as f:
            f.write(content)

        df, profile = profiler_agent.profile_dataset(str(save_path), filename)

        registry_item = {
            "dataset_id": profile.dataset_id,
            "filename": filename,
            "file_path": str(save_path),
            "profile": profile.model_dump(),
            "created_at": profile.created_at
        }
        DATASET_REGISTRY[profile.dataset_id] = registry_item

        artifact_file = ARTIFACTS_DIR / f"dataset_{profile.dataset_id}.json"
        with open(artifact_file, "w") as f:
            json.dump(sanitize_for_json(registry_item), f, indent=2)

        return DatasetUploadResponse(
            dataset_id=profile.dataset_id,
            filename=filename,
            message=f"Dataset '{filename}' successfully ingested and profiled ({profile.row_count:,} rows).",
            profile=profile
        )

    except Exception as e:
        if save_path.exists():
            os.remove(save_path)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process and profile uploaded file '{filename}': {str(e)}"
        )

from app.agents.dashboard_agent import GeminiDashboardAgent

@app.get("/api/datasets", response_model=List[DatasetProfile])
def list_datasets():
    return [DatasetProfile(**item["profile"]) for item in DATASET_REGISTRY.values()]

@app.get("/api/datasets/{dataset_id}", response_model=DatasetProfile)
def get_dataset_profile(dataset_id: str):
    if dataset_id not in DATASET_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")
    return DatasetProfile(**DATASET_REGISTRY[dataset_id]["profile"])

@app.get("/api/datasets/{dataset_id}/dashboard")
def get_dataset_dashboard(dataset_id: str):
    if dataset_id not in DATASET_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")
    try:
        dashboard_agent = GeminiDashboardAgent()
        return dashboard_agent.generate_dashboard(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate dashboard: {str(e)}")


def emit_agent_event(analysis_id: str, seq: int, agent: str, status_str: str, message: str, progress: int):
    evt = {
        "analysis_id": analysis_id,
        "sequence": seq,
        "agent": agent,
        "status": status_str,
        "safe_message": message,
        "progress": progress,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    }
    if analysis_id not in ANALYSIS_EVENTS:
        ANALYSIS_EVENTS[analysis_id] = []
    ANALYSIS_EVENTS[analysis_id].append(evt)
    
    if analysis_id in ANALYSIS_RUNS:
        ANALYSIS_RUNS[analysis_id]["current_agent"] = agent
        ANALYSIS_RUNS[analysis_id]["current_message"] = message
        ANALYSIS_RUNS[analysis_id]["progress_percent"] = progress
        ANALYSIS_RUNS[analysis_id]["updated_at"] = datetime.now().isoformat()

def execute_background_analysis(analysis_id: str, dataset_id: str, question: str, mode: str):
    ds_info = DATASET_REGISTRY[dataset_id]
    file_path = ds_info["file_path"]
    filename = ds_info["filename"]
    profile = DatasetProfile(**ds_info["profile"])

    ANALYSIS_RUNS[analysis_id]["status"] = "running"

    try:
        emit_agent_event(analysis_id, 1, "Supervisor", "active", "Initializing analytical query supervisor", 10)
        emit_agent_event(analysis_id, 2, "Data Profiler", "active", f"Verifying data profile for dataset '{filename}'", 25)
        emit_agent_event(analysis_id, 3, "Intent Strategy", "active", f"Classifying question intent and strategy for mode '{mode}'", 40)
        
        # Execute LangGraph multi-agent workflow
        response: AnalysisResponse = graph_workflow_engine.run_graph_analysis(
            analysis_id=analysis_id,
            dataset_id=dataset_id,
            file_path=file_path,
            filename=filename,
            question=question,
            existing_profile=profile,
            mode=mode
        )

        emit_agent_event(analysis_id, 4, "Analytical Execution", "active", "Executed statistical & database query operations", 65)
        emit_agent_event(analysis_id, 5, "Self Verification", "active", f"Self-verification auditor assigned confidence rating of {response.confidence_score}%", 85)
        emit_agent_event(analysis_id, 6, "Synthesis and Visualization", "completed", "Generated human-readable findings and visual charts", 100)

        # Update run status
        ANALYSIS_RUNS[analysis_id]["status"] = "completed"
        ANALYSIS_RUNS[analysis_id]["progress_percent"] = 100
        ANALYSIS_RUNS[analysis_id]["analysis_type"] = response.analysis_type
        ANALYSIS_RUNS[analysis_id]["quality_status"] = response.quality_status
        ANALYSIS_RUNS[analysis_id]["confidence_score"] = response.confidence_score
        ANALYSIS_RUNS[analysis_id]["updated_at"] = datetime.now().isoformat()

        # Save result artifact
        artifact_path = ARTIFACTS_DIR / f"analysis_{analysis_id}.json"
        with open(artifact_path, "w") as f:
            json.dump(sanitize_for_json(response.model_dump()), f, indent=2)

        save_analysis_registry()

    except Exception as e:
        ANALYSIS_RUNS[analysis_id]["status"] = "failed"
        ANALYSIS_RUNS[analysis_id]["error_message"] = f"Analysis failed: {str(e)}"
        ANALYSIS_RUNS[analysis_id]["updated_at"] = datetime.now().isoformat()
        emit_agent_event(analysis_id, 99, "Supervisor", "failed", f"Analysis stopped due to safe error: {str(e)}", 100)
        save_analysis_registry()

@app.post("/api/analyze", response_model=AnalysisStartResponse)
def start_analysis(req: AnalysisRequest, background_tasks: BackgroundTasks):
    if req.dataset_id not in DATASET_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset with ID '{req.dataset_id}' not found. Please upload a valid dataset first."
        )

    if not req.question or len(req.question.strip()) < 3:
        raise HTTPException(
            status_code=400,
            detail="Analytical question must be a non-empty string of at least 3 characters."
        )

    ds_info = DATASET_REGISTRY[req.dataset_id]
    analysis_id = f"analysis_{str(uuid.uuid4())[:8]}"

    now_iso = datetime.now().isoformat()
    run_entry = {
        "analysis_id": analysis_id,
        "dataset_id": req.dataset_id,
        "dataset_name": ds_info["filename"],
        "question": req.question,
        "analysis_mode": req.analysis_mode or "Quick Insight",
        "status": "queued",
        "progress_percent": 0,
        "current_agent": "Supervisor",
        "current_message": "Analysis request queued",
        "analysis_type": "Analytical Query",
        "quality_status": "HIGH_QUALITY",
        "confidence_score": 0.0,
        "created_at": now_iso,
        "updated_at": now_iso
    }
    ANALYSIS_RUNS[analysis_id] = run_entry
    ANALYSIS_EVENTS[analysis_id] = []
    emit_agent_event(analysis_id, 0, "Supervisor", "waiting", "Analysis request queued for processing", 0)

    # Trigger asynchronous background processing
    background_tasks.add_task(
        execute_background_analysis,
        analysis_id,
        req.dataset_id,
        req.question,
        req.analysis_mode or "Quick Insight"
    )

    save_analysis_registry()

    return AnalysisStartResponse(
        analysis_id=analysis_id,
        status="queued",
        message="Analysis pipeline queued and started.",
        created_at=now_iso
    )

@app.get("/api/analyze/history", response_model=List[AnalysisHistoryItem])
def get_analysis_history():
    history = []
    for aid, item in sorted(ANALYSIS_RUNS.items(), key=lambda x: x[1].get("created_at", ""), reverse=True):
        history.append(AnalysisHistoryItem(
            analysis_id=item["analysis_id"],
            dataset_id=item["dataset_id"],
            dataset_name=item.get("dataset_name", "Dataset"),
            question=item["question"],
            analysis_type=item.get("analysis_type", "Analytical Analysis"),
            quality_status=item.get("quality_status", "HIGH_QUALITY"),
            confidence_score=item.get("confidence_score", 0.0),
            status=item.get("status", "completed"),
            created_at=item.get("created_at", "")
        ))
    return history

@app.get("/api/analyze/{analysis_id}", response_model=AnalysisStatus)
def get_analysis_status(analysis_id: str):
    if analysis_id not in ANALYSIS_RUNS:
        # Check if artifact file exists on disk
        artifact_file = ARTIFACTS_DIR / f"analysis_{analysis_id}.json"
        if artifact_file.exists():
            try:
                with open(artifact_file, "r") as f:
                    res_data = json.load(f)
                    return AnalysisStatus(
                        analysis_id=analysis_id,
                        dataset_id=res_data.get("dataset_id", ""),
                        question=res_data.get("question", ""),
                        status="completed",
                        progress_percent=100,
                        current_agent="Synthesis and Visualization",
                        current_message="Analysis completed and saved.",
                        created_at=res_data.get("created_at", datetime.now().isoformat()),
                        updated_at=res_data.get("created_at", datetime.now().isoformat())
                    )
            except Exception:
                pass
        raise HTTPException(status_code=404, detail=f"Analysis with ID '{analysis_id}' not found.")

    run = ANALYSIS_RUNS[analysis_id]
    return AnalysisStatus(
        analysis_id=analysis_id,
        dataset_id=run["dataset_id"],
        question=run["question"],
        status=run["status"],
        progress_percent=run["progress_percent"],
        current_agent=run["current_agent"],
        current_message=run["current_message"],
        created_at=run["created_at"],
        updated_at=run["updated_at"],
        error_message=run.get("error_message")
    )

@app.get("/api/analyze/{analysis_id}/result", response_model=AnalysisResponse)
def get_analysis_result(analysis_id: str):
    artifact_file = ARTIFACTS_DIR / f"analysis_{analysis_id}.json"
    if not artifact_file.exists():
        if analysis_id in ANALYSIS_RUNS:
            run_status = ANALYSIS_RUNS[analysis_id]["status"]
            if run_status in ["queued", "running"]:
                raise HTTPException(status_code=202, detail="Analysis is still in progress. Please check again shortly.")
            elif run_status == "failed":
                raise HTTPException(status_code=500, detail=ANALYSIS_RUNS[analysis_id].get("error_message", "Analysis execution failed."))
        raise HTTPException(status_code=404, detail=f"Result artifact for analysis '{analysis_id}' not found.")

    try:
        with open(artifact_file, "r") as f:
            data = json.load(f)
            return AnalysisResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read result artifact: {str(e)}")

@app.get("/api/analyze/{analysis_id}/events")
def get_analysis_events(analysis_id: str, poll: bool = Query(False)):
    if analysis_id not in ANALYSIS_RUNS and not (ARTIFACTS_DIR / f"analysis_{analysis_id}.json").exists():
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found.")

    events = ANALYSIS_EVENTS.get(analysis_id, [])

    if poll:
        return events

    async def event_generator():
        sent_indices = set()
        while True:
            current_evts = ANALYSIS_EVENTS.get(analysis_id, [])
            for idx, evt in enumerate(current_evts):
                if idx not in sent_indices:
                    sent_indices.add(idx)
                    yield f"data: {json.dumps(sanitize_for_json(evt))}\n\n"
            
            run_status = ANALYSIS_RUNS.get(analysis_id, {}).get("status")
            if run_status in ["completed", "failed"]:
                # Yield final summary event and close connection
                done_evt = {
                    "analysis_id": analysis_id,
                    "sequence": 999,
                    "agent": "Supervisor",
                    "status": run_status,
                    "safe_message": "Stream completed.",
                    "progress": 100,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                }
                yield f"data: {json.dumps(done_evt)}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/analyze/{analysis_id}/report")
def generate_executive_report(analysis_id: str):
    artifact_file = ARTIFACTS_DIR / f"analysis_{analysis_id}.json"
    if not artifact_file.exists():
        raise HTTPException(status_code=404, detail=f"Analysis report for ID '{analysis_id}' not found.")

    try:
        with open(artifact_file, "r") as f:
            data = json.load(f)

        md_content = f"""# InsightForge AI - Executive Analysis Report

**Analysis ID:** `{data['analysis_id']}`  
**Dataset:** `{data['data_source']}`  
**Strategy Mode:** `{data['analysis_type']}`  
**Verification Confidence:** `{data['confidence_score']}%` (`{data['quality_status']}`)  
**Generated At:** `{data['created_at']}`  

---

## Executive Summary
{data['executive_summary']}

---

## Key Verified Findings
"""
        for finding in data.get('findings', []):
            md_content += f"### {finding['title']}\n"
            md_content += f"{finding['summary']}\n\n"
            md_content += f"**Detailed Explanation:**\n{finding['detailed_explanation']}\n\n"

        md_content += "--- \n\n## Actionable Recommendations\n"
        for rec in data.get('recommendations', []):
            md_content += f"- {rec}\n"

        md_content += "\n--- \n\n## Verified Analytical Assumptions & Limitations\n"
        for asm in data.get('assumptions', []):
            md_content += f"- *Assumption:* {asm}\n"
        for warn in data.get('warnings', []):
            md_content += f"- *Quality Warning:* {warn}\n"

        return StreamingResponse(
            io.BytesIO(md_content.encode('utf-8')),
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=InsightForge_Report_{analysis_id}.md"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate executive report: {str(e)}")

@app.get("/api/datasets/{dataset_id}/alerts")
def get_dataset_alerts(dataset_id: str):
    if dataset_id not in DATASET_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")
    
    profile = DatasetProfile(**DATASET_REGISTRY[dataset_id]["profile"])
    return {
        "dataset_id": dataset_id,
        "filename": profile.filename,
        "quality_score": profile.quality_score,
        "alerts_count": len(profile.warnings),
        "alerts": profile.warnings
    }

