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
logger = logging.getLogger("proposal-service")

app = FastAPI(title="Proposal Generator API", version="1.0.0")

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

class ProposalRequest(BaseModel):
    client_name: str
    biens: list[dict]
    tonality: str = "professionnel"

class ProposalResponse(BaseModel):
    sujet: str
    message: str

def generer_proposition(req: ProposalRequest) -> ProposalResponse:
    # TODO: Intégrer LLM pour générer le texte
    Count = len(req.biens)
    msg = f"Bonjour {req.client_name},\n\nSuite à notre échange, voici {Count} biens qui pourraient vous intéresser :\n\n"
    for b in req.biens:
        msg += f"- {b.get('titre', 'Bien')} à {b.get('prix', 'Prix sur demande')} MAD\n"
    msg += "\nCordialement,\nVotre agent Atlas."
    
    return ProposalResponse(sujet=f"Votre sélection de {Count} biens", message=msg)

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/api/proposal/generer", response_model=ProposalResponse)
def generer(req: ProposalRequest, _: str = Depends(verify_api_key)):
    start = time.time()
    result = generer_proposition(req)
    logger.info(f"Proposal [{req.client_name}] → {len(req.biens)} biens ({round((time.time()-start)*1000)}ms)")
    return result
