from typing import Dict, Any, List
from app.schemas.dataset import DatasetProfile

class CriticAgent:
    """
    Critic Agent: Evaluates computed statistical metrics and findings for logical
    consistency, sample bias, extreme variance, and domain sanity.
    Applies critical auditing rules to prevent hallucinated or flawed insights.
    """

    def audit_findings(
        self,
        profile: DatasetProfile,
        intent: Dict[str, Any],
        exec_results: Dict[str, Any],
        verification: Dict[str, Any]
    ) -> Dict[str, Any]:
        metrics = exec_results.get("metrics", {})
        stat_summary = exec_results.get("statistical_summary")
        conf_score = verification.get("confidence_score", 80.0)

        critic_warnings: List[str] = []
        is_logically_sound = True

        # Rule 1: Check sample size vs feature count
        if profile.row_count < 15 and intent.get("analysis_type") in ["PREDICTIVE_MODELING", "SEGMENTATION"]:
            critic_warnings.append("Sample size (N < 15) is insufficient for high-dimensional machine learning modeling.")
            is_logically_sound = False

        # Rule 2: Audit Pearson Correlation extremes
        if stat_summary and stat_summary.get("test_name") == "Pearson Correlation Test":
            r_val = stat_summary.get("statistic_value", 0.0)
            if abs(r_val) > 0.99:
                critic_warnings.append("Near-perfect correlation (|r| > 0.99) detected. Verify variables are not mathematical identity derivatives or duplicate features.")

        # Rule 3: Audit Outlier Ratio
        total_outliers = sum(c.outliers_count or 0 for c in profile.columns)
        if profile.row_count > 0 and (total_outliers / profile.row_count) > 0.15:
            critic_warnings.append("High outlier ratio (> 15% of dataset) detected across continuous variables. Analytical aggregation means may be distorted by extreme tails.")

        return {
            "is_logically_sound": is_logically_sound,
            "critic_warnings": critic_warnings,
            "critic_score_adjustment": -10.0 if not is_logically_sound else 0.0
        }
