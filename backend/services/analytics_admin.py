from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select

from db.session import get_db_session
from db.models import HealthRecord, StaffAssignment, User


def _parse_record_date(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    try:
        # stored as ISO string: YYYY-MM-DD
        d = datetime.fromisoformat(value)
        return d.strftime("%Y-%m")
    except Exception:
        # fallback: keep original (may already be YYYY-MM-DD)
        return None


def get_admin_dashboard(current_user: dict) -> Dict[str, Any]:
    session = get_db_session()
    try:
        total_users = session.scalar(select(func.count()).select_from(User))
        total_staff = session.scalar(
            select(func.count()).select_from(User).where(User.role == "Staff")
        )
        total_records = session.scalar(select(func.count()).select_from(HealthRecord))

        active_users = session.scalar(
            select(func.count()).select_from(HealthRecord).distinct().where(HealthRecord.user_id != None)
        )

        return {
            "kpis": {
                "total_users": int(total_users or 0),
                "total_staff": int(total_staff or 0),
                "total_records": int(total_records or 0),
                "active_users": int(active_users or 0),
            }
        }
    finally:
        session.close()


def get_admin_stats(current_user: dict) -> Dict[str, Any]:
    session = get_db_session()
    try:
        # Users by role
        users_by_role_rows = session.execute(
            select(User.role, func.count()).group_by(User.role)
        ).all()
        users_by_role = {role: int(cnt) for role, cnt in users_by_role_rows}

        # Staff assignments counts
        assignments_cnt = session.scalar(select(func.count()).select_from(StaffAssignment))

        # Records by month
        monthly_rows = session.execute(
            select(func.substr(HealthRecord.record_date, 1, 7), func.count())
            .group_by(func.substr(HealthRecord.record_date, 1, 7))
            .order_by(func.substr(HealthRecord.record_date, 1, 7).asc())
        ).all()
        records_by_month = [{"month": m, "count": int(c)} for m, c in monthly_rows if m]

        return {
            "users_by_role": users_by_role,
            "staff_assignments": int(assignments_cnt or 0),
            "records_by_month": records_by_month,
        }
    finally:
        session.close()


def get_admin_analytics(current_user: dict) -> Dict[str, Any]:
    session = get_db_session()
    try:
        # User growth: number of distinct users with records per month
        monthly_distinct_user_rows = session.execute(
            select(
                func.substr(HealthRecord.record_date, 1, 7).label("month"),
                func.count(func.distinct(HealthRecord.user_id)).label("active_users"),
            )
            .group_by(func.substr(HealthRecord.record_date, 1, 7))
            .order_by(func.substr(HealthRecord.record_date, 1, 7).asc())
        ).all()

        user_growth = [
            {"month": month, "active_users": int(cnt)}
            for month, cnt in monthly_distinct_user_rows
            if month
        ]

        # Record creation trend: records count per month
        monthly_records_rows = session.execute(
            select(
                func.substr(HealthRecord.record_date, 1, 7).label("month"),
                func.count().label("records"),
            )
            .group_by(func.substr(HealthRecord.record_date, 1, 7))
            .order_by(func.substr(HealthRecord.record_date, 1, 7).asc())
        ).all()

        record_trends = [
            {"month": month, "records": int(cnt)}
            for month, cnt in monthly_records_rows
            if month
        ]

        # Staff activity: count assignments of staff to users with records (staff sees their user base)
        # We interpret "activity" as number of distinct users in each staff assignment that have records.
        staff_rows = session.execute(
            select(
                StaffAssignment.staff_id,
                func.count(func.distinct(StaffAssignment.user_id)).label("managed_users"),
            )
            .join(User, User.id == StaffAssignment.user_id)
            .join(HealthRecord, HealthRecord.user_id == StaffAssignment.user_id)
            .group_by(StaffAssignment.staff_id)
            .order_by(func.count(func.distinct(StaffAssignment.user_id)).desc())
        ).all()

        staff_activity = [
            {"staff_id": int(staff_id), "managed_users": int(cnt)}
            for staff_id, cnt in staff_rows
        ]

        return {
            "user_growth": user_growth,
            "record_trends": record_trends,
            "staff_activity": staff_activity,
        }
    finally:
        session.close()


def get_admin_recent_activity(current_user: dict) -> List[Dict[str, Any]]:
    session = get_db_session()
    try:
        # Recent records: latest 10 records with associated user
        rows = session.execute(
            select(
                HealthRecord.id,
                HealthRecord.record_date,
                HealthRecord.user_id,
                HealthRecord.weight_kg,
                HealthRecord.bmi,
                User.username,
                User.role,
            )
            .join(User, User.id == HealthRecord.user_id)
            .order_by(HealthRecord.record_date.desc())
            .limit(10)
        ).all()

        return [
            {
                "record_id": int(r.id),
                "record_date": r.record_date,
                "user_id": int(r.user_id),
                "username": r.username,
                "role": r.role,
                "weight_kg": r.weight_kg,
                "bmi": r.bmi,
            }
            for r in rows
        ]
    finally:
        session.close()

