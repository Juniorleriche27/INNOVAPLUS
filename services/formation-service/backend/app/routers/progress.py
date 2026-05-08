from fastapi import APIRouter, Depends
from app.schemas.progress import ProgressUpdate
from app.database import supabase
from app.middleware.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter()

@router.get("/")
def get_my_progress(user=Depends(get_current_user)):
    response = supabase.table("progress").select("*").eq("user_id", user.id).execute()
    return response.data

@router.get("/completion")
def get_completion(user=Depends(get_current_user)):
    result = supabase.rpc("get_user_completion", {"p_user_id": user.id}).execute()
    return {"percentage": result.data}

@router.post("/")
def update_progress(data: ProgressUpdate, user=Depends(get_current_user)):
    payload = {
        "user_id": user.id,
        "module_id": data.module_id,
        "completed": data.completed,
        "completed_at": datetime.now(timezone.utc).isoformat() if data.completed else None,
    }
    response = supabase.table("progress").upsert(payload, on_conflict="user_id,module_id").execute()
    return response.data
