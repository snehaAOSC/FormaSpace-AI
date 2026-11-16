import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

# Load .env from backend/ or workspace root if present
load_dotenv(BASE_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "FormaSpace AI")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv(
            "BACKEND_CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if o.strip()
    ]

    JWT_SECRET: str = os.getenv("JWT_SECRET", "formaspace-dev-secret-key-change-in-prod")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # Supabase
    _raw_supabase_url: str = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_URL: str = (
        _raw_supabase_url[:-9]
        if _raw_supabase_url.endswith("/rest/v1/")
        else (
            _raw_supabase_url[:-8]
            if _raw_supabase_url.endswith("/rest/v1")
            else _raw_supabase_url.rstrip("/")
        )
    )
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "").strip()
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    SUPABASE_STORAGE_BUCKET: str = os.getenv("SUPABASE_STORAGE_BUCKET", "formaspace-assets")

    # Modular AI Image Editing
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "demo").lower().strip()
    AI_API_KEY: str = os.getenv("AI_API_KEY", "").strip()
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-image-1").strip()
    AI_VISION_MODEL: str = os.getenv("AI_VISION_MODEL", "gpt-4o-mini").strip()

    # Optional Video Generation Provider
    VIDEO_PROVIDER: str = os.getenv("VIDEO_PROVIDER", "none").lower().strip()
    VIDEO_API_KEY: str = os.getenv("VIDEO_API_KEY", "").strip()

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "").strip()

    # Local Paths
    DATA_DIR: Path = BASE_DIR / "data"
    STORAGE_DIR: Path = BASE_DIR / "storage"
    DB_PATH: Path = DATA_DIR / "formaspace.db"

    @property
    def is_supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_SERVICE_ROLE_KEY)

    @property
    def is_live_ai_configured(self) -> bool:
        return self.AI_PROVIDER in {"openai", "gemini", "stability", "fal"} and bool(self.AI_API_KEY)

    def configure_ai(self, provider: str, api_key: str, model: str = "") -> None:
        self.AI_PROVIDER = provider.lower().strip()
        self.AI_API_KEY = api_key.strip()
        if model.strip():
            self.AI_MODEL = model.strip()
        elif self.AI_PROVIDER == "openai":
            self.AI_MODEL = "gpt-image-1"
        elif self.AI_PROVIDER == "gemini":
            self.AI_MODEL = "gemini-2.5-flash-image"
        elif self.AI_PROVIDER == "stability":
            self.AI_MODEL = "sd3.5-large"
        elif self.AI_PROVIDER == "fal":
            self.AI_MODEL = "fal-ai/flux-pro/kontext"

    @property
    def is_live_video_configured(self) -> bool:
        return self.VIDEO_PROVIDER in {"runway", "luma", "veo"} and bool(self.VIDEO_API_KEY)


settings = Settings()
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
(settings.STORAGE_DIR / "uploads").mkdir(parents=True, exist_ok=True)
(settings.STORAGE_DIR / "designs").mkdir(parents=True, exist_ok=True)
(settings.STORAGE_DIR / "floorplans").mkdir(parents=True, exist_ok=True)

