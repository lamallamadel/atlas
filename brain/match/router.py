from fastapi import APIRouter, Depends
from pydantic import BaseModel

from security import verify_api_key
import logging
import time


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("match-service")

router = APIRouter()


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

@router.post("/api/match/calculer", response_model=MatchResponse)
def calculer(req: MatchRequest, _: str = Depends(verify_api_key)):
    start = time.time()
    result = calculer_match(req)
    logger.info(f"Match [{req.client_id}] → {len(result.matches)} biens ({round((time.time()-start)*1000)}ms)")
    return result
