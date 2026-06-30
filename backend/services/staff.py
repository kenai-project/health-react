from sqlalchemy import select

from db.session import get_db_session
from db.models import User, StaffAssignment


def list_assigned_users(staff):
    session = get_db_session()
    try:
        q = (
            select(User)
            .join(StaffAssignment, StaffAssignment.user_id == User.id)
            .where(StaffAssignment.staff_id == staff["id"])
            .order_by(User.username)
        )
        rows = session.execute(q).scalars().all()
        return [{"id": u.id, "username": u.username, "role": u.role} for u in rows]
    finally:
        session.close()


def ensure_staff_assignment(staff_id: int, user_id: int):
    session = get_db_session()
    try:
        existing = session.execute(
            select(StaffAssignment).where(StaffAssignment.staff_id == staff_id, StaffAssignment.user_id == user_id)
        ).scalar_one_or_none()
        if existing:
            return
        session.add(StaffAssignment(staff_id=staff_id, user_id=user_id))
        session.commit()
    finally:
        session.close()

