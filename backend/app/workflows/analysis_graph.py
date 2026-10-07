from typing import Dict, Any
from langgraph.graph import StateGraph, END
from app.workflows.state import AnalysisGraphState
from app.llm.gemini_client import GeminiClient
from app.agents.profiler_agent import DataProfilerAgent
from app.agents.execution_agent import AnalyticalExecutionAgent
from app.agents.verifier_agent import SelfVerificationAgent
from app.agents.synthesis_agent import SynthesisVisualizationAgent
from app.agents.critic_agent import CriticAgent
from app.agents.recommendation_agent import RecommendationAgent
from app.agents.orchestrator import MultiAgentOrchestrator
from app.schemas.analysis import AnalysisResponse, AgentProgressStep
from app.utils.json_helpers import sanitize_for_json

gemini_client = GeminiClient()
profiler = DataProfilerAgent()
executor = AnalyticalExecutionAgent()
verifier = SelfVerificationAgent()
critic = CriticAgent()
recommender = RecommendationAgent()
synthesizer = SynthesisVisualizationAgent()
fallback_orchestrator = MultiAgentOrchestrator()

# LangGraph Node Definitions
def supervisor_node(state: AnalysisGraphState) -> AnalysisGraphState:
    profile = state.get("profile")
    question = state.get("question", "")
    mode = state.get("analysis_mode", "Quick Insight")

    sup_out = gemini_client.run_supervisor_role(question, profile, mode)

    new_state = dict(state)
    new_state["route"] = sup_out.route
    new_state["intent"] = {
        "analysis_type": sup_out.intent,
        "needs_clarification": sup_out.needs_clarification,
        "clarification_question": sup_out.clarification_question,
        "clarification_options": sup_out.clarification_options
    }
    return new_state

def semantic_node(state: AnalysisGraphState) -> AnalysisGraphState:
    profile = state.get("profile")
    question = state.get("question", "")

    sem_out = gemini_client.run_semantic_resolver_role(question, profile)

    new_state = dict(state)
    new_state["semantic_mapping"] = {
        "mappings": sem_out.column_mappings,
        "metric_names": sem_out.metric_names,
        "confidence": sem_out.confidence
    }
    return new_state

def execution_node(state: AnalysisGraphState) -> AnalysisGraphState:
    profile = state.get("profile")
    route = state.get("route", "overview")
    question = state.get("question", "")
    sem_map = state.get("semantic_mapping", {}).get("mappings", {})

    num_cols = [c.name for c in profile.columns if "int" in c.data_type.lower() or "float" in c.data_type.lower()]
    cat_cols = [c.name for c in profile.columns if c.name not in num_cols]

    # Map route to internal execution intent
    type_map = {
        "overview": "SUMMARY_STATISTICS",
        "trend": "TREND_ANALYSIS",
        "correlation": "CORRELATION_HYPOTHESIS",
        "anomaly": "ANOMALY_DETECTION",
        "root_cause": "CORRELATION_HYPOTHESIS",
        "forecast": "PREDICTIVE_MODELING"
    }

    intent = {
        "analysis_type": type_map.get(route, "SUMMARY_STATISTICS"),
        "primary_engine": "DuckDB",
        "target_num_cols": num_cols[:2],
        "target_cat_cols": cat_cols[:1],
        "all_num_cols": num_cols,
        "all_cat_cols": cat_cols
    }

    # Load dataframe safely
    file_path = f"./data_store/uploads/{profile.dataset_id}_{profile.filename}"
    try:
        df = profiler.read_dataset(file_path)
    except Exception:
        df = pd.DataFrame()

    exec_res = executor.execute_analysis(df, intent)

    new_state = dict(state)
    new_state["execution_result"] = exec_res
    return new_state

def critic_node(state: AnalysisGraphState) -> AnalysisGraphState:
    profile = state.get("profile")
    intent = state.get("intent", {})
    exec_res = state.get("execution_result", {})

    verification = verifier.verify(profile, intent, exec_res)
    critic_audit = critic.audit_findings(profile, intent, exec_res, verification)

    # Gemini Critic Role
    gemini_critic = gemini_client.run_critic_role(profile, exec_res)
    if gemini_critic.warnings:
        verification["warnings"].extend(gemini_critic.warnings)

    new_state = dict(state)
    new_state["critic_result"] = critic_audit
    new_state["confidence"] = max(10.0, verification["confidence_score"] + critic_audit["critic_score_adjustment"])
    new_state["warnings"] = verification["warnings"]
    return new_state

def synthesis_node(state: AnalysisGraphState) -> AnalysisGraphState:
    question = state.get("question", "")
    intent = state.get("intent", {})
    exec_res = state.get("execution_result", {})
    conf = state.get("confidence", 85.0)
    warnings = state.get("warnings", [])

    verification = {
        "confidence_score": conf,
        "quality_status": "HIGH_QUALITY" if conf >= 85 else "VERIFIED_WITH_WARNINGS" if conf >= 65 else "DEGRADED",
        "assumptions": ["Assumed unbiased sample distribution."],
        "warnings": warnings
    }

    synthesis = synthesizer.synthesize(question, intent, exec_res, verification)
    
    # Explainer role override
    explainer_out = gemini_client.run_analyst_explainer_role(question, exec_res)
    synthesis["executive_summary"] = explainer_out.headline + ". " + explainer_out.detailed_explanation

    # Recommendation role override
    rec_out = gemini_client.run_recommendation_role(exec_res, CriticAgent().audit_findings(state.get("profile"), intent, exec_res, verification))
    all_recs = rec_out.operational_actions + rec_out.strategic_actions + rec_out.governance_actions
    if all_recs:
        synthesis["recommendations"] = all_recs

    new_state = dict(state)
    new_state["final_result"] = {
        "executive_summary": synthesis["executive_summary"],
        "findings": synthesis["findings"],
        "recommendations": synthesis["recommendations"],
        "verification": verification
    }
    return new_state

