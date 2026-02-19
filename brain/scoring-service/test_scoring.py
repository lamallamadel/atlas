from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
API_KEY = "change-me-in-production"
HEADERS = {"X-API-Key": API_KEY}


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_scorer_bien_basique():
    payload = {"titre": "Appart Tanger", "prix": 850000, "surface": 85, "etage": 3}
    response = client.post("/api/scoring/bien", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 100
    assert data["prix_m2"] == round(850000 / 85, 2)


def test_scorer_bien_prix_eleve():
    payload = {"titre": "Penthouse", "prix": 5000000, "surface": 150, "etage": 10}
    response = client.post("/api/scoring/bien", json=payload, headers=HEADERS)
    assert response.status_code == 200
    assert response.json()["score"] < 100


def test_scorer_bien_sans_api_key():
    payload = {"titre": "Test", "prix": 500000, "surface": 80, "etage": 2}
    response = client.post("/api/scoring/bien", json=payload)
    assert response.status_code == 403


def test_scorer_bien_surface_invalide():
    payload = {"titre": "Test", "prix": 500000, "surface": -10, "etage": 2}
    response = client.post("/api/scoring/bien", json=payload, headers=HEADERS)
    assert response.status_code == 422


def test_scorer_biens_batch():
    biens = [
        {"titre": "Bien 1", "prix": 500000, "surface": 80, "etage": 2},
        {"titre": "Bien 2", "prix": 1200000, "surface": 60, "etage": 0},
    ]
    response = client.post("/api/scoring/biens", json=biens, headers=HEADERS)
    assert response.status_code == 200
    assert len(response.json()) == 2
