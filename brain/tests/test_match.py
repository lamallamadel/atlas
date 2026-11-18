import pytest
from fastapi.testclient import TestClient

from main import app, settings
from match.engine import Bien, Criteria, exclusion_reason, match, score_bien

client = TestClient(app)
HEADERS = {"X-API-Key": settings.api_key}


def bien(**kw) -> Bien:
    base = {"id": 1, "type": "SALE", "category": "APARTMENT", "city": "Tanger", "price": 1_000_000, "surface": 90}
    base.update(kw)
    return Bien(**base)


# ─── Filtres éliminatoires ───────────────────────────────────────────────────

@pytest.mark.parametrize("criteres,b,reason", [
    (Criteria(transaction_types=["RENT"]), bien(type="SALE"), "type de transaction"),
    (Criteria(categories=["HOUSE"]), bien(category="APARTMENT"), "catégorie"),
    (Criteria(cities=["Rabat"]), bien(city="Tanger"), "ville"),
    (Criteria(budget_max=900_000), bien(price=1_000_000), "budget"),  # +11 % > tolérance
])
def test_exclusions(criteres, b, reason):
    assert exclusion_reason(criteres, b) == reason


def test_pas_d_exclusion_dans_la_tolerance_et_variantes():
    assert exclusion_reason(Criteria(budget_max=950_000), bien(price=1_000_000)) is None  # +5 %
    assert exclusion_reason(Criteria(transaction_types=["RENT"]), bien(type="RENTAL")) is None
    assert exclusion_reason(Criteria(cities=["tanger"]), bien(city="Tanger")) is None
    assert exclusion_reason(Criteria(cities=["Fès"]), bien(city="Fes")) is None


# ─── Score et raisons ────────────────────────────────────────────────────────

def test_bien_parfait_100_avec_raisons_reelles():
    c = Criteria(budget_min=800_000, budget_max=1_100_000, surface_min=80, cities=["Tanger"],
                 furnished=True, equipments=["piscine"], accepted_conditions=["neuf", "bon_etat"])
    b = bien(vision_meuble=True, vision_etat="bon_etat", vision_equipements=["piscine"])
    r = score_bien(c, b)
    assert r.score_match == 100
    assert r.alertes == []
    assert "Dans le budget (1 000 000 MAD)" in r.raisons
    assert "Piscine (vu sur les photos)" in r.raisons
    assert "État : bon état" in r.raisons


def test_seuls_les_criteres_renseignes_comptent():
    r = score_bien(Criteria(surface_min=80), bien(surface=90))
    assert r.score_match == 100
    assert set(r.details) == {"surface"}


def test_depassement_de_budget_penalise():
    r = score_bien(Criteria(budget_max=1_000_000), bien(price=1_050_000))
    assert r.score_match == 50
    assert r.alertes == ["Dépasse le budget de 5 % (1 050 000 MAD)"]


def test_surface_trop_petite():
    r = score_bien(Criteria(surface_min=100), bien(surface=80))
    assert r.score_match == 64  # (80/100)²
    assert "Surface inférieure" in r.alertes[0]


def test_equipement_mentionne_vaut_moins_que_vu():
    c = Criteria(equipments=["parking", "vue mer"])
    vu = score_bien(c, bien(vision_equipements=["place de parking"], vision_vues=["vue sur la mer"]))
    declare = score_bien(c, bien(description="Garage et vue sur mer"))
    absent = score_bien(c, bien())
    assert vu.score_match == 100
    assert declare.score_match == 80
    assert "Parking (mentionné dans l'annonce)" in declare.raisons
    assert absent.score_match == 0
    assert "Vue mer : non trouvé" in absent.alertes


def test_photos_non_analysees_ne_sont_pas_inventees():
    r = score_bien(Criteria(furnished=True, accepted_conditions=["neuf"]), bien())
    assert r.score_match == 50
    assert "Meublé : non vérifié" in r.alertes
    assert "État non vérifié (photos non analysées)" in r.alertes
    assert r.raisons == []


def test_etat_et_meuble_contraires():
    r = score_bien(Criteria(furnished=False, accepted_conditions=["neuf"]),
                   bien(vision_meuble=True, vision_etat="a_renover"))
    assert r.score_match == 0
    assert "Meublé alors que non souhaité" in r.alertes


def test_fraude_et_doublon_penalises_sans_exclure():
    c = Criteria(surface_min=80)
    assert score_bien(c, bien(fraud_statut="FRAUDULEUX")).score_match == 70
    suspect = score_bien(c, bien(fraud_statut="SUSPECT", duplicate_statut="DOUBLON_CERTAIN"))
    assert suspect.score_match == 90
    assert suspect.alertes[0] == "Annonce signalée comme suspecte"
    assert "Doublon possible d'une autre annonce" in suspect.alertes


def test_tri_limite_et_comptage_des_exclus():
    c = Criteria(cities=["Tanger"], surface_min=100)
    biens = [bien(id=1, surface=100), bien(id=2, surface=60), bien(id=3, city="Rabat"), bien(id=4, surface=120)]
    results, excluded = match(c, biens, limit=2)
    assert [r.bien_id for r in results] == [1, 4]
    assert excluded == {"ville": 1}


# ─── Endpoint ────────────────────────────────────────────────────────────────

def test_endpoint():
    body = {
        "client_id": 7,
        "criteres": {"cities": ["Tanger"], "budget_max": 1_200_000},
        "biens": [bien(id=1).model_dump(), bien(id=2, city="Rabat").model_dump()],
    }
    r = client.post("/api/match/calculer", json=body, headers=HEADERS)
    assert r.status_code == 200
    data = r.json()
    assert [m["bien_id"] for m in data["matches"]] == [1]
    assert data["exclus"] == {"ville": 1}
    assert data["total_biens"] == 2


def test_endpoint_sans_critere_refuse():
    r = client.post("/api/match/calculer", json={"client_id": 7, "biens": []}, headers=HEADERS)
    assert r.status_code == 422
    assert "critère" in r.json()["detail"]


def test_endpoint_budget_incoherent_refuse():
    body = {"client_id": 7, "criteres": {"budget_min": 2_000_000, "budget_max": 1_000_000}}
    assert client.post("/api/match/calculer", json=body, headers=HEADERS).status_code == 422
