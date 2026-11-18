from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from security import verify_api_key
import logging
import time


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nego-service")

router = APIRouter()


class NegoRequest(BaseModel):
    prix_demande: float = Field(gt=0)
    prix_offre: float = Field(gt=0)
    duree_sur_marche_jours: int = Field(ge=0)

class NegoResponse(BaseModel):
    probabilite_acceptation: int # 0-100
    conseil: str
    contre_proposition_optimale: float

def analyser_nego(req: NegoRequest) -> NegoResponse:
    ecart = (req.prix_demande - req.prix_offre) / req.prix_demande
    
    # Stratégie très basique
    if req.duree_sur_marche_jours > 180:
        prob = max(10, 100 - int(ecart * 200)) # Tolère plus grand écart si sur le marché depuis longtemps
    else:
        prob = max(0, 100 - int(ecart * 300))
    prob = min(prob, 100)  # Une offre au-dessus du prix demandé ne dépasse pas 100 %
        
    conseil = "L'offre est trop basse, risque de refus net." if prob < 30 else "L'offre a de bonnes chances de passer ou de déclencher une contre-offre."
    opt = req.prix_demande * 0.95 # Suggère -5%
    
    return NegoResponse(
        probabilite_acceptation=prob,
        conseil=conseil,
        contre_proposition_optimale=opt
    )

@router.post("/api/nego/analyser", response_model=NegoResponse)
def analyser(req: NegoRequest, _: str = Depends(verify_api_key)):
    start = time.time()
    result = analyser_nego(req)
    logger.info(f"Nego [{req.prix_demande} vs {req.prix_offre}] → {result.probabilite_acceptation}% ({round((time.time()-start)*1000)}ms)")
    return result
