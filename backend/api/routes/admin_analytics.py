from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

from api.deps import get_current_user, require_role
from services.analytics_admin import (
    get_admin_dashboard,
    get_admin_stats,
    get_admin_analytics,
    get_admin_recent_activity,
)

router = APIRouter()


@router.get("/dashboard", summary="Admin dashboard KPI summary")
def dashboard_endpoint(
    current_user=Depends(require_role({"Admin"})),
):
    return get_admin_dashboard(current_user)


@router.get("/stats", summary="Admin statistics")
def stats_endpoint(
    current_user=Depends(require_role({"Admin"})),
):
    return get_admin_stats(current_user)


@router.get("/analytics", summary="Admin analytics")
def analytics_endpoint(
    current_user=Depends(require_role({"Admin"})),
):
    return get_admin_analytics(current_user)


@router.get("/recent-activity", summary="Admin recent activity")
def recent_activity_endpoint(
    current_user=Depends(require_role({"Admin"})),
):
    return get_admin_recent_activity(current_user)

