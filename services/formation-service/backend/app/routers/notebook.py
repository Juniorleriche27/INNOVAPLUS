import json
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from app.database import supabase
from app.middleware.auth import get_current_user

router = APIRouter()

CONTENT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "content")


def get_notebook_path(module_id: str) -> str:
    result = supabase.table("modules").select("notebook_path").eq("id", module_id).single().execute()
    if not result.data or not result.data.get("notebook_path"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aucun notebook pour ce module.")
    path = os.path.join(CONTENT_DIR, result.data["notebook_path"])
    if not os.path.exists(path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier notebook introuvable.")
    return path


@router.get("/{module_id}/notebook")
def get_notebook_content(module_id: str, user=Depends(get_current_user)):
    """Retourne les cellules du notebook pour affichage dans le navigateur."""
    path = get_notebook_path(module_id)

    with open(path, encoding="utf-8") as f:
        nb = json.load(f)

    cells = []
    for cell in nb.get("cells", []):
        cell_type = cell.get("cell_type")
        source    = "".join(cell.get("source", []))

        outputs = []
        for out in cell.get("outputs", []):
            if out.get("output_type") in ("display_data", "execute_result"):
                data = out.get("data", {})
                if "image/png" in data:
                    outputs.append({"type": "image", "data": data["image/png"]})
                elif "text/html" in data:
                    outputs.append({"type": "html", "data": "".join(data["text/html"])})
                elif "text/plain" in data:
                    outputs.append({"type": "text", "data": "".join(data["text/plain"])})
            elif out.get("output_type") == "stream":
                outputs.append({"type": "text", "data": "".join(out.get("text", []))})

        cells.append({"cell_type": cell_type, "source": source, "outputs": outputs})

    return {"cells": cells, "total": len(cells)}


@router.get("/{module_id}/download")
def download_notebook(module_id: str, user=Depends(get_current_user)):
    """Télécharge le fichier .ipynb original."""
    path = get_notebook_path(module_id)
    filename = os.path.basename(path)
    return FileResponse(
        path=path,
        media_type="application/octet-stream",
        filename=filename,
    )
