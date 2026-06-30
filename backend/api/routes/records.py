from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel

from services.records import list_records, create_record_from_form

from api.deps import get_current_user

router = APIRouter()


class RecordCreateRequest(BaseModel):
    record_date: str
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    food: Optional[str] = None
    calories: Optional[float] = None
    water_liters: Optional[float] = None
    sleep_hours: Optional[float] = None
    exercise: Optional[str] = None
    target_user_id: Optional[int] = None


@router.get("/", summary="List records in current user's scope")
def list_records_endpoint(
    search: str = Query(default="", description="Search in food/exercise"),
    from_date: Optional[str] = Query(default=None),
    to_date: Optional[str] = Query(default=None),
    sort: str = Query(default="record_date desc"),
    current_user=Depends(get_current_user),
):
    # Scope handled inside services/records.py through user_ids.
    from services.analytics import get_user_scope_user_ids

    user_ids = get_user_scope_user_ids(current_user)
    return list_records(user_ids, search=search, sort=sort, filters={"from_date": from_date, "to_date": to_date})


@router.post("/", summary="Create record")
def create_record(req: RecordCreateRequest, current_user=Depends(get_current_user)):
    if req.target_user_id is None:
        target_user_id = current_user["id"]
    else:
        # basic role validation
        if current_user["role"] == "User":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        target_user_id = req.target_user_id

    rec = {
        "record_date": req.record_date,
        "height_cm": req.height_cm,
        "weight_kg": req.weight_kg,
        "food": req.food,
        "calories": req.calories,
        "water_liters": req.water_liters,
        "sleep_hours": req.sleep_hours,
        "exercise": req.exercise,
        "target_user_id": target_user_id,
        "created_by_user_id": current_user["id"],
    }
    new_id = create_record_from_form(rec)
    return {"id": new_id}

