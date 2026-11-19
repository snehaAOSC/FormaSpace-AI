import base64
import uuid
from pathlib import Path
from typing import Tuple

from ..config import ROOT_DIR, settings
from ..database import get_supabase_client

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def save_image_bytes(content: bytes, folder: str, filename: str) -> Tuple[str, Path]:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".png"
    unique_name = f"{uuid.uuid4().hex}{ext}"

    # Local persistent disk storage (always kept so PIL image processing and static server have direct instant access)
    target_dir = settings.STORAGE_DIR / folder
    target_dir.mkdir(parents=True, exist_ok=True)
    local_path = target_dir / unique_name
    local_path.write_bytes(content)

    # In local development or default mode, always return local /storage URL for 100% reliable image loading
    local_url = f"/storage/{folder}/{unique_name}"

    # Only upload to Supabase if explicitly in production with active Supabase bucket
    if settings.APP_ENV == "production":
        sb = get_supabase_client()
        if sb is not None:
            try:
                storage_path = f"{folder}/{unique_name}"
                mime = "image/png" if ext == ".png" else ("image/webp" if ext == ".webp" else "image/jpeg")
                sb.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
                    path=storage_path,
                    file=content,
                    file_options={"content-type": mime},
                )
                public_url = sb.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(storage_path)
                if public_url and "supabase.co" in public_url:
                    return public_url, local_path
            except Exception:
                pass

    return local_url, local_path


def resolve_local_image_path(image_url: str) -> Path:
    """Resolve /storage/..., /images/..., Supabase public URLs, or HTTP URLs to local disk paths for image processing."""
    clean = image_url.split("?")[0].strip()

    # 0. Data URL (Base64 payload passed directly from frontend client)
    if clean.startswith("data:image"):
        try:
            header, encoded = clean.split(",", 1)
            ext = ".png" if "png" in header else (".webp" if "webp" in header else ".jpg")
            data = base64.b64decode(encoded)
            cache_file = settings.STORAGE_DIR / "uploads" / f"upload_{uuid.uuid4().hex[:12]}{ext}"
            cache_file.parent.mkdir(parents=True, exist_ok=True)
            cache_file.write_bytes(data)
            return cache_file
        except Exception:
            pass

    # 0b. Blob URL safeguard: find the most recently uploaded image in storage/uploads
    if clean.startswith("blob:"):
        try:
            uploads_dir = settings.STORAGE_DIR / "uploads"
            if uploads_dir.exists():
                recent_uploads = sorted(uploads_dir.glob("*"), key=lambda f: f.stat().st_mtime, reverse=True)
                if recent_uploads:
                    return recent_uploads[0]
        except Exception:
            pass

    # 1. Direct local /storage/... path
    if clean.startswith("/storage/"):
        rel = clean.replace("/storage/", "", 1)
        candidate = settings.STORAGE_DIR / rel
        if candidate.exists():
            return candidate

    # 2. Supabase storage public URL or any URL containing /uploads/ or /designs/
    if "/uploads/" in clean or "/designs/" in clean:
        parts = clean.split("/")
        for idx, part in enumerate(parts):
            if part in {"uploads", "designs"} and idx + 1 < len(parts):
                folder = part
                fname = parts[idx + 1]
                candidate = settings.STORAGE_DIR / folder / fname
                if candidate.exists():
                    return candidate

    # 3. Direct filename match in storage/uploads or storage/designs
    filename = Path(clean).name
    if filename:
        for folder in ["uploads", "designs"]:
            candidate = settings.STORAGE_DIR / folder / filename
            if candidate.exists():
                return candidate
        candidate_img = ROOT_DIR / "frontend" / "public" / "images" / filename
        if candidate_img.exists():
            return candidate_img

    # 4. Frontend public images
    if clean.startswith("/images/"):
        rel = clean.replace("/images/", "", 1)
        frontend_img = ROOT_DIR / "frontend" / "public" / "images" / rel
        if frontend_img.exists():
            return frontend_img

    # 5. Remote HTTP/HTTPS image: cache locally so PIL has guaranteed high-speed access
    if clean.startswith("http://") or clean.startswith("https://"):
        try:
            import httpx
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(clean)
                if resp.status_code == 200:
                    ext = Path(clean).suffix or ".jpg"
                    cache_file = settings.STORAGE_DIR / "uploads" / f"cached_{uuid.uuid4().hex[:10]}{ext}"
                    cache_file.parent.mkdir(parents=True, exist_ok=True)
                    cache_file.write_bytes(resp.content)
                    return cache_file
        except Exception:
            pass

    # 6. Fallback to sample space
    fallback = ROOT_DIR / "frontend" / "public" / "images" / "hero-before.jpg"
    return fallback
