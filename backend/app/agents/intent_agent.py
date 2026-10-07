import re
from typing import Dict, Any, List
from app.schemas.dataset import DatasetProfile

class IntentStrategyAgent:
    """
    Query Intent & Strategy Agent: Includes semantic synonym layer for mapping
    business concepts to columns and classifies natural language analytical questions.
    """

    SYNONYMS = {
        "revenue": ["sales", "turnover", "income", "amount", "price", "revenue"],
        "expenses": ["cost", "costs", "spend", "budget", "expenditure", "expenses"],
        "profit": ["margin", "net_income", "earnings", "profit", "gain"],
        "customer": ["client", "user", "purchaser", "buyer", "customer"],
        "rating": ["satisfaction", "score", "feedback", "rating"]
    }

    def analyze_intent(self, question: str, profile: DatasetProfile) -> Dict[str, Any]:
        q_lower = question.lower()
        num_cols = [c.name for c in profile.columns if "int" in c.data_type.lower() or "float" in c.data_type.lower()]
        cat_cols = [c.name for c in profile.columns if c.name not in num_cols]

        # Semantic column matching
        target_num_cols = [col for col in num_cols if col.lower() in q_lower]
        target_cat_cols = [col for col in cat_cols if col.lower() in q_lower]

        # Apply semantic synonym dictionary if exact column name not found in text
        if not target_num_cols:
            for term, syns in self.SYNONYMS.items():
                if any(syn in q_lower for syn in syns):
                    matched = [c for c in num_cols if any(syn in c.lower() for syn in syns)]
                    if matched:
                        target_num_cols.extend(matched)
                        break

        # Default fallback
        if not target_num_cols and num_cols:
            target_num_cols = [num_cols[0]]
        if not target_cat_cols and cat_cols:
            target_cat_cols = [cat_cols[0]]

        analysis_type = "SUMMARY_STATISTICS"
        primary_engine = "DuckDB"

        # Classification of Question Intent
        if any(k in q_lower for k in ["predict", "forecast", "classify", "model", "future", "estimate"]):
            analysis_type = "PREDICTIVE_MODELING"
            primary_engine = "Scikit-Learn"
        elif any(k in q_lower for k in ["anomaly", "anomalies", "outlier", "outliers", "unusual", "deviate"]):
            analysis_type = "ANOMALY_DETECTION"
            primary_engine = "Scikit-Learn"
        elif any(k in q_lower for k in ["cluster", "group", "segment", "segmentation", "cohort"]):
            analysis_type = "SEGMENTATION"
            primary_engine = "Scikit-Learn"
        elif any(k in q_lower for k in ["correlate", "correlation", "relationship", "depend", "hypothesis", "significance", "difference"]):
            analysis_type = "CORRELATION_HYPOTHESIS"
            primary_engine = "SciPy_Statsmodels"
        elif any(k in q_lower for k in ["trend", "time", "date", "over time", "monthly", "yearly", "growth", "change"]):
            analysis_type = "TREND_ANALYSIS"
            primary_engine = "DuckDB_Pandas"
        elif any(k in q_lower for k in ["top", "bottom", "average", "mean", "sum", "total", "count", "highest", "lowest", "by"]):
            analysis_type = "AGGREGATION_BREAKDOWN"
            primary_engine = "DuckDB"

        return {
            "question": question,
            "analysis_type": analysis_type,
            "primary_engine": primary_engine,
            "target_num_cols": target_num_cols,
            "target_cat_cols": target_cat_cols,
            "all_num_cols": num_cols,
            "all_cat_cols": cat_cols,
            "has_sufficient_numeric": len(num_cols) > 0,
            "has_sufficient_categorical": len(cat_cols) > 0
        }
