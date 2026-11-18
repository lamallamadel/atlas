from fastapi import APIRouter, Depends
from pydantic import BaseModel

from security import verify_api_key
import logging
import time


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("proposal-service")

router = APIRouter()


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

@router.post("/api/proposal/generer", response_model=ProposalResponse)
def generer(req: ProposalRequest, _: str = Depends(verify_api_key)):
    start = time.time()
    result = generer_proposition(req)
    logger.info(f"Proposal [{req.client_name}] → {len(req.biens)} biens ({round((time.time()-start)*1000)}ms)")
    return result
