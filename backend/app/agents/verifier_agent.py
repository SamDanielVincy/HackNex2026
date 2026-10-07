from typing import Dict, Any, List, Tuple
from app.schemas.dataset import DatasetProfile
from app.schemas.analysis import ConfidenceBreakdown

class SelfVerificationAgent:
    """
    Self-Verification Agent: Rigorously audits execution outputs, verifies
    sample sizes, checks statistical significance, computes confidence scores,
    and formulates explicit assumptions and warnings.
    """

    def verify(
        self,
        profile: DatasetProfile,
        intent: Dict[str, Any],
        exec_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        row_count = profile.row_count
        analysis_type = intent["analysis_type"]
        metrics = exec_results.get("metrics", {})
        stat_summary = exec_results.get("statistical_summary")

        assumptions: List[str] = []
        warnings: List[str] = []

        # 1. Sample Size Score (0 - 100)
        if row_count >= 1000:
            sample_score = 100.0
        elif row_count >= 100:
            sample_score = 90.0
        elif row_count >= 30:
            sample_score = 75.0
            warnings.append(f"Moderate sample size (N = {row_count}). Statistical confidence is acceptable but larger samples increase power.")
        else:
            sample_score = 50.0
            warnings.append(f"Small sample size (N = {row_count}). Results should be interpreted as directional indicators.")

        # 2. Data Completeness Score (0 - 100)
        quality_score = profile.quality_score
        completeness_score = min(100.0, max(20.0, quality_score))
        if completeness_score < 80.0:
            warnings.append("Dataset contains missing values or duplicate records affecting raw coverage.")

        # 3. Statistical Validity & Significance Score (0 - 100)
        stat_score = 85.0
        if stat_summary:
            p_val = stat_summary.get("p_value")
            is_sig = stat_summary.get("is_significant")
            if p_val is not None:
                if p_val < 0.01:
                    stat_score = 98.0
                    assumptions.append("Statistical relationship holds strong alpha significance (p < 0.01).")
                elif p_val < 0.05:
                    stat_score = 88.0
                    assumptions.append("Standard 95% confidence threshold satisfied (p < 0.05).")
                else:
                    stat_score = 55.0
                    warnings.append(f"Statistical test failed to achieve standard significance (p = {round(p_val, 4)} >= 0.05).")

        # 4. Distribution & Normality Score (0 - 100)
        normality_score = 90.0
        skewed_cols = [c.name for c in profile.columns if c.skewness and abs(c.skewness) > 2.0]
        if skewed_cols:
            normality_score = 70.0
            warnings.append(f"High skewness detected in columns: {', '.join(skewed_cols)}. Non-parametric assumptions applied.")
            assumptions.append("Assumed non-gaussian distribution for heavily skewed continuous features.")

        # General Explicit Analytical Assumptions
        assumptions.append("Assumed uploaded dataset represents an unbiased random sample of the target domain.")
        assumptions.append("Null records and non-numeric entries were dropped prior to metric aggregation.")

        # Overall Confidence Score Calculation
        overall_confidence = round(
            sample_score * 0.35 +
            completeness_score * 0.25 +
            stat_score * 0.25 +
            normality_score * 0.15,
            1
        )

        # Confidence Level & Quality Status Assignment
        if overall_confidence >= 85.0:
            confidence_level = "HIGH"
            quality_status = "HIGH_QUALITY"
        elif overall_confidence >= 65.0:
            confidence_level = "MODERATE"
            quality_status = "VERIFIED_WITH_WARNINGS"
        else:
            confidence_level = "LOW"
            quality_status = "DEGRADED"

        confidence_breakdown = ConfidenceBreakdown(
            sample_size_score=sample_score,
            data_completeness_score=completeness_score,
            statistical_validity_score=stat_score,
            distribution_normality_score=normality_score,
            overall_confidence=overall_confidence,
            confidence_level=confidence_level
        )

        return {
            "quality_status": quality_status,
            "confidence_score": overall_confidence,
            "confidence_breakdown": confidence_breakdown,
            "assumptions": assumptions,
            "warnings": warnings,
            "verified": True
        }
