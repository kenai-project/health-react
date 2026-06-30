import bcrypt
from sqlalchemy import select

from db.models import User


def hash_password(plain: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), password_hash.encode("utf-8"))


def authenticate_user(get_db_session, username: str, password: str):
    session = get_db_session()
    try:
        stmt = select(User).where(User.username == username)
        user = session.execute(stmt).scalar_one_or_none()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        # minimal session payload
        return {"id": user.id, "username": user.username, "role": user.role}
    finally:
        session.close()