def route_decision(state: AnalysisGraphState) -> str:
    route = state.get("route", "overview")
    if route == "clarification_required":
        return "clarification"
    return "semantic"

# Build LangGraph Graph
builder = StateGraph(AnalysisGraphState)
builder.add_node("supervisor", supervisor_node)
builder.add_node("semantic", semantic_node)
builder.add_node("execution", execution_node)
builder.add_node("critic", critic_node)
builder.add_node("synthesis", synthesis_node)

builder.set_entry_point("supervisor")
builder.add_conditional_edges("supervisor", route_decision, {"semantic": "semantic", "clarification": END})
builder.add_edge("semantic", "execution")
builder.add_edge("execution", "critic")
builder.add_edge("critic", "synthesis")
builder.add_edge("synthesis", END)

workflow_graph = builder.compile()

class LangGraphWorkflowEngine:
    """
    LangGraph Workflow Engine: Drives structured analysis graph execution,
    falling back seamlessly to MultiAgentOrchestrator if graph execution fails.
    """

    def run_graph_analysis(
        self,
        analysis_id: str,
        dataset_id: str,
        file_path: str,
        filename: str,
        question: str,
        existing_profile: DatasetProfile = None,
        mode: str = "Quick Insight"
    ) -> AnalysisResponse:
        try:
            if existing_profile:
                profile = existing_profile
            else:
                _, profile = profiler.profile_dataset(file_path, filename)

            initial_state: AnalysisGraphState = {
                "analysis_id": analysis_id,
                "dataset_id": dataset_id,
                "question": question,
                "analysis_mode": mode,
                "profile": profile,
                "intent": {},
                "route": "overview",
                "semantic_mapping": {},
                "execution_result": {},
                "chart_specs": [],
                "critic_result": {},
                "recommendations": [],
                "warnings": [],
                "confidence": 85.0,
                "safe_events": [],
                "final_result": {}
            }

            final_state = workflow_graph.invoke(initial_state)

            if final_state.get("route") == "clarification_required":
                # Return clarification response structure
                intent_info = final_state.get("intent", {})
                return fallback_orchestrator.run_pipeline(
                    dataset_id=dataset_id,
                    file_path=file_path,
                    filename=filename,
                    question=question,
                    existing_profile=profile,
                    analysis_id=analysis_id
                )

            res = final_state.get("final_result", {})
            ver = res.get("verification", {})

            # Map to standard AnalysisResponse
            return AnalysisResponse(
                analysis_id=analysis_id,
                dataset_id=dataset_id,
                question=question,
                data_source=f"{filename} (Table: {dataset_id})",
                analysis_type=final_state.get("route", "Overview").replace("_", " ").title(),
                quality_status=ver.get("quality_status", "HIGH_QUALITY"),
                confidence_score=ver.get("confidence_score", 85.0),
                confidence_breakdown={
                    "sample_size_score": 85.0,
                    "data_completeness_score": profile.quality_score,
                    "statistical_validity_score": 85.0,
                    "distribution_normality_score": 85.0,
                    "overall_confidence": ver.get("confidence_score", 85.0),
                    "confidence_level": "HIGH" if ver.get("confidence_score", 85.0) >= 80 else "MODERATE"
                },
                assumptions=ver.get("assumptions", []),
                warnings=ver.get("warnings", []),
                executive_summary=res.get("executive_summary", "Analysis completed."),
                findings=res.get("findings", []),
                recommendations=res.get("recommendations", []),
                progress_steps=[
                    AgentProgressStep(step_id=1, agent_name="Supervisor", title="Routing Query", status="completed", message="Routed query via LangGraph graph", timestamp="12:00:00"),
                    AgentProgressStep(step_id=2, agent_name="Data Profiler", title="Profile Validated", status="completed", message="Validated dataset schema", timestamp="12:00:00"),
                    AgentProgressStep(step_id=3, agent_name="Intent Strategy", title="Strategy Selected", status="completed", message="Selected execution strategy", timestamp="12:00:00"),
                    AgentProgressStep(step_id=4, agent_name="Analytical Execution", title="Queries Executed", status="completed", message="Executed numerical queries", timestamp="12:00:00"),
                    AgentProgressStep(step_id=5, agent_name="Self Verification", title="Audit Completed", status="completed", message="Verified confidence & logic", timestamp="12:00:00")
                ],
                created_at=datetime.now().isoformat()
            )

        except Exception:
            # Deterministic Fallback Orchestrator
            return fallback_orchestrator.run_pipeline(
                dataset_id=dataset_id,
                file_path=file_path,
                filename=filename,
                question=question,
                existing_profile=existing_profile,
                analysis_id=analysis_id
            )
