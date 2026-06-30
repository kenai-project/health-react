import io
from typing import Iterable

import pandas as pd


def export_records_to_excel(records: Iterable[dict] | None) -> bytes:
    """Return Excel file bytes for Streamlit download.

    This endpoint is user-scoped and can legitimately receive an empty list.
    It should not crash on None / non-iterable inputs.
    """
    try:
        if records is None:
            rows = []
        else:
            rows = list(records)

        df = pd.DataFrame(rows)

        buf = io.BytesIO()
        with pd.ExcelWriter(buf, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="records")
        return buf.getvalue()
    except Exception as e:
        # Let FastAPI surface a useful error in logs; client will see 500.
        raise RuntimeError(f"Failed to build Excel export: {e}")


