from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from agent.router import router as agent_router
from document.router import router as document_router
from dupli.router import router as dupli_router
from fraud.router import router as fraud_router
from match.router import router as match_router
from nego.router import router as nego_router
from proposal.router import router as proposal_router
from scoring.router import router as scoring_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("brain.main")

app = FastAPI(title="Atlas Brain Monolith", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

routers = [
    ("Agent", agent_router),
    ("Document", document_router),
    ("Duplication", dupli_router),
    ("Fraud", fraud_router),
    ("Match", match_router),
    ("Nego", nego_router),
    ("Proposal", proposal_router),
    ("Scoring", scoring_router),
]

for name, r in routers:
    app.include_router(r, tags=[name])

@app.get("/health")
def root_health():
    return {"status": "ok", "version": "2.0.0", "service": "brain-monolith"}
