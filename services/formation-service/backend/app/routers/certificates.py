from fastapi import APIRouter, Depends, HTTPException, status
from app.database import supabase
from app.middleware.auth import get_current_user

router = APIRouter()

@router.get("/me")
def get_my_certificate(user=Depends(get_current_user)):
    response = supabase.table("certificates").select("*").eq("user_id", user.id).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificat non disponible. Complète tous les modules.")
    return response.data[0]
