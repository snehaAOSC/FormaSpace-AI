from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings
from .database import get_db, get_supabase_client

security = HTTPBearer(auto_error=False)


def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict[str, Any]:
    # First try local JWT secret
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        pass

    # If Supabase is configured, validate token via Supabase Auth API
    sb = get_supabase_client()
    if sb is not None:
        try:
            user_resp = sb.auth.get_user(token)
            if user_resp and user_resp.user:
                return {
                    "sub": user_resp.user.id,
                    "email": user_resp.user.email,
                    "role": "user",
                    "supabase": True,
                }
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
    )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict[str, Any]:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )

    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    with get_db() as conn:
        row = conn.execute(
            "SELECT id, email, full_name, role, plan_id, credits, avatar_url, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        if not row and payload.get("supabase"):
            # Sync Supabase Auth user into local mirror/profile
            email = payload.get("email", "")
            conn.execute(
                "INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, plan_id, credits, created_at) VALUES (?, ?, ?, ?, 'user', 'starter', 15, ?)",
                (user_id, email, "supabase-oauth", email.split("@")[0].title(), datetime.now(timezone.utc).isoformat()),
            )
            row = conn.execute(
                "SELECT id, email, full_name, role, plan_id, credits, avatar_url, created_at FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="User account not found")
    return dict(row)


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict[str, Any]]:
    if not credentials or not credentials.credentials:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None


def require_admin(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required",
        )
    return current_user

