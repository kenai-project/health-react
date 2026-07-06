from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from db.session import get_db_session
from auth.auth_service import authenticate_user, hash_password

from api.security.jwt import create_access_token, create_refresh_token, decode_refresh_token

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register", tags=["auth"]) 
def register(req: RegisterRequest):
    username = (req.username or "").strip()

    password = req.password or ""

    if not username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is required")
    if not password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password is required")
    if len(password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")

    session = get_db_session()
    try:
        # Prevent duplicates
        from db.models import User
        existing = session.execute(__import__("sqlalchemy").select(User).where(User.username == username)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

        # Default role for self-registered users
        user = User(username=username, password_hash=hash_password(password), role="User")
        session.add(user)
        session.commit()
        return {"id": user.id, "ok": True}
    finally:
        session.close()







@router.post("/login", response_model=TokenResponse)

def login(req: LoginRequest):
    import os
    from db.session import DB_PATH, engine
    from auth.auth_service import verify_password
    from db.session import get_db_session as _get_db_session
    from db.models import User
    from sqlalchemy import select

    print("===== POST /auth/login Request Debug =====")
    print("CWD:", os.getcwd())
    print("HEALTH_DB_PATH:", os.environ.get("HEALTH_DB_PATH"))
    print("Resolved DB_PATH:", DB_PATH)
    print("Engine URL:", engine.url)
    print("Login username:", (req.username or "").strip())

    # Re-check existence + password verify to log result deterministically
    session = _get_db_session()
    try:
        existing = session.execute(select(User).where(User.username == (req.username or "").strip())).scalar_one_or_none()
        found = existing is not None
        verify = False
        if found:
            verify = verify_password(req.password or "", existing.password_hash)
        print("User found:", found)
        print("verify_password():", verify)
    finally:
        session.close()

    user = authenticate_user(get_db_session, username=req.username, password=req.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access = create_access_token(user_id=user["id"])
    refresh = create_refresh_token(user_id=user["id"])
    return TokenResponse(access_token=access, refresh_token=refresh)



@router.post("/refresh", response_model=TokenResponse)
def refresh(req: RefreshRequest):
    try:
        payload = decode_refresh_token(req.refresh_token)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    access = create_access_token(user_id=user_id)
    refresh = create_refresh_token(user_id=user_id)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/logout")
def logout():
    # Stateless JWT: client should just drop tokens.
    return {"ok": True}


@router.get("/me")
def me(user=Depends(__import__("api.deps", fromlist=["get_current_user"]).get_current_user)):
    return user


