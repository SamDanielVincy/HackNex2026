import uuid
from datetime import datetime
from typing import Dict, Any, List, Tuple
import pandas as pd

from app.schemas.dataset import DatasetProfile
from app.schemas.analysis import AnalysisResponse, AgentProgressStep
from app.agents.profiler_agent import DataProfilerAgent
from app.agents.intent_agent import IntentStrategyAgent
from app.agents.execution_agent import AnalyticalExecutionAgent
from app.agents.verifier_agent import SelfVerificationAgent
from app.agents.critic_agent import CriticAgent
from app.agents.recommendation_agent import RecommendationAgent
from app.agents.synthesis_agent import SynthesisVisualizationAgent
from app.utils.json_helpers import sanitize_for_json

class MultiAgentOrchestrator:
    """
    Multi-Agent Orchestrator: Coordinates DataProfiler, IntentStrategy,
    AnalyticalExecution, SelfVerification, Critic, Recommendation, and Synthesis agents.
    Tracks step-by-step progress with human-readable logs.
    """

    def __init__(self):
        self.profiler_agent = DataProfilerAgent()
        self.intent_agent = IntentStrategyAgent()
        self.execution_agent = AnalyticalExecutionAgent()
        self.verifier_agent = SelfVerificationAgent()
        self.critic_agent = CriticAgent()
        self.recommendation_agent = RecommendationAgent()
        self.synthesis_agent = SynthesisVisualizationAgent()

    def run_pipeline(
        self,
        dataset_id: str,
        file_path: str,
        filename: str,
        question: str,
        existing_profile: DatasetProfile = None,
        analysis_id: str = None
    ) -> AnalysisResponse:
        if not analysis_id:
            analysis_id = f"analysis_{str(uuid.uuid4())[:8]}"

        progress_steps: List[AgentProgressStep] = []

        def record_step(step_id: int, agent: str, title: str, status: str, msg: str):
            progress_steps.append(AgentProgressStep(
                step_id=step_id,
                agent_name=agent,
                title=title,
                status=status,
                message=msg,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))

        # Step 1: Data Ingestion & Schema Alignment
        record_step(1, "Data Ingestion Agent", "Validating & Loading Dataset", "running", f"Loading '{filename}' into memory and DuckDB analytical space...")
        if existing_profile:
            profile = existing_profile
            df = self.profiler_agent.read_dataset(file_path)
        else:
            df, profile = self.profiler_agent.profile_dataset(file_path, filename)
        
        record_step(1, "Data Ingestion Agent", "Dataset Validated", "completed", f"Verified dataset schema with {profile.row_count:,} rows, {profile.column_count} columns, and quality score {profile.quality_score}/100.")

        # Step 2: Intent Analysis & Strategy Formulation
        record_step(2, "Intent & Strategy Agent", "Formulating Analytical Plan", "running", f"Parsing query: '{question}'...")
        intent = self.intent_agent.analyze_intent(question, profile)
        record_step(2, "Intent & Strategy Agent", "Analytical Strategy Selected", "completed", f"Selected execution path '{intent['analysis_type'].replace('_', ' ').title()}' using {intent['primary_engine']} engine.")

        # Step 3: Analytical & Statistical Execution
        record_step(3, "Execution Engine Agent", "Executing Statistical & Database Queries", "running", "Processing features using DuckDB, SciPy/Statsmodels, and Scikit-Learn...")
        exec_results = self.execution_agent.execute_analysis(df, intent)
        record_step(3, "Execution Engine Agent", "Calculations Completed", "completed", "Computed exact summary statistics, metrics, and visualization coordinates.")

        # Step 4: Self-Verification & Critic Audit
        record_step(4, "Self-Verification Agent", "Auditing Results & Confidence", "running", "Cross-verifying statistical assumptions, sample sizes, and quality metrics...")
        verification = self.verifier_agent.verify(profile, intent, exec_results)
        
        # Critic Audit
        critic_audit = self.critic_agent.audit_findings(profile, intent, exec_results, verification)
        if critic_audit.get("critic_warnings"):
            verification["warnings"].extend(critic_audit["critic_warnings"])
            verification["confidence_score"] = max(10.0, verification["confidence_score"] + critic_audit["critic_score_adjustment"])

        record_step(4, "Self-Verification Agent", "Verification Completed", "completed", f"Assigned confidence score {verification['confidence_score']}% with status '{verification['quality_status']}'.")

        # Step 5: Synthesis & Visualization
        record_step(5, "Synthesis & Visualization Agent", "Generating Insights & Plotly Specifications", "running", "Synthesizing executive findings and building interactive visual specifications...")
        synthesis = self.synthesis_agent.synthesize(question, intent, exec_results, verification)
        
        # Recommendation Agent Override
        recs = self.recommendation_agent.generate_recommendations(
            intent["analysis_type"],
            exec_results.get("metrics", {}),
            verification["confidence_score"],
            critic_audit
        )
        synthesis["recommendations"] = recs

        record_step(5, "Synthesis & Visualization Agent", "Insights Successfully Generated", "completed", "Generated human-readable findings, Plotly charts, and actionable recommendations.")

        response = AnalysisResponse(
            analysis_id=analysis_id,
            dataset_id=dataset_id,
            question=question,
            data_source=f"{filename} (Table: {dataset_id})",
            analysis_type=intent["analysis_type"].replace("_", " ").title(),
            quality_status=verification["quality_status"],
            confidence_score=verification["confidence_score"],
            confidence_breakdown=verification["confidence_breakdown"],
            assumptions=verification["assumptions"],
            warnings=verification["warnings"],
            executive_summary=synthesis["executive_summary"],
            findings=synthesis["findings"],
            recommendations=synthesis["recommendations"],
            progress_steps=progress_steps,
            created_at=datetime.now().isoformat()
        )

        return response
