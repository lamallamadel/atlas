from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from pydantic_settings import BaseSettings
from typing import Optional
import logging
import time

# ─── Configuration ───────────────────────────────────────────────────────────

class Settings(BaseSettings):
    api_key: str = "change-me-in-production"
    allowed_origins: list[str] = ["http://localhost:8080", "http://localhost:4200"]

    class Config:
        env_file = ".env"

settings = Settings()

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scoring-service")

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(title="Scoring Immobilier API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Sécurité API Key ────────────────────────────────────────────────────────

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != settings.api_key:
        logger.warning("Tentative d'accès avec une clé invalide")
        raise HTTPException(status_code=403, detail="API Key invalide")
    return api_key

# ─── Modèles ─────────────────────────────────────────────────────────────────

class BienRequest(BaseModel):
    titre: str
    prix: float
    surface: float
    etage: int
    ville: Optional[str] = None
    type_bien: Optional[str] = None
    annee_construction: Optional[int] = None
    proximite_mer: Optional[bool] = False

    @field_validator("prix")
    def prix_positif(cls, v):
        if v <= 0:
            raise ValueError("Le prix doit être positif")
        return v

    @field_validator("surface")
    def surface_positive(cls, v):
        if v <= 0:
            raise ValueError("La surface doit être positive")
        return v

class ScoreResponse(BaseModel):
    titre: str
    score: int
    prix_m2: float
    details: dict

# ─── Algorithme de scoring ───────────────────────────────────────────────────

def score_bien(bien: BienRequest) -> ScoreResponse:
    prix_m2 = bien.prix / bien.surface
    score = 100
    details = {}

    if prix_m2 > 20000:
        score -= 30
        details["prix_m2"] = "Très élevé (-30)"
    elif prix_m2 > 15000:
        score -= 20
        details["prix_m2"] = "Élevé (-20)"
    elif prix_m2 > 10000:
        score -= 10
        details["prix_m2"] = "Modéré (-10)"
    else:
        details["prix_m2"] = "Bon prix ✓"

    if bien.etage == 0:
        score -= 10
        details["etage"] = "Rez-de-chaussée (-10)"
    else:
        details["etage"] = f"Étage {bien.etage} ✓"

    if bien.surface > 200:
        score += 5
        details["surface"] = "Grande surface (+5)"

    if bien.proximite_mer:
        score += 10
        details["proximite_mer"] = "Proximité mer (+10)"

    if bien.annee_construction and bien.annee_construction >= 2018:
        score += 5
        details["construction"] = "Construction récente (+5)"

    return ScoreResponse(
        titre=bien.titre,
        score=max(0, min(score, 100)),
        prix_m2=round(prix_m2, 2),
        details=details
    )

# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/api/scoring/bien", response_model=ScoreResponse)
def scorer_bien(bien: BienRequest, _: str = Depends(verify_api_key)):
    start = time.time()
    result = score_bien(bien)
    logger.info(f"Scoring [{bien.titre}] → {result.score}/100 ({round((time.time()-start)*1000)}ms)")
    return result

@app.post("/api/scoring/biens", response_model=list[ScoreResponse])
def scorer_biens(biens: list[BienRequest], _: str = Depends(verify_api_key)):
    if len(biens) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 biens par requête")
    return [score_bien(b) for b in biens]
