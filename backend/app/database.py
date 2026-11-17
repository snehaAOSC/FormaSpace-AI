import json
import sqlite3
import uuid
import hashlib
import secrets
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Optional

from .config import settings

try:
    import supabase._sync.client as _sc
    _orig_client_re_match = _sc.re.match

    def _patched_re_match(pattern, string, flags=0):
        if string and (str(string).startswith("sb_secret_") or str(string).startswith("sb_publishable_")):
            return True
        return _orig_client_re_match(pattern, string, flags)

    _sc.re.match = _patched_re_match
    from supabase import create_client, Client as SupabaseClient
except Exception:
    SupabaseClient = Any
    create_client = None

_cached_supabase_client = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str, salt: Optional[str] = None) -> str:
    salt_val = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_val.encode("utf-8"), 120_000).hex()
    return f"{salt_val}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_val, digest = stored_hash.split("$", 1)
        check = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_val.encode("utf-8"), 120_000).hex()
        return secrets.compare_digest(check, digest)
    except Exception:
        return False


def get_supabase_client() -> Optional[Any]:
    global _cached_supabase_client
    if not settings.is_supabase_configured or create_client is None:
        return None
    if _cached_supabase_client is not None:
        return _cached_supabase_client
    try:
        _cached_supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        return _cached_supabase_client
    except Exception as e:
        print(f"[Supabase] Client init error: {e}")
        return None


