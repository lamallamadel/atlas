from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from config import settings
from security import verify_api_key
from sklearn.metrics.pairwise import cosine_similarity
from functools import lru_cache
import logging

logger = logging.getLogger("dupli-service")

# ─── Modèle ML (chargé une seule fois, au premier appel) ─────────────────────
# Chargement paresseux : le brain démarre sans attendre le modèle, et les tests
# des autres modules n'ont pas besoin de sentence-transformers.

@lru_cache(maxsize=1)
def get_model():
    from sentence_transformers import SentenceTransformer
    logger.info("Chargement du modèle %s...", settings.dupli_model_name)
    model = SentenceTransformer(settings.dupli_model_name)
    logger.info("Modèle prêt")
    return model

# ─── App ─────────────────────────────────────────────────────────────────────

router = APIRouter()


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
    embeddings = get_model().encode(textes)
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

@router.post("/api/dupli/verifier", response_model=list[DoublonResult])
def verifier_doublons(annonces: list[Annonce], _: str = Depends(verify_api_key)):
    if len(annonces) < 2:
        raise HTTPException(status_code=400, detail="Minimum 2 annonces requises")
    if len(annonces) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 annonces par requête")
    
    resultats = detecter_doublons(annonces)
    logger.info(f"{len(resultats)} doublon(s) détecté(s) sur {len(annonces)} annonces")
    return resultats