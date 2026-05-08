from fastapi import APIRouter, HTTPException, status
from app.schemas.user import RegisterSchema, LoginSchema
from app.database import supabase

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterSchema):
    try:
        response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {"data": {"full_name": data.full_name}},
        })
        return {"message": "Inscription réussie. Vérifie ton email.", "user_id": response.user.id}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login")
def login(data: LoginSchema):
    try:
        response = supabase.auth.sign_in_with_password({"email": data.email, "password": data.password})
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
        }
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

@router.post("/logout")
def logout():
    supabase.auth.sign_out()
    return {"message": "Déconnexion réussie"}
