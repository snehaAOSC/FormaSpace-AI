import json
import uuid
from fastapi import APIRouter, Depends, HTTPException

from ..auth import get_current_user
from ..database import get_db, now_iso
from ..models import CreateFolderRequest, CreateProjectRequest, NewsletterRequest

router = APIRouter(prefix="/api", tags=["Public & User Dashboard"])


@router.get("/public/plans")
def get_public_plans():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY monthly_price ASC").fetchall()
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
            }
            for r in rows
        ]
    }


@router.get("/public/categories")
def get_public_categories():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM design_categories WHERE is_active = 1 ORDER BY sort_order ASC").fetchall()
    return {"categories": [dict(r) for r in rows]}


@router.post("/public/newsletter")
def subscribe_newsletter(req: NewsletterRequest):
    email = req.email.lower().strip()
    with get_db() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)",
            (str(uuid.uuid4()), email, now_iso()),
        )
    return {"subscribed": True, "email": email, "message": "Welcome to the FormaSpace Architectural Journal."}


@router.get("/dashboard/overview")
def dashboard_overview(current_user: dict = Depends(get_current_user)):
    uid = current_user["id"]
    with get_db() as conn:
        total_projects = conn.execute("SELECT COUNT(*) FROM projects WHERE user_id = ?", (uid,)).fetchone()[0]
        total_designs = conn.execute("SELECT COUNT(*) FROM designs WHERE user_id = ?", (uid,)).fetchone()[0]
        saved_designs = conn.execute("SELECT COUNT(*) FROM designs WHERE user_id = ? AND is_saved = 1", (uid,)).fetchone()[0]
        recent_projects = conn.execute(
            "SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC LIMIT 6",
            (uid,),
        ).fetchall()
        recent_designs = conn.execute(
            "SELECT * FROM designs WHERE user_id = ? ORDER BY created_at DESC LIMIT 6",
            (uid,),
        ).fetchall()
        txns = conn.execute(
            "SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
            (uid,),
        ).fetchall()

    return {
        "stats": {
            "total_projects": total_projects,
            "designs_generated": total_designs,
            "saved_designs": saved_designs,
            "remaining_credits": current_user["credits"],
            "plan_id": current_user["plan_id"],
        },
        "recent_projects": [dict(r) for r in recent_projects],
        "recent_designs": [
            {
                "id": r["id"],
                "feature_type": r["feature_type"],
                "category": r["category"],
                "style": r["style"],
                "original_image_url": r["original_image_url"],
                "generated_image_url": r["generated_image_url"],
                "is_saved": bool(r["is_saved"]),
                "is_demo_mode": bool(r["is_demo_mode"]),
                "created_at": r["created_at"],
            }
            for r in recent_designs
        ],
        "credit_transactions": [dict(r) for r in txns],
    }


@router.get("/dashboard/folders")
def list_folders(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM project_folders WHERE user_id = ? ORDER BY created_at DESC",
            (current_user["id"],),
        ).fetchall()
    return {"folders": [dict(r) for r in rows]}


@router.post("/dashboard/folders")
def create_folder(req: CreateFolderRequest, current_user: dict = Depends(get_current_user)):
    fid = str(uuid.uuid4())
    created = now_iso()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO project_folders (id, user_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)",
            (fid, current_user["id"], req.name.strip(), req.color, created),
        )
    return {"folder": {"id": fid, "user_id": current_user["id"], "name": req.name.strip(), "color": req.color, "created_at": created}}


