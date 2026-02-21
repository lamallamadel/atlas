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
logger = logging.getLogger("nego-service")

app = FastAPI(title="Negotiation Optimizer API", version="1.0.0")

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

class NegoRequest(BaseModel):
    prix_demande: float
    prix_offre: float
    duree_sur_marche_jours: int

class NegoResponse(BaseModel):
    probabilite_acceptation: int # 0-100
    conseil: str
    contre_proposition_optimale: float

def analyser_nego(req: NegoRequest) -> NegoResponse:
    ecart = (req.prix_demande - req.offre) / req.prix_demande
    
    # Stratégie très basique
    if req.duree_sur_marche_jours > 180:
        prob = max(10, 100 - int(ecart * 200)) # Tolère plus grand écart si sur le marché depuis longtemps
    else:
        prob = max(0, 100 - int(ecart * 300))
        
    conseil = "L'offre est trop basse, risque de refus net." if prob < 30 else "L'offre a de bonnes chances de passer ou de déclencher une contre-offre."
    opt = req.prix_demande * 0.95 # Suggère -5%
    
    return NegoResponse(
        probabilite_acceptation=prob,
        conseil=conseil,
        contre_proposition_optimale=opt
    )

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/api/nego/analyser", response_model=NegoResponse)
def analyser(req: NegoRequest, _: str = Depends(verify_api_key)):
    start = time.time()
    # Correct Pydantic issue (offre vs prix_offre in method)
    req.offre = req.prix_offre
    result = analyser_nego(req)
    logger.info(f"Nego [{req.prix_demande} vs {req.prix_offre}] → {result.probabilite_acceptation}% ({round((time.time()-start)*1000)}ms)")
    return result
