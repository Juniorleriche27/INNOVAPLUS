from fastapi import FastAPI
from app.routers import chatlaya

app = FastAPI(title="INNOVA+ / CHATLAYA API")


@app.get("/healthz")
def healthz():
    return {"ok": True}


app.include_router(chatlaya.router)

