from db.models import User
from auth.auth_service import hash_password
from sqlalchemy import select


def bootstrap_admin_if_needed(get_db_session):
    session = get_db_session()
    try:
        stmt = select(User).where(User.username == "admin")
        if session.execute(stmt).scalar_one_or_none() is None:
            admin = User(
                username="admin",
                password_hash=hash_password("admin123"),
                role="Admin",
            )
            session.add(admin)
            session.commit()
    finally:
        session.close()

