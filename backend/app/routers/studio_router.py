import json
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..auth import get_current_user, get_optional_user
from ..config import settings
from ..database import get_db, now_iso
from ..models import ConfigureAIRequest, DetectObjectsRequest, GenerateDesignRequest, SaveDesignRequest
from ..services.ai_provider import (
    detect_architectural_objects_live,
    generate_design_images,
)
from ..services.storage_service import ALLOWED_EXTENSIONS, save_image_bytes

router = APIRouter(prefix="/api/studio", tags=["AI Design Studio"])


@router.get("/status")
def studio_status():
    masked_key = ""
    if settings.AI_API_KEY and len(settings.AI_API_KEY) > 8:
        masked_key = f"{settings.AI_API_KEY[:4]}...{settings.AI_API_KEY[-4:]}"
    return {
        "ai_provider": settings.AI_PROVIDER,
        "ai_model": settings.AI_MODEL,
        "masked_api_key": masked_key,
        "live_ai_configured": settings.is_live_ai_configured,
        "live_video_configured": settings.is_live_video_configured,
        "supabase_configured": settings.is_supabase_configured,
    }


@router.post("/configure-ai")
def configure_ai_provider(
    req: ConfigureAIRequest,
    _user: dict = Depends(get_current_user),
):
    """Allow authenticated workspace users/admins to connect a live image-editing API key."""
    if req.provider != "demo" and not req.api_key.strip():
        raise HTTPException(status_code=400, detail="API key is required for live AI providers.")

    settings.configure_ai(req.provider, req.api_key, req.model)
    ts = now_iso()
    with get_db() as conn:
        for k, v in [
            ("ai_provider", settings.AI_PROVIDER),
            ("ai_api_key", settings.AI_API_KEY),
            ("ai_model", settings.AI_MODEL),
        ]:
            conn.execute(
                "INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)",
                (k, v, ts),
            )

    return studio_status()


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    filename = file.filename or "upload.png"
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload JPG, JPEG, PNG, or WebP.",
        )

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 15MB limit.")

    url, _ = save_image_bytes(content, "uploads", filename)
    user_id = current_user["id"] if current_user else None
    return {"url": url, "filename": filename, "user_id": user_id}


@router.post("/detect-objects")
async def detect_objects(
    req: DetectObjectsRequest,
    current_user: dict = Depends(get_optional_user),
):
    objects = await detect_architectural_objects_live(req.image_url, req.room_type)
    return {
        "objects": objects,
        "is_demo_mode": not settings.is_live_ai_configured,
    }


@router.post("/generate")
async def generate_design(
    req: GenerateDesignRequest,
    current_user: dict = Depends(get_current_user),
):
    credit_cost = max(1, req.variations_count)

    result = await generate_design_images(
        original_image_url=req.original_image_url,
        feature_type=req.feature_type,
        category=req.category,
        room_type=req.room_type,
        style=req.style,
        intervention_level=req.intervention_level,
        user_prompt=req.prompt,
        variations_count=req.variations_count,
        extra_settings=req.settings,
        mask_data_url=req.mask_data_url,
        inspiration_image_url=req.inspiration_image_url,
    )

    detected = await detect_architectural_objects_live(result["generated_image_url"], req.room_type)
    design_id = str(uuid.uuid4())
    created = now_iso()

    with get_db() as conn:
        conn.execute(
            "UPDATE users SET credits = credits - ? WHERE id = ?",
            (credit_cost, current_user["id"]),
        )
        conn.execute(
            "INSERT INTO credit_transactions (id, user_id, delta, reason, created_at) VALUES (?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), current_user["id"], -credit_cost, f"AI Studio: {req.feature_type} ({req.style})", created),
        )
        conn.execute(
            """INSERT INTO designs (id, user_id, project_id, feature_type, category, room_type, style, intervention_level, prompt, settings_json, original_image_url, generated_image_url, variations_json, detected_objects_json, credits_used, is_saved, is_demo_mode, provider, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)""",
            (
                design_id,
                current_user["id"],
                req.project_id,
                req.feature_type,
                req.category,
                req.room_type,
                req.style,
                req.intervention_level,
                req.prompt,
                json.dumps(req.settings),
                req.original_image_url,
                result["generated_image_url"],
                json.dumps(result["variations"]),
                json.dumps(detected),
                credit_cost,
                1 if result["is_demo_mode"] else 0,
                result["provider"],
                created,
            ),
        )
        updated_credits = conn.execute("SELECT credits FROM users WHERE id = ?", (current_user["id"],)).fetchone()["credits"]

    return {
        "design": {
            "id": design_id,
            "user_id": current_user["id"],
            "project_id": req.project_id,
            "feature_type": req.feature_type,
            "category": req.category,
            "room_type": req.room_type,
            "style": req.style,
            "intervention_level": req.intervention_level,
            "prompt": req.prompt,
            "settings": req.settings,
            "original_image_url": req.original_image_url,
            "generated_image_url": result["generated_image_url"],
            "variations": result["variations"],
            "detected_objects": detected,
            "credits_used": credit_cost,
            "is_saved": False,
            "is_demo_mode": result["is_demo_mode"],
            "provider": result["provider"],
            "prompt_used": result["prompt_used"],
            "inspiration_analysis": result.get("inspiration_analysis"),
            "warning": result.get("warning"),
            "created_at": created,
        },
        "remaining_credits": updated_credits,
    }


@router.get("/history")
def get_history(saved_only: bool = False, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        query = "SELECT * FROM designs WHERE user_id = ?"
        params = [current_user["id"]]
        if saved_only:
            query += " AND is_saved = 1"
        query += " ORDER BY created_at DESC LIMIT 60"
        rows = conn.execute(query, params).fetchall()

    items = []
    for r in rows:
        items.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "project_id": r["project_id"],
            "feature_type": r["feature_type"],
            "category": r["category"],
            "room_type": r["room_type"],
            "style": r["style"],
            "intervention_level": r["intervention_level"],
            "prompt": r["prompt"],
            "settings": json.loads(r["settings_json"] or "{}"),
            "original_image_url": r["original_image_url"],
            "generated_image_url": r["generated_image_url"],
            "variations": json.loads(r["variations_json"] or "[]"),
            "detected_objects": json.loads(r["detected_objects_json"] or "[]"),
            "credits_used": r["credits_used"],
            "is_saved": bool(r["is_saved"]),
            "is_demo_mode": bool(r["is_demo_mode"]),
            "provider": r["provider"],
            "created_at": r["created_at"],
        })
    return {"designs": items}


@router.patch("/designs/{design_id}/save")
def toggle_save_design(
    design_id: str,
    req: SaveDesignRequest,
    current_user: dict = Depends(get_current_user),
):
    with get_db() as conn:
        row = conn.execute("SELECT id FROM designs WHERE id = ? AND user_id = ?", (design_id, current_user["id"])).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Design not found")
        conn.execute(
            "UPDATE designs SET is_saved = ?, project_id = COALESCE(?, project_id) WHERE id = ? AND user_id = ?",
            (1 if req.is_saved else 0, req.project_id, design_id, current_user["id"]),
        )
    return {"id": design_id, "is_saved": req.is_saved, "project_id": req.project_id}


@router.delete("/designs/{design_id}")
def delete_design(design_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        res = conn.execute("DELETE FROM designs WHERE id = ? AND user_id = ?", (design_id, current_user["id"]))
        if res.rowcount == 0:
            raise HTTPException(status_code=404, detail="Design not found")
    return {"deleted": True, "id": design_id}
