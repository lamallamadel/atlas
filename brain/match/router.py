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
