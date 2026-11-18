from fastapi.testclient import TestClient

from main import app, settings

client = TestClient(app)
HEADERS = {"X-API-Key": settings.api_key}
URL = "/api/nego/analyser"


def analyser(prix_demande, prix_offre, jours=30):
    return client.post(
        URL,
        json={
            "prix_demande": prix_demande,
            "prix_offre": prix_offre,
            "duree_sur_marche_jours": jours,
        },
        headers=HEADERS,
    )


def test_offre_proche_du_prix():
    resp = analyser(1_000_000, 980_000)
    assert resp.status_code == 200
    data = resp.json()
    assert data["probabilite_acceptation"] == 94
    assert data["contre_proposition_optimale"] == 950_000
    assert "bonnes chances" in data["conseil"]


def test_offre_trop_basse():
    data = analyser(1_000_000, 700_000).json()
    assert data["probabilite_acceptation"] == 10
    assert "trop basse" in data["conseil"]


def test_bien_ancien_sur_le_marche_tolere_un_ecart_plus_grand():
    recent = analyser(1_000_000, 800_000, jours=30).json()
    ancien = analyser(1_000_000, 800_000, jours=200).json()
    assert ancien["probabilite_acceptation"] > recent["probabilite_acceptation"]


def test_offre_au_dessus_du_prix_plafonnee_a_100():
    data = analyser(1_000_000, 1_100_000).json()
    assert data["probabilite_acceptation"] == 100


def test_prix_demande_nul_refuse():
    assert analyser(0, 500_000).status_code == 422