@router.delete("/dashboard/folders/{folder_id}")
def delete_folder(folder_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("UPDATE projects SET folder_id = NULL WHERE folder_id = ? AND user_id = ?", (folder_id, current_user["id"]))
        conn.execute("DELETE FROM project_folders WHERE id = ? AND user_id = ?", (folder_id, current_user["id"]))
    return {"deleted": True}


@router.get("/dashboard/projects")
def list_projects(folder_id: str = "", current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        # Automatically sync any user design into projects table so all generated designs appear as projects
        designs = conn.execute(
            "SELECT * FROM designs WHERE user_id = ? ORDER BY created_at DESC",
            (current_user["id"],),
        ).fetchall()
        for d in designs:
            p_match = conn.execute(
                "SELECT id FROM projects WHERE user_id = ? AND (id = ? OR cover_image = ?)",
                (current_user["id"], d["project_id"] or d["id"], d["generated_image_url"]),
            ).fetchone()
            if not p_match:
                pid = d["project_id"] or d["id"]
                room = d["room_type"] or d["category"] or "Interior Space"
                feat = (d["feature_type"] or "Redesign").replace("_", " ").title()
                p_title = f"{room} · {d['style']} {feat}"
                conn.execute(
                    """INSERT OR IGNORE INTO projects (id, user_id, folder_id, title, category, style, cover_image, status, created_at, updated_at)
                       VALUES (?, ?, NULL, ?, ?, ?, ?, 'active', ?, ?)""",
                    (
                        pid,
                        current_user["id"],
                        p_title,
                        d["category"] or room,
                        d["style"] or "Modern Luxury",
                        d["generated_image_url"],
                        d["created_at"],
                        d["created_at"],
                    ),
                )

        if folder_id:
            rows = conn.execute(
                "SELECT * FROM projects WHERE user_id = ? AND folder_id = ? ORDER BY updated_at DESC",
                (current_user["id"], folder_id),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC",
                (current_user["id"],),
            ).fetchall()
    return {"projects": [dict(r) for r in rows]}


@router.post("/dashboard/projects")
def create_project(req: CreateProjectRequest, current_user: dict = Depends(get_current_user)):
    pid = str(uuid.uuid4())
    ts = now_iso()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO projects (id, user_id, folder_id, title, category, style, cover_image, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)",
            (pid, current_user["id"], req.folder_id, req.title.strip(), req.category, req.style, req.cover_image or "/images/hero-after.jpg", ts, ts),
        )
    return {
        "project": {
            "id": pid,
            "user_id": current_user["id"],
            "folder_id": req.folder_id,
            "title": req.title.strip(),
            "category": req.category,
            "style": req.style,
            "cover_image": req.cover_image or "/images/hero-after.jpg",
            "status": "active",
            "created_at": ts,
            "updated_at": ts,
        }
    }


@router.patch("/dashboard/projects/{project_id}")
def update_project(project_id: str, req: dict, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        proj = conn.execute("SELECT * FROM projects WHERE id = ? AND user_id = ?", (project_id, current_user["id"])).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")
        folder_id = req.get("folder_id", proj["folder_id"])
        title = req.get("title", proj["title"])
        category = req.get("category", proj["category"])
        conn.execute(
            "UPDATE projects SET folder_id = ?, title = ?, category = ?, updated_at = ? WHERE id = ? AND user_id = ?",
            (folder_id, title, category, now_iso(), project_id, current_user["id"]),
        )
    return {"updated": True}


@router.delete("/dashboard/projects/{project_id}")
def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        proj = conn.execute("SELECT * FROM projects WHERE id = ? AND user_id = ?", (project_id, current_user["id"])).fetchone()
        if proj:
            conn.execute("DELETE FROM designs WHERE user_id = ? AND (project_id = ? OR generated_image_url = ?)", (current_user["id"], project_id, proj["cover_image"]))
            conn.execute("DELETE FROM projects WHERE id = ? AND user_id = ?", (project_id, current_user["id"]))
        else:
            conn.execute("DELETE FROM projects WHERE id = ? AND user_id = ?", (project_id, current_user["id"]))
    return {"deleted": True}


@router.post("/dashboard/subscription/switch/{plan_id}")
def switch_subscription_plan(plan_id: str, current_user: dict = Depends(get_current_user)):
    """Demo-safe plan switching / credit allocation without fake payment processing."""
    normalized_id = "professional" if plan_id.lower() in {"pro", "professional"} else plan_id.lower()
    with get_db() as conn:
        plan = conn.execute("SELECT * FROM subscription_plans WHERE id = ?", (normalized_id,)).fetchone()
        if not plan:
            raise HTTPException(status_code=404, detail="Subscription plan not found")
        conn.execute(
            "UPDATE users SET plan_id = ?, credits = ? WHERE id = ?",
            (plan["id"], plan["credits_per_month"], current_user["id"]),
        )
        conn.execute(
            "INSERT INTO credit_transactions (id, user_id, delta, reason, created_at) VALUES (?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), current_user["id"], plan["credits_per_month"], f"Switched to {plan['name']} plan allowance", now_iso()),
        )
    return {
        "plan_id": plan["id"],
        "credits": plan["credits_per_month"],
        "message": f"Plan updated to {plan['name']}. Payment checkout is intentionally omitted in this environment.",
    }

