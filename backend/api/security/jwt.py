import os
from datetime import datetime, timedelta, timezone

import jwt


JWT_SECRET = os.environ.get("JWT_SECRET", "dev-change-me")
JWT_ALG = os.environ.get("JWT_ALG", "HS256")
ACCESS_TOKEN_TTL_MIN = int(os.environ.get("ACCESS_TOKEN_TTL_MIN", "15"))
REFRESH_TOKEN_TTL_DAYS = int(os.environ.get("REFRESH_TOKEN_TTL_DAYS", "30"))



def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(*, user_id: int) -> str:
    now = _utcnow()
    exp_dt = now + timedelta(minutes=ACCESS_TOKEN_TTL_MIN)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(exp_dt.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)




def create_refresh_token(*, user_id: int) -> str:
    now = _utcnow()
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=REFRESH_TOKEN_TTL_DAYS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Not an access token")
    return payload




def decode_refresh_token(token: str) -> dict:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Not a refresh token")
    return payload

