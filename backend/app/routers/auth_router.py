import secrets
import uuid
from fastapi import APIRouter, Depends, HTTPException

from ..auth import create_access_token, get_current_user
from ..config import settings
from ..database import get_db, get_supabase_client, hash_password, now_iso, verify_password
from ..models import (
    ForgotPasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    ResetPasswordRequest,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
def register(req: RegisterRequest):
    email = req.email.lower().strip()
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")

        user_id = str(uuid.uuid4())
        # Also register with Supabase Auth if configured
        sb = get_supabase_client()
        if sb is not None:
            try:
                res = sb.auth.sign_up({"email": email, "password": req.password})
                if res and res.user:
                    user_id = res.user.id
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"Supabase Auth signup failed: {exc}")

        starting_credits = 15
        conn.execute(
            "INSERT INTO users (id, email, password_hash, full_name, role, plan_id, credits, created_at) VALUES (?, ?, ?, ?, 'user', 'starter', ?, ?)",
            (user_id, email, hash_password(req.password), req.full_name.strip(), starting_credits, now_iso()),
        )
        conn.execute(
            "INSERT INTO credit_transactions (id, user_id, delta, reason, created_at) VALUES (?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), user_id, starting_credits, "Starter plan welcome credits", now_iso()),
        )

    token = create_access_token(user_id, email, "user")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": email,
            "full_name": req.full_name.strip(),
            "role": "user",
            "plan_id": "starter",
            "credits": starting_credits,
        },
    }


@router.post("/login")
def login(req: LoginRequest):
    email = req.email.lower().strip()
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if not user or not verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(user["id"], user["email"], user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "plan_id": user["plan_id"],
            "credits": user["credits"],
            "avatar_url": user["avatar_url"],
        },
    }


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully."}


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    email = req.email.lower().strip()
    reset_token = secrets.token_urlsafe(24)
    with get_db() as conn:
        user = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if user:
            conn.execute("UPDATE users SET reset_token = ? WHERE id = ?", (reset_token, user["id"]))
            return {
                "message": "If an account exists for this email, a password reset link has been generated.",
                "dev_reset_token": reset_token if settings.APP_ENV == "development" else None,
            }
    return {
        "message": "If an account exists for this email, a password reset link has been generated.",
        "dev_reset_token": None,
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    with get_db() as conn:
        user = conn.execute("SELECT id FROM users WHERE reset_token = ?", (req.token.strip(),)).fetchone()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired password reset token.")
        conn.execute(
            "UPDATE users SET password_hash = ?, reset_token = NULL WHERE id = ?",
            (hash_password(req.new_password), user["id"]),
        )
    return {"message": "Password updated successfully. You may now sign in."}


@router.get("/google-config")
def google_config():
    configured = bool(settings.SUPABASE_URL and settings.GOOGLE_CLIENT_ID)
    oauth_url = (
        f"{settings.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to={settings.FRONTEND_URL}/auth"
        if configured
        else None
    )
    return {"configured": configured, "oauth_url": oauth_url}


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}


@router.patch("/profile")
def update_profile(req: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        new_name = req.full_name.strip() if req.full_name is not None else current_user["full_name"]
        new_avatar = req.avatar_url if req.avatar_url is not None else current_user.get("avatar_url")
        conn.execute(
            "UPDATE users SET full_name = ?, avatar_url = ? WHERE id = ?",
            (new_name, new_avatar, current_user["id"]),
        )
        updated = conn.execute(
            "SELECT id, email, full_name, role, plan_id, credits, avatar_url, created_at FROM users WHERE id = ?",
            (current_user["id"],),
        ).fetchone()
    return {"user": dict(updated)}

