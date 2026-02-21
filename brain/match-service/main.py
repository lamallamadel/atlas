from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import logging
import time

class Settings(BaseSettings):
    api_key: str = "change-me-in-production"
    allowed_origins: list[str] = ["http://localhost:8080", "http://localhost:4200"]
    class Config:
        env_file = ".env"

settings = Settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("match-service")

app = FastAPI(title="Match Immobilier API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != settings.api_key:
        logger.warning("Tentative d'accès avec une clé invalide")
        raise HTTPException(status_code=403, detail="API Key invalide")
    return api_key

class MatchRequest(BaseModel):
    client_id: int
    preferences: dict
    biens: list[dict]

class MatchResponse(BaseModel):
    matches: list[dict]

def calculer_match(req: MatchRequest) -> MatchResponse:
    # TODO: Implémenter le vrai matching
    # Pour l'instant on retourne tout avec un score aléatoire
    import random
    matches = []
    for b in req.biens:
        matches.append({
            "bien_id": b.get("id"),
            "score_match": random.randint(50, 95),
            "raisons": ["Correspondance budget", "Secteur recherché"]
        })
    return MatchResponse(matches=sorted(matches, key=lambda x: x["score_match"], reverse=True))

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/api/match/calculer", response_model=MatchResponse)
def calculer(req: MatchRequest, _: str = Depends(verify_api_key)):
    start = time.time()
    result = calculer_match(req)
    logger.info(f"Match [{req.client_id}] → {len(result.matches)} biens ({round((time.time()-start)*1000)}ms)")
    return result
