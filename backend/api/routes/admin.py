from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List

from api.deps import get_current_user, require_role
from services.admin import list_users as svc_list_users, create_user, assign_staff_to_user
from services.staff import list_assigned_users
from services.analytics import get_user_scope_user_ids

router = APIRouter()


class UserCreateRequest(BaseModel):
    username: str
    password: str
    role: str


class AssignStaffRequest(BaseModel):
    staff_id: int
    user_id: int


@router.get("/users", summary="List all users (Admin only)")
def list_users_endpoint(current_user=Depends(require_role({"Admin"}))):
    return svc_list_users()


@router.post("/users", summary="Create user (Admin only)")
def create_user_endpoint(req: UserCreateRequest, current_user=Depends(require_role({"Admin"}))):
    try:
        new_id = create_user(req.username, req.password, req.role)
        return {"id": new_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/assign", summary="Assign staff to a user (Admin only)")
def assign_staff(req: AssignStaffRequest, current_user=Depends(require_role({"Admin"}))):
    assign_staff_to_user(req.staff_id, req.user_id)
    return {"ok": True}


@router.get("/staff/assigned", summary="List users assigned to current staff")
def staff_assigned_endpoint(current_user=Depends(require_role({"Admin", "Staff"}))):
    return list_assigned_users(current_user)

