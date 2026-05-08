from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, modules, progress, certificates, notebook, ai

app = FastAPI(title="KORYXA Formation API", version="1.0.0")

allowed_origins = [
    origin.strip()
    for origin in (settings.ALLOWED_ORIGINS or settings.FRONTEND_URL).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/auth",         tags=["Auth"])
app.include_router(modules.router,      prefix="/modules",      tags=["Modules"])
app.include_router(progress.router,     prefix="/progress",     tags=["Progress"])
app.include_router(certificates.router, prefix="/certificates", tags=["Certificates"])
app.include_router(notebook.router,     prefix="/modules",      tags=["Notebook"])
app.include_router(ai.router,           prefix="/ai",           tags=["AI"])

@app.get("/")
def health_check():
    return {"status": "ok", "app": "KORYXA Formation API"}


@app.get("/health")
def health():
    return {"ok": True, "service": "formation-service"}
