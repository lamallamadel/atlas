import pytest
from fastapi.testclient import TestClient

from main import app, settings

client = TestClient(app)

ENDPOINTS = [
    ("/api/scoring/bien", {"titre": "T", "prix": 1, "surface": 1, "etage": 1}),
    ("/api/fraud/analyser", {"titre": "T", "prix": 1, "surface": 1}),
    ("/api/match/calculer", {"client_id": 1, "preferences": {}, "biens": []}),
    ("/api/nego/analyser", {"prix_demande": 1, "prix_offre": 1, "duree_sur_marche_jours": 1}),
    ("/api/proposal/generer", {"client_name": "A", "biens": []}),
    ("/api/agent/process", {"query": "bonjour"}),
    ("/api/document/verify", {"document_id": 1, "category": "DPE", "file_name": "a.pdf"}),
    ("/api/dupli/verifier", []),
]


@pytest.mark.parametrize("url,body", ENDPOINTS)
def test_mauvaise_cle_refusee_partout(url, body):
    resp = client.post(url, json=body, headers={"X-API-Key": "mauvaise-cle"})
    assert resp.status_code == 403


@pytest.mark.parametrize("url,body", ENDPOINTS)
def test_cle_absente_refusee_partout(url, body):
    resp = client.post(url, json=body)
    assert resp.status_code in (401, 403)


def test_health_sans_cle():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["llm"] == {
        "openai": settings.openai_enabled,
        "ollama": settings.ollama_enabled,
    }
