from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import logging

# ─── Config ──────────────────────────────────────────────────────────────────

class Settings(BaseSettings):
    api_key: str = "change-me"
    seuil_doublon: float = 0.85

    class Config:
        env_file = ".env"

settings = Settings()
logger = logging.getLogger("dupli-service")

# ─── Modèle ML (chargé une seule fois au démarrage) ──────────────────────────

logger.info("Chargement du modèle...")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
logger.info("Modèle prêt ✅")

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(title="Dupli Service — Atlasia", version="1.0.0")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != settings.api_key:
        raise HTTPException(status_code=403, detail="API Key invalide")

# ─── Modèles ─────────────────────────────────────────────────────────────────

class Annonce(BaseModel):
    id: int
    titre: str
    description: str

class DoublonResult(BaseModel):
    annonce_1: int
    annonce_2: int
    similarite: float
    statut: str  # DOUBLON_PROBABLE | DOUBLON_CERTAIN

# ─── Logique ─────────────────────────────────────────────────────────────────

def detecter_doublons(annonces: list[Annonce]) -> list[DoublonResult]:
    textes = [f"{a.titre} {a.description}" for a in annonces]
    embeddings = model.encode(textes)
    similarites = cosine_similarity(embeddings)

    resultats = []
    for i in range(len(annonces)):
        for j in range(i+1, len(annonces)):
            score = float(similarites[i][j])
            if score > settings.seuil_doublon:
                resultats.append(DoublonResult(
                    annonce_1=annonces[i].id,
                    annonce_2=annonces[j].id,
                    similarite=round(score * 100, 1),
                    statut="DOUBLON_CERTAIN" if score >= 0.95 else "DOUBLON_PROBABLE"
                ))
    return resultats

# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "dupli-service"}

@app.post("/api/dupli/verifier", response_model=list[DoublonResult])
def verifier_doublons(annonces: list[Annonce], _: str = Depends(verify_api_key)):
    if len(annonces) < 2:
        raise HTTPException(status_code=400, detail="Minimum 2 annonces requises")
    if len(annonces) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 annonces par requête")
    
    resultats = detecter_doublons(annonces)
    logger.info(f"{len(resultats)} doublon(s) détecté(s) sur {len(annonces)} annonces")
    return resultats