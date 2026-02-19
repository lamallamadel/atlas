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
logger = logging.getLogger("fraud-service")

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(title="Fraud Detection Immobilier API", version="1.0.0")

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


class FraudRequest(BaseModel):
    titre: str
    prix: float
    surface: float
    ville: Optional[str] = None
    type_bien: Optional[str] = None
    vendeur_nouveau: Optional[bool] = False

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


class FraudResponse(BaseModel):
    titre: str
    statut: str  # SAIN | SUSPECT | FRAUDULEUX
    score_fraude: int  # 0-100 (0 = propre, 100 = fraude certaine)
    alertes: list[str]
    details: dict


# ─── Références prix/m² minimum par ville (MAD) ──────────────────────────────

PRIX_M2_MIN_MARCHE = {
    "casablanca": 8000,
    "marrakech": 7000,
    "rabat": 6000,
    "tanger": 5000,
    "agadir": 4000,
    "fes": 4000,
    "meknes": 3000,
}

PRIX_M2_SUSPECT_GLOBAL = 2000  # En dessous de ce seuil n'importe où → suspect
PRIX_M2_FRAUDE_GLOBALE = 500  # En dessous → très probablement frauduleux


# ─── Algorithme de détection de fraude ───────────────────────────────────────


def analyser_fraude(req: FraudRequest) -> FraudResponse:
    score_fraude = 0
    alertes = []
    details = {}

    prix_m2 = req.prix / req.surface
    details["prix_m2"] = round(prix_m2, 2)

    # 1. Prix anormalement bas (seuils globaux)
    if prix_m2 < PRIX_M2_FRAUDE_GLOBALE:
        score_fraude += 60
        alertes.append(
            f"Prix/m² extrêmement bas ({prix_m2:.0f} MAD/m²) — possible fraude"
        )
        details["alerte_prix"] = "Prix quasi nul — très suspect"
    elif prix_m2 < PRIX_M2_SUSPECT_GLOBAL:
        score_fraude += 35
        alertes.append(
            f"Prix/m² très bas ({prix_m2:.0f} MAD/m²) — inférieur au minimum national"
        )
        details["alerte_prix"] = "Prix bien en dessous du minimum national"

    # 2. Incohérence prix/ville
    if req.ville:
        ville_lower = req.ville.lower().strip()
        seuil_ville = PRIX_M2_MIN_MARCHE.get(ville_lower)
        if seuil_ville and prix_m2 < seuil_ville * 0.4:
            score_fraude += 25
            alertes.append(
                f"Prix/m² de {prix_m2:.0f} MAD/m² incohérent pour {req.ville} "
                f"(attendu ≥ {seuil_ville} MAD/m²)"
            )
            details["alerte_ville"] = f"Prix incohérent avec le marché de {req.ville}"

    # 3. Vendeur sans historique
    if req.vendeur_nouveau:
        score_fraude += 15
        alertes.append("Vendeur sans historique — risque accru")
        details["alerte_vendeur"] = "Premier dépôt d'annonce"

    # 4. Incohérence surface / type de bien
    if req.type_bien:
        type_upper = req.type_bien.upper()
        if type_upper == "STUDIO" and req.surface > 60:
            score_fraude += 15
            alertes.append(f"Studio de {req.surface} m² — surface incohérente")
            details["alerte_surface"] = "Studio trop grand"
        elif type_upper in ("APPARTEMENT", "STUDIO") and req.surface > 400:
            score_fraude += 10
            alertes.append(
                f"Surface de {req.surface} m² incohérente pour un {req.type_bien}"
            )
            details["alerte_surface"] = "Surface anormalement grande pour ce type"

    # 5. Prix suspicieusement rond (indicateur de test ou saisie fictive)
    if req.prix in (1.0, 10.0, 100.0, 1000.0, 10000.0):
        score_fraude += 10
        alertes.append("Prix anormalement rond — possible saisie fictive")
        details["alerte_prix_rond"] = str(req.prix)

    score_fraude = min(score_fraude, 100)

    if score_fraude >= 60:
        statut = "FRAUDULEUX"
    elif score_fraude >= 25:
        statut = "SUSPECT"
    else:
        statut = "SAIN"

    if not alertes:
        details["resultat"] = "Aucune anomalie détectée"

    return FraudResponse(
        titre=req.titre,
        statut=statut,
        score_fraude=score_fraude,
        alertes=alertes,
        details=details,
    )


# ─── Endpoints ───────────────────────────────────────────────────────────────


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/api/fraud/analyser", response_model=FraudResponse)
def analyser(req: FraudRequest, _: str = Depends(verify_api_key)):
    start = time.time()
    result = analyser_fraude(req)
    logger.info(
        f"Fraud [{req.titre}] → {result.statut} ({result.score_fraude}/100) "
        f"({round((time.time()-start)*1000)}ms)"
    )
    return result
