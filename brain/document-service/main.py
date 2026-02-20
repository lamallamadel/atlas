from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import logging
import time
import httpx

class Settings(BaseSettings):
    api_key: str = "change-me-in-production"
    allowed_origins: list[str] = ["http://localhost:8080", "http://localhost:4200"]
    ollama_url: str = "http://ollama:11434"
    ollama_model: str = "mistral:7b"
    ollama_enabled: bool = False
    class Config:
        env_file = ".env"

settings = Settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("document-service")

app = FastAPI(title="Atlas IA Document Service", version="1.0.0")

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

class VerifyRequest(BaseModel):
    document_id: int
    category: str
    file_name: str
    content_snippet: str | None = None

class VerifyResponse(BaseModel):
    is_valid: bool
    confidence: float
    analysis: str
    flags: list[str]

class ContractRequest(BaseModel):
    dossier_id: int
    buyer_name: str | None = None
    seller_name: str | None = None
    property_address: str | None = None
    agreed_price: float | None = None

class ContractResponse(BaseModel):
    content: str
    status: str

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

def mock_verify(req: VerifyRequest) -> VerifyResponse:
    category = req.category.upper() if req.category else "UNKNOWN"
    if category == "DPE":
        return VerifyResponse(
            is_valid=True,
            confidence=0.92,
            analysis="DPE valide. Classe énergétique C détectée. Date d'expiration conforme.",
            flags=[]
        )
    elif category == "AMIANTE":
        return VerifyResponse(
            is_valid=False,
            confidence=0.88,
            analysis="Anomalie détectée : La date de réalisation semble expirer le mois prochain. Traces signalées dans le rapport.",
            flags=["EXPIRING_SOON", "TRACES_DETECTED"]
        )
    
    return VerifyResponse(
        is_valid=True,
        confidence=0.5,
        analysis=f"Document de type {category} analysé avec succès (validation standard).",
        flags=[]
    )

@app.post("/api/document/verify", response_model=VerifyResponse)
async def verify_document(req: VerifyRequest, _: str = Depends(verify_api_key)):
    start = time.time()
    
    # Simulate LLM parsing or rule-based document validation
    result = mock_verify(req)
        
    logger.info(f"Verify [{req.file_name}] -> Valid: {result.is_valid} ({round((time.time()-start)*1000)}ms)")
    return result

@app.post("/api/document/generate-contract", response_model=ContractResponse)
async def generate_contract(req: ContractRequest, _: str = Depends(verify_api_key)):
    start = time.time()
    
    # Simulate Contract generation via LLM
    price_str = f"{req.agreed_price:,.2f} €" if req.agreed_price else "________ €"
    buyer = req.buyer_name or "M./Mme _____________________"
    seller = req.seller_name or "M./Mme _____________________"
    address = req.property_address or "________________________________"
    
    content = f"""# COMPROMIS DE VENTE
    
**Entre les soussignés :**
LE VENDEUR : {seller}
ET
L'ACQUÉREUR : {buyer}

**IL A ÉTÉ CONVENU CE QUI SUIT :**
Le vendeur vend à l'acquéreur le bien immobilier situé à l'adresse suivante :
{address}

**PRIX AINSI CONVENU :**
La présente vente est consentie et acceptée moyennant le prix principal de : {price_str}

*Ceci est un document généré automatiquement par l'IA Atlas. Il doit être relu et validé par un conseiller juridique avant signature.*
    """
    
    logger.info(f"Contract generated for Dossier {req.dossier_id} ({round((time.time()-start)*1000)}ms)")
    return ContractResponse(content=content, status="DRAFT_GENERATED")
