from sqlalchemy import select

from db.session import get_db_session
from db.models import User, StaffAssignment
from services.auth_utils import ensure_valid_role


def list_users():
    session = get_db_session()
    try:
        rows = session.execute(select(User).order_by(User.role, User.username)).scalars().all()
        return [{"id": u.id, "username": u.username, "role": u.role} for u in rows]
    finally:
        session.close()


def create_user(username: str, password: str, role: str):
    from auth.auth_service import hash_password

    session = get_db_session()
    try:
        if not username or not password:
            raise ValueError("Username/password required")
        ensure_valid_role(role)

        existing = session.execute(select(User).where(User.username == username)).scalar_one_or_none()
        if existing:
            raise ValueError("Username already exists")

        user = User(username=username, password_hash=hash_password(password), role=role)
        session.add(user)
        session.commit()
        return user.id
    finally:
        session.close()


def assign_staff_to_user(staff_id: int, user_id: int):
    session = get_db_session()
    try:
        sa = StaffAssignment(staff_id=staff_id, user_id=user_id)
        session.add(sa)
        session.commit()
    finally:
        session.close()

