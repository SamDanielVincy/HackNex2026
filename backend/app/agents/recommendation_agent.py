from typing import Dict, Any, List

class RecommendationAgent:
    """
    Recommendation Agent: Formulates domain-specific strategic, operational,
    and data governance recommendations based on verified findings and critic audits.
    """

    def generate_recommendations(
        self,
        analysis_type: str,
        metrics: Dict[str, Any],
        confidence_score: float,
        critic_audit: Dict[str, Any]
    ) -> List[str]:
        recommendations: List[str] = []

        # 1. Actionable Operational Recommendations
        if analysis_type == "AGGREGATION_BREAKDOWN":
            top_group = metrics.get("top_group")
            if top_group:
                recommendations.append(f"Operational Action: Prioritize inventory and sales support for top revenue driver '{top_group}'.")
        elif analysis_type == "CORRELATION_HYPOTHESIS":
            if metrics.get("is_significant"):
                recommendations.append(f"Strategic Action: Capitalize on the statistically verified driver relationship between {metrics.get('var1')} and {metrics.get('var2')}.")
        elif analysis_type == "ANOMALY_DETECTION":
            anom_cnt = metrics.get("anomalies_detected", 0)
            if anom_cnt > 0:
                recommendations.append(f"Risk Action: Trigger automated compliance audit on the {anom_cnt} flagged anomaly records.")
        elif analysis_type == "PREDICTIVE_MODELING":
            r2 = metrics.get("r2_score", 0.0)
            if r2 > 0.4:
                recommendations.append(f"Predictive Action: Utilize regression equation weights for quarterly target metric forecasting (Model R² = {r2}).")

        # 2. Data Governance Recommendations
        if confidence_score < 80.0:
            recommendations.append("Data Governance: Expand sample data collection to reduce sampling variance and elevate confidence above 85%.")

        # 3. Critic-driven Recommendations
        if critic_audit.get("critic_warnings"):
            recommendations.append("Audit Recommendation: Address high outlier skew and duplicate columns identified by the Critic Agent.")

        if not recommendations:
            recommendations.append("General Action: Continue periodic distribution monitoring across target metrics.")

        return recommendations
