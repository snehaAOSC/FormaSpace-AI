import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import get_db, init_db, now_iso
from .routers import admin_router, auth_router, dashboard_router, modules_router, studio_router

init_db()

app = FastAPI(
    title="FormaSpace AI API",
    description="Modular AI Home Design & Architecture Platform Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")

app.include_router(auth_router.router)
app.include_router(studio_router.router)
app.include_router(modules_router.router)
app.include_router(dashboard_router.router)
app.include_router(admin_router.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO error_logs (id, user_id, endpoint, error_message, severity, created_at) VALUES (?, NULL, ?, ?, 'error', ?)",
                (str(uuid.uuid4()), str(request.url.path), str(exc)[:500], now_iso()),
            )
    except Exception:
        pass
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "error": str(exc)})


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "ai_provider": settings.AI_PROVIDER,
        "live_ai_configured": settings.is_live_ai_configured,
        "supabase_configured": settings.is_supabase_configured,
    }

