from fastapi.testclient import TestClient

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app, settings

settings.api_key = "test-key"

client = TestClient(app)
HEADERS = {"X-API-Key": "test-key"}


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_prix_normal_sain():
    resp = client.post(
        "/api/fraud/analyser",
        json={
            "titre": "Appartement Casablanca",
            "prix": 2_000_000,
            "surface": 100,
            "ville": "Casablanca",
        },
        headers=HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["statut"] == "SAIN"
    assert data["score_fraude"] < 25


def test_prix_tres_bas_frauduleux():
    resp = client.post(
        "/api/fraud/analyser",
        json={"titre": "Annonce suspecte", "prix": 1000, "surface": 100},
        headers=HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["statut"] in ("SUSPECT", "FRAUDULEUX")
    assert data["score_fraude"] >= 25
    assert len(data["alertes"]) > 0


def test_prix_extremement_bas_frauduleux():
    resp = client.post(
        "/api/fraud/analyser",
        json={"titre": "Arnaque évidente", "prix": 100, "surface": 80},
        headers=HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["statut"] == "FRAUDULEUX"
    assert data["score_fraude"] >= 60


def test_vendeur_nouveau_alerte():
    resp = client.post(
        "/api/fraud/analyser",
        json={
            "titre": "Offre douteuse",
            "prix": 50_000,
            "surface": 50,
            "vendeur_nouveau": True,
        },
        headers=HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert any("historique" in a for a in data["alertes"])


def test_incoh_ville_casablanca():
    resp = client.post(
        "/api/fraud/analyser",
        json={
            "titre": "Appart Casa trop bon marché",
            "prix": 100_000,
            "surface": 100,
            "ville": "Casablanca",
        },
        headers=HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["statut"] in ("SUSPECT", "FRAUDULEUX")


def test_studio_surface_incoh():
    resp = client.post(
        "/api/fraud/analyser",
        json={
            "titre": "Studio géant",
            "prix": 500_000,
            "surface": 120,
            "type_bien": "STUDIO",
        },
        headers=HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["alertes"]) > 0


def test_api_key_invalide():
    resp = client.post(
        "/api/fraud/analyser",
        json={"titre": "Test", "prix": 100_000, "surface": 50},
        headers={"X-API-Key": "wrong-key"},
    )
    assert resp.status_code == 403


def test_prix_negatif():
    resp = client.post(
        "/api/fraud/analyser",
        json={"titre": "Test", "prix": -100, "surface": 50},
        headers=HEADERS,
    )
    assert resp.status_code == 422


def test_surface_nulle():
    resp = client.post(
        "/api/fraud/analyser",
        json={"titre": "Test", "prix": 100_000, "surface": 0},
        headers=HEADERS,
    )
    assert resp.status_code == 422
