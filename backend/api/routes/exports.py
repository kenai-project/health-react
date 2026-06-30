from typing import Optional

import csv
import io

from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.deps import get_current_user, require_role
from services.records import list_records
from services.exports import export_records_to_excel

router = APIRouter()


@router.get("/records.csv", summary="Export records as CSV for current user's scope")
def export_records_csv_endpoint(
    search: str = Query(default="", description="Search in food/exercise"),
    from_date: Optional[str] = Query(default=None),
    to_date: Optional[str] = Query(default=None),
    sort: str = Query(default="record_date desc"),
    current_user=Depends(get_current_user),
):
    # list_records will apply scope internally via analytics.get_user_scope_user_ids
    from services.analytics import get_user_scope_user_ids

    user_ids = get_user_scope_user_ids(current_user)
    records = list_records(lambda: user_ids, search=search, sort=sort, filters={"from_date": from_date, "to_date": to_date})

    buf = io.StringIO()
    writer = csv.writer(buf)
    # stable header (subset of record fields)
    header = [
        "id",
        "record_date",
        "height_cm",
        "weight_kg",
        "bmi",
        "food",
        "calories",
        "water_liters",
        "sleep_hours",
        "exercise",
    ]
    writer.writerow(header)
    for r in records:
        writer.writerow([
            r.get("id"),
            r.get("record_date"),
            r.get("height_cm"),
            r.get("weight_kg"),
            r.get("bmi"),
            r.get("food"),
            r.get("calories"),
            r.get("water_liters"),
            r.get("sleep_hours"),
            r.get("exercise"),
        ])

    data = buf.getvalue().encode("utf-8")
    return StreamingResponse(
        io.BytesIO(data),
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="records.csv"'
        },
    )


@router.get("/records.xlsx", summary="Export records as Excel for current user's scope")
def export_records_xlsx_endpoint(
    search: str = Query(default="", description="Search in food/exercise"),
    from_date: Optional[str] = Query(default=None),
    to_date: Optional[str] = Query(default=None),
    sort: str = Query(default="record_date desc"),
    current_user=Depends(get_current_user),
):
    from services.analytics import get_user_scope_user_ids

    user_ids = get_user_scope_user_ids(current_user)
    records = list_records(lambda: user_ids, search=search, sort=sort, filters={"from_date": from_date, "to_date": to_date})

    xlsx_bytes = export_records_to_excel(records)
    return StreamingResponse(
        io.BytesIO(xlsx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="records.xlsx"'
        },
    )

