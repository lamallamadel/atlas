"""Matching acheteur ↔ biens. Voir match/engine.py pour l'algorithme."""

import logging
import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from match.engine import Bien, Criteria, MatchResult, match
from security import verify_api_key

logger = logging.getLogger("match-service")

router = APIRouter()


class MatchRequest(BaseModel):
    client_id: int
    criteres: Criteria = Criteria()
    biens: list[Bien] = Field(default=[], max_length=1000)
    limit: int = Field(default=50, ge=1, le=200)


class MatchResponse(BaseModel):
    matches: list[MatchResult]
    exclus: dict[str, int]
    total_biens: int


@router.post("/api/match/calculer", response_model=MatchResponse)
def calculer(req: MatchRequest, _: str = Depends(verify_api_key)):
    if req.criteres.is_empty():
        raise HTTPException(status_code=422, detail="Aucun critère de recherche renseigné.")
    if (
        req.criteres.budget_min is not None
        and req.criteres.budget_max is not None
        and req.criteres.budget_min > req.criteres.budget_max
    ):
        raise HTTPException(status_code=422, detail="Budget minimum supérieur au budget maximum.")
    start = time.time()
    results, excluded = match(req.criteres, req.biens, req.limit)
    logger.info(
        "Match [%s] → %d/%d biens retenus (%dms)",
        req.client_id, len(results), len(req.biens), round((time.time() - start) * 1000),
    )
    return MatchResponse(matches=results, exclus=excluded, total_biens=len(req.biens))


# ─── Extraction des critères depuis les notes et messages du client ──────────

from match.extract import extract_criteria  # noqa: E402


class Texte(BaseModel):
    source: str = Field(default="message", max_length=30)
    texte: str = Field(max_length=4000)


class ExtractionRequest(BaseModel):
    textes: list[Texte] = Field(max_length=100)


class ExtractionResponse(BaseModel):
    criteres: dict
    preuves: dict[str, str]
    moteur: str


@router.post("/api/match/extraire-criteres", response_model=ExtractionResponse)
async def extraire_criteres(req: ExtractionRequest, _: str = Depends(verify_api_key)):
    textes = [t.model_dump() for t in req.textes if t.texte.strip()]
    if not textes:
        raise HTTPException(status_code=422, detail="Aucun texte à analyser.")
    criteres, preuves, moteur = await extract_criteria(textes)
    logger.info("Extraction critères : %d champ(s) via %s", len(criteres), moteur)
    return ExtractionResponse(criteres=criteres, preuves=preuves, moteur=moteur)


# ─── Matching inverse : un bien face à plusieurs acheteurs ───────────────────

from match.engine import exclusion_reason, score_bien  # noqa: E402


class Acheteur(BaseModel):
    client_id: int
    criteres: Criteria


class AcheteursRequest(BaseModel):
    bien: Bien
    acheteurs: list[Acheteur] = Field(default=[], max_length=2000)
    seuil: int = Field(default=0, ge=0, le=100)


class AcheteurResult(BaseModel):
    client_id: int
    score_match: int
    raisons: list[str]
    alertes: list[str]


class AcheteursResponse(BaseModel):
    resultats: list[AcheteurResult]
    exclus: int
    sous_seuil: int


@router.post("/api/match/acheteurs", response_model=AcheteursResponse)
def acheteurs(req: AcheteursRequest, _: str = Depends(verify_api_key)):
    """Acheteurs dont les critères correspondent au bien, au-dessus du seuil, triés par score."""
    results: list[AcheteurResult] = []
    excluded = below = 0
    for a in req.acheteurs:
        if a.criteres.is_empty():
            continue
        if exclusion_reason(a.criteres, req.bien):
            excluded += 1
            continue
        r = score_bien(a.criteres, req.bien)
        if r.score_match < req.seuil:
            below += 1
            continue
        results.append(AcheteurResult(client_id=a.client_id, score_match=r.score_match, raisons=r.raisons, alertes=r.alertes))
    results.sort(key=lambda x: (-x.score_match, x.client_id))
    logger.info("Matching inverse bien %s : %d acheteur(s) retenu(s) sur %d", req.bien.id, len(results), len(req.acheteurs))
    return AcheteursResponse(resultats=results, exclus=excluded, sous_seuil=below)


# ---------- Message de proposition d'un bien à un acheteur ----------

from match.pitch import PitchRequest, PitchResponse, generate_pitch  # noqa: E402


@router.post("/api/match/proposition", response_model=PitchResponse)
async def proposition(req: PitchRequest, _: str = Depends(verify_api_key)):
    """Brouillon de message (WhatsApp ou SMS) à relire par l'agent avant envoi."""
    return await generate_pitch(req)


# ---------- Réponse du client à une proposition ----------

from match.reply import ReponseRequest, ReponseResponse, analyse_reply  # noqa: E402


@router.post("/api/match/reponse", response_model=ReponseResponse)
async def reponse(req: ReponseRequest, _: str = Depends(verify_api_key)):
    """Intention du client (visite, intérêt, négociation…) et disponibilités lues dans sa réponse."""
    return await analyse_reply(req)