@contextmanager
def get_db():
    conn = sqlite3.connect(str(settings.DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


DEFAULT_CATEGORIES = [
    ("living-room", "Living Room", "living-room", "Interior", "Warm architectural lounges, plaster walls & bespoke seating", "/images/hero-after.jpg", 1),
    ("bedroom", "Bedroom", "bedroom", "Interior", "Serene primary suites, layered linens & soft ambient lighting", "/images/staged-room.jpg", 2),
    ("kitchen", "Kitchen", "kitchen", "Interior", "Stone islands, fluted oak cabinetry & integrated brass fixtures", "/images/style-japandi.jpg", 3),
    ("bathroom", "Bathroom", "bathroom", "Interior", "Spa-grade travertine wet rooms, sculptural vanities & warm stone", "/images/style-japandi.jpg", 4),
    ("dining-room", "Dining Room", "dining-room", "Interior", "Architectural dining spaces for gathering and natural light", "/images/style-japandi.jpg", 5),
    ("office", "Office", "office", "Interior", "Quiet studio workspaces with tailored millwork and daylighting", "/images/staged-room.jpg", 6),
    ("apartment", "Apartment", "apartment", "Interior", "Cohesive urban residences maximized for flow and warmth", "/images/empty-room.jpg", 7),
    ("house-exterior", "House Exterior", "house-exterior", "Exterior", "Limestone facades, timber louvers & architectural glazing", "/images/exterior-after.jpg", 8),
    ("garden", "Garden", "garden", "Outdoor", "Curated planting palettes, stone paths & evening illumination", "/images/garden-after.jpg", 9),
    ("backyard", "Backyard", "backyard", "Outdoor", "Private courtyard sanctuaries with sunken firepits & plunge pools", "/images/garden-after.jpg", 10),
    ("balcony", "Balcony", "balcony", "Outdoor", "Elevated urban terraces with bespoke seating & container olive trees", "/images/garden-after.jpg", 11),
    ("patio", "Patio", "patio", "Outdoor", "Indoor-outdoor limestone loggias and pergola entertaining decks", "/images/garden-after.jpg", 12),
    ("commercial-spaces", "Commercial Spaces", "commercial-spaces", "Commercial", "Boutique hospitality lobbies, galleries & flagship retail interiors", "/images/hero-after.jpg", 13),
]

DEFAULT_PLANS = [
    (
        "starter",
        "Starter",
        0.0,
        0.0,
        15,
        [
            "15 monthly design credits",
            "Interior & exterior redesign modes",
            "15 curated architectural style presets",
            "Standard resolution downloads",
            "Personal project history",
        ],
    ),
    (
        "professional",
        "Professional",
        29.0,
        24.0,
        180,
        [
            "180 monthly design credits",
            "All 13 design categories & 10 design tools",
            "Furniture replacement & virtual staging",
            "Material, color & sky/weather controls",
            "High-resolution exports & saved project folders",
        ],
    ),
    (
        "studio",
        "Studio",
        79.0,
        64.0,
        650,
        [
            "650 monthly design credits",
            "All Professional features included",
            "2D-to-3D Floor Plan visualization studio",
            "Cinematic Video Walkthroughs",
            "Renovation Budget Estimator & commercial license",
        ],
    ),
]


def init_db():
    with get_db() as conn:
        cur = conn.cursor()
        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                plan_id TEXT NOT NULL DEFAULT 'starter',
                credits INTEGER NOT NULL DEFAULT 15,
                avatar_url TEXT,
                reset_token TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS subscription_plans (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                monthly_price REAL NOT NULL,
                annual_price REAL NOT NULL,
                credits_per_month INTEGER NOT NULL,
                features_json TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS design_categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                group_name TEXT NOT NULL,
                description TEXT NOT NULL,
                cover_image TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS project_folders (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                color TEXT NOT NULL DEFAULT '#172B3A',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                folder_id TEXT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                style TEXT NOT NULL,
                cover_image TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS designs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                project_id TEXT,
                feature_type TEXT NOT NULL,
                category TEXT NOT NULL,
                room_type TEXT NOT NULL,
                style TEXT NOT NULL,
                intervention_level TEXT NOT NULL,
                prompt TEXT NOT NULL,
                settings_json TEXT NOT NULL,
                original_image_url TEXT NOT NULL,
                generated_image_url TEXT NOT NULL,
                variations_json TEXT NOT NULL,
                detected_objects_json TEXT NOT NULL,
                credits_used INTEGER NOT NULL DEFAULT 1,
                is_saved INTEGER NOT NULL DEFAULT 0,
                is_demo_mode INTEGER NOT NULL DEFAULT 1,
                provider TEXT NOT NULL DEFAULT 'demo',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS floor_plans (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                source_plan_url TEXT NOT NULL,
                furnished_2d_url TEXT NOT NULL,
                render_3d_url TEXT NOT NULL,
                layout_style TEXT NOT NULL,
                furniture_arrangement TEXT NOT NULL,
                rooms_json TEXT NOT NULL,
                is_demo_mode INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS video_projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                source_image_url TEXT NOT NULL,
                camera_movement TEXT NOT NULL,
                duration_seconds INTEGER NOT NULL,
                angles_json TEXT NOT NULL,
                status TEXT NOT NULL,
                video_url TEXT,
                requires_external_provider INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS furniture_collections (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                design_id TEXT,
                product_id TEXT NOT NULL,
                product_name TEXT NOT NULL,
                category TEXT NOT NULL,
                material TEXT NOT NULL,
                approx_price REAL NOT NULL,
                image_url TEXT NOT NULL,
                product_url TEXT NOT NULL,
                is_demo_product INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS budget_estimates (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                inputs_json TEXT NOT NULL,
                breakdown_json TEXT NOT NULL,
                estimated_total REAL NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS credit_transactions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                delta INTEGER NOT NULL,
                reason TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS error_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                endpoint TEXT NOT NULL,
                error_message TEXT NOT NULL,
                severity TEXT NOT NULL DEFAULT 'error',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )

        # Load persisted runtime AI settings if configured
        ai_prov = cur.execute("SELECT value FROM system_settings WHERE key = 'ai_provider'").fetchone()
        ai_key = cur.execute("SELECT value FROM system_settings WHERE key = 'ai_api_key'").fetchone()
        ai_model = cur.execute("SELECT value FROM system_settings WHERE key = 'ai_model'").fetchone()
        if ai_prov and ai_key and ai_key["value"]:
            settings.configure_ai(ai_prov["value"], ai_key["value"], ai_model["value"] if ai_model else "")

        # Seed plans if empty
        plan_count = cur.execute("SELECT COUNT(*) FROM subscription_plans").fetchone()[0]
        if plan_count == 0:
            for pid, name, mp, ap, creds, feats in DEFAULT_PLANS:
                cur.execute(
                    "INSERT INTO subscription_plans (id, name, monthly_price, annual_price, credits_per_month, features_json, is_active, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
                    (pid, name, mp, ap, creds, json.dumps(feats), now_iso()),
                )

        # Seed categories if empty
        cat_count = cur.execute("SELECT COUNT(*) FROM design_categories").fetchone()[0]
        if cat_count == 0:
            for cid, name, slug, grp, desc, img, order in DEFAULT_CATEGORIES:
                cur.execute(
                    "INSERT INTO design_categories (id, name, slug, group_name, description, cover_image, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
                    (cid, name, slug, grp, desc, img, order),
                )

        # Seed demo architect user & admin user for immediate exploration
        demo_user = cur.execute("SELECT id FROM users WHERE email = ?", ("studio@formaspace.ai",)).fetchone()
        if not demo_user:
            uid = "11111111-1111-4111-8111-111111111111"
            cur.execute(
                "INSERT INTO users (id, email, password_hash, full_name, role, plan_id, credits, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (uid, "studio@formaspace.ai", hash_password("FormaSpace2026!"), "Elena Vance (Architect)", "user", "professional", 120, now_iso()),
            )
            folder_id = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO project_folders (id, user_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)",
                (folder_id, uid, "Residence Renovations", "#C87960", now_iso()),
            )
            proj_id = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO projects (id, user_id, folder_id, title, category, style, cover_image, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)",
                (proj_id, uid, folder_id, "Pacific Heights Living Sanctuary", "Living Room", "Modern Luxury", "/images/hero-after.jpg", now_iso(), now_iso()),
            )
            cur.execute(
                """INSERT INTO designs (id, user_id, project_id, feature_type, category, room_type, style, intervention_level, prompt, settings_json, original_image_url, generated_image_url, variations_json, detected_objects_json, credits_used, is_saved, is_demo_mode, provider, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    str(uuid.uuid4()),
                    uid,
                    proj_id,
                    "interior_redesign",
                    "Living Room",
                    "Living Room",
                    "Modern Luxury",
                    "Medium",
                    "Warm ivory plaster walls, European oak flooring, curved bouclé sofa, muted terracotta accent chair, soft daylight.",
                    json.dumps({"wall_color": "#F7F4ED", "floor_material": "European White Oak"}),
                    "/images/hero-before.jpg",
                    "/images/hero-after.jpg",
                    json.dumps(["/images/hero-after.jpg", "/images/style-japandi.jpg"]),
                    json.dumps([
                        {"id": "obj-1", "label": "Sofa", "confidence": 0.96, "box": [22, 52, 48, 30]},
                        {"id": "obj-2", "label": "Table", "confidence": 0.92, "box": [35, 70, 28, 16]},
                        {"id": "obj-3", "label": "Window", "confidence": 0.98, "box": [30, 12, 40, 42]},
                        {"id": "obj-4", "label": "Plant", "confidence": 0.89, "box": [72, 40, 14, 34]},
                    ]),
                    1,
                    1,
                    1,
                    "demo",
                    now_iso(),
                ),
            )

        admin_user = cur.execute("SELECT id FROM users WHERE email = ?", ("admin@formaspace.ai",)).fetchone()
        if not admin_user:
            aid = "22222222-2222-4222-8222-222222222222"
            cur.execute(
                "INSERT INTO users (id, email, password_hash, full_name, role, plan_id, credits, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (aid, "admin@formaspace.ai", hash_password("AdminForma2026!"), "Marcus Sterling (Admin)", "admin", "studio", 650, now_iso()),
            )

