import numpy as np
import pandas as pd

def squeeze_column(x):
    """
    Ensures text transformers receive a 1D array of strings,
    preventing 0-d or nested array iteration issues.
    """
    if isinstance(x, (pd.DataFrame, pd.Series)):
        return x.values.astype(str).flatten()
    return np.array(x).astype(str).flatten()
