from fastapi import FastAPI

app = FastAPI(
    title="ATS RANDA",
    version="1.0.0",
    description="Application de Traitement Automatisé des Candidatures"
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ATS RANDA"}