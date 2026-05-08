from fastapi import APIRouter, Depends
from app.database import supabase
from app.middleware.auth import get_current_user

router = APIRouter()

def _list_modules():
    response = supabase.table("modules").select("*").eq("is_published", True).order("order_index").execute()
    return response.data

@router.get("/")
def get_modules(user=Depends(get_current_user)):
    return _list_modules()

@router.get("")
def get_modules_no_slash(user=Depends(get_current_user)):
    return _list_modules()

@router.get("/{module_id}")
def get_module(module_id: str, user=Depends(get_current_user)):
    module = supabase.table("modules").select("*").eq("id", module_id).single().execute()
    resources = supabase.table("resources").select("*").eq("module_id", module_id).order("order_index").execute()
    return {**module.data, "resources": resources.data}
