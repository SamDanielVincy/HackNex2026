import math
import numpy as np
import pandas as pd
from typing import Any

def sanitize_for_json(obj: Any) -> Any:
    """
    Recursively converts numpy, pandas, NaN, Infinity, and datetime types
    into standard JSON-serializable Python data structures.
    """
    if obj is None:
        return None

    # Check bool before int, as bool is a subclass of int in Python
    if isinstance(obj, (bool, np.bool_)):
        return bool(obj)

    if isinstance(obj, (float, np.floating)):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return float(obj)

    if isinstance(obj, (int, np.integer)):
        return int(obj)

    if isinstance(obj, (np.ndarray, list, tuple)):
        return [sanitize_for_json(item) for item in obj]

    if isinstance(obj, dict):
        return {str(k): sanitize_for_json(v) for k, v in obj.items()}

    if isinstance(obj, pd.DataFrame):
        return sanitize_for_json(obj.to_dict(orient="records"))

    if isinstance(obj, pd.Series):
        return sanitize_for_json(obj.to_dict())

    if isinstance(obj, (pd.Timestamp, np.datetime64)):
        return str(obj)

    try:
        if pd.isna(obj):
            return None
    except Exception:
        pass

    return str(obj) if not isinstance(obj, (str, int, float, bool, list, dict)) else obj
