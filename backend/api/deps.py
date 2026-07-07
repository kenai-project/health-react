import os
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select

from db.session import get_db_session
from db.models import User


# NOTE: we keep deps minimal and stable.


bearer_scheme = HTTPBearer(auto_error=False)


def _get_access_token(credentials: Optional[HTTPAuthorizationCredentials]):
    if not credentials:
        return None
    return credentials.credentials


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
):
    token = _get_access_token(credentials)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")

    # Token verification is implemented in auth dependency module.
    from api.security.jwt import decode_access_token
    from jwt import ExpiredSignatureError

    try:
        payload = decode_access_token(token)
    except ExpiredSignatureError:
        print("===== JWT decode_access_token failed: expired =====")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    user_id = payload.get("sub")


    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

    session = get_db_session()
    try:
        user = session.execute(select(User).where(User.id == int(user_id))).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return {"id": user.id, "username": user.username, "role": user.role}
    finally:
        session.close()


def require_role(required_roles: set[str]):
    async def _checker(user=Depends(get_current_user)):
        if user["role"] not in required_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return _checker

