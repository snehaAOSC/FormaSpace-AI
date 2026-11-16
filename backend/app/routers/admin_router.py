import json
import uuid
from fastapi import APIRouter, Depends, HTTPException

from ..auth import require_admin
from ..database import get_db, now_iso
from ..models import AdminCategoryCreateRequest, AdminPlanUpdateRequest, AdminUserUpdateRequest

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])


@router.get("/overview")
def admin_overview(_admin: dict = Depends(require_admin)):
    with get_db() as conn:
        total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        active_subs = conn.execute("SELECT COUNT(*) FROM users WHERE plan_id != 'starter'").fetchone()[0]
        total_generations = conn.execute("SELECT COUNT(*) FROM designs").fetchone()[0]
        total_credits_used = conn.execute("SELECT COALESCE(SUM(ABS(delta)), 0) FROM credit_transactions WHERE delta < 0").fetchone()[0]
        total_projects = conn.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
        style_breakdown = conn.execute(
            "SELECT style, COUNT(*) as count FROM designs GROUP BY style ORDER BY count DESC LIMIT 8"
        ).fetchall()
        feature_breakdown = conn.execute(
            "SELECT feature_type, COUNT(*) as count FROM designs GROUP BY feature_type ORDER BY count DESC"
        ).fetchall()

    return {
        "metrics": {
            "total_users": total_users,
            "active_subscriptions": active_subs,
            "ai_generations": total_generations,
            "credit_usage": total_credits_used,
            "total_projects": total_projects,
        },
        "style_analytics": [dict(r) for r in style_breakdown],
        "feature_analytics": [dict(r) for r in feature_breakdown],
    }


@router.get("/users")
def admin_list_users(_admin: dict = Depends(require_admin)):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, email, full_name, role, plan_id, credits, created_at FROM users ORDER BY created_at DESC"
        ).fetchall()
    return {"users": [dict(r) for r in rows]}


@router.patch("/users/{user_id}")
def admin_update_user(user_id: str, req: AdminUserUpdateRequest, _admin: dict = Depends(require_admin)):
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        new_role = req.role or user["role"]
        new_plan = req.plan_id or user["plan_id"]
        new_credits = req.credits if req.credits is not None else user["credits"]
        conn.execute(
            "UPDATE users SET role = ?, plan_id = ?, credits = ? WHERE id = ?",
            (new_role, new_plan, new_credits, user_id),
        )
    return {"updated": True, "user_id": user_id}


@router.get("/plans")
def admin_list_plans(_admin: dict = Depends(require_admin)):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM subscription_plans ORDER BY monthly_price ASC").fetchall()
    return {
        "plans": [
            {
                "id": r["id"],
                "name": r["name"],
                "monthly_price": r["monthly_price"],
                "annual_price": r["annual_price"],
                "credits_per_month": r["credits_per_month"],
                "features": json.loads(r["features_json"] or "[]"),
                "is_active": bool(r["is_active"]),
                "updated_at": r["updated_at"],
            }
            for r in rows
        ]
    }


@router.patch("/plans/{plan_id}")
def admin_update_plan(plan_id: str, req: AdminPlanUpdateRequest, _admin: dict = Depends(require_admin)):
    with get_db() as conn:
        plan = conn.execute("SELECT * FROM subscription_plans WHERE id = ?", (plan_id,)).fetchone()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        conn.execute(
            """UPDATE subscription_plans
               SET name = ?, monthly_price = ?, annual_price = ?, credits_per_month = ?, features_json = ?, is_active = ?, updated_at = ?
               WHERE id = ?""",
            (
                req.name if req.name is not None else plan["name"],
                req.monthly_price if req.monthly_price is not None else plan["monthly_price"],
                req.annual_price if req.annual_price is not None else plan["annual_price"],
                req.credits_per_month if req.credits_per_month is not None else plan["credits_per_month"],
                json.dumps(req.features) if req.features is not None else plan["features_json"],
                (1 if req.is_active else 0) if req.is_active is not None else plan["is_active"],
                now_iso(),
                plan_id,
            ),
        )
    return {"updated": True, "plan_id": plan_id}


@router.get("/categories")
def admin_list_categories(_admin: dict = Depends(require_admin)):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM design_categories ORDER BY sort_order ASC").fetchall()
    return {"categories": [dict(r) for r in rows]}


@router.post("/categories")
def admin_create_category(req: AdminCategoryCreateRequest, _admin: dict = Depends(require_admin)):
    cid = req.slug.lower().strip()
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO design_categories (id, name, slug, group_name, description, cover_image, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
            (cid, req.name, cid, req.group_name, req.description, req.cover_image, req.sort_order),
        )
    return {"created": True, "id": cid}


@router.patch("/categories/{cat_id}/toggle")
def admin_toggle_category(cat_id: str, _admin: dict = Depends(require_admin)):
    with get_db() as conn:
        row = conn.execute("SELECT is_active FROM design_categories WHERE id = ?", (cat_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Category not found")
        next_val = 0 if row["is_active"] else 1
        conn.execute("UPDATE design_categories SET is_active = ? WHERE id = ?", (next_val, cat_id))
    return {"id": cat_id, "is_active": bool(next_val)}


@router.get("/projects")
def admin_list_projects(_admin: dict = Depends(require_admin)):
    with get_db() as conn:
        rows = conn.execute(
            """SELECT p.*, u.email as owner_email
               FROM projects p LEFT JOIN users u ON p.user_id = u.id
               ORDER BY p.updated_at DESC LIMIT 100"""
        ).fetchall()
    return {"projects": [dict(r) for r in rows]}


@router.get("/error-logs")
def admin_error_logs(_admin: dict = Depends(require_admin)):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 100").fetchall()
    return {"logs": [dict(r) for r in rows]}

