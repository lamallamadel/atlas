import json

import pytest
from fastapi.testclient import TestClient

import match.extract as extract
from main import app, settings
from match.extract import keep_justified, parse_amount, redact, rules_extract

client = TestClient(app)
HEADERS = {"X-API-Key": settings.api_key}


@pytest.fixture(autouse=True)
def no_engines(monkeypatch):
    monkeypatch.setattr(settings, "openai_enabled", False)
    monkeypatch.setattr(settings, "ollama_enabled", False)


# ─── Montants (usage marocain) ───────────────────────────────────────────────

@pytest.mark.parametrize("number,unit,expected", [
    ("120", "millions", 1_200_000),   # millions de centimes
    ("1,2", "million", 1_200_000),    # millions de dirhams
    ("90", "مليون", 900_000),
    ("800", "k", 800_000),
    ("2", "MDH", 2_000_000),
    ("950 000", "dh", 950_000),
])
def test_montants(number, unit, expected):
    assert parse_amount(number, unit) == expected


def test_masquage_des_coordonnees():
    t = redact("Appelez-moi au +212 6 61 23 45 67 ou ali.b@gmail.com")
    assert "661" not in t and "gmail" not in t
    assert "[téléphone]" in t and "[email]" in t


# ─── Règles ──────────────────────────────────────────────────────────────────

def test_message_en_francais():
    c, p = rules_extract([
        "Bonjour, je cherche à acheter un appartement meublé à Tanger, budget max 120 millions, "
        "minimum 90 m2, avec parking et vue mer. Pas de piscine svp."
    ])
    assert c["transaction_types"] == ["SALE"]
    assert c["categories"] == ["APARTMENT"]
    assert c["cities"] == ["Tanger"]
    assert c["budget_max"] == 1_200_000
    assert c["surface_min"] == 90
    assert c["furnished"] is True
    assert set(c["equipments"]) == {"parking", "vue mer"}  # piscine refusée par le client
    assert "budget max 120 millions" in p["budget_max"]


def test_message_en_darija_arabe():
    c, _ = rules_extract(["سلام، بغيت نكري شقة مفروشة فطنجة ولا تطوان، فيها مصعد"])
    assert c["transaction_types"] == ["RENT"]
    assert c["categories"] == ["APARTMENT"]
    assert set(c["cities"]) == {"Tanger", "Tétouan"}
    assert c["furnished"] is True
    assert c["equipments"] == ["ascenseur"]


def test_fourchette_de_budget_et_non_meuble():
    c, _ = rules_extract(["Villa à Marrakech entre 2 MDH et 3 MDH, non meublée"])
    assert (c["budget_min"], c["budget_max"]) == (2_000_000, 3_000_000)
    assert c["furnished"] is False
    assert c["categories"] == ["HOUSE"]


def test_rien_a_extraire():
    c, p = rules_extract(["Merci, je vous rappelle demain."])
    assert c == {} and p == {}


def test_un_petit_nombre_n_est_pas_un_budget():
    c, _ = rules_extract(["Budget : 3 chambres minimum"])
    assert "budget_max" not in c


# ─── Garde-fou sur les sorties du modèle ─────────────────────────────────────

def test_un_critere_sans_citation_presente_dans_le_texte_est_rejete():
    texte = "Je veux un appartement à Tanger, max 1,2 million."
    raw = {
        "categories": ["APARTMENT"], "cities": ["Tanger"], "budget_max": 1_200_000,
        "equipments": ["piscine"], "furnished": True, "surface_min": None,
        "preuves": [
            {"champ": "categories", "citation": "un appartement"},
            {"champ": "cities", "citation": "à Tanger"},
            {"champ": "budget_max", "citation": "max 1,2 million"},
            {"champ": "equipments", "citation": "avec une belle piscine"},  # inventée
            # pas de preuve pour furnished
        ],
    }
    c, p = keep_justified(raw, texte)
    assert c == {"categories": ["APARTMENT"], "cities": ["Tanger"], "budget_max": 1_200_000.0}
    assert set(p) == {"categories", "cities", "budget_max"}


def test_valeurs_hors_vocabulaire_ou_absurdes_rejetees():
    texte = "budget 5 dh, surface énorme, type château"
    raw = {
        "categories": ["CASTLE"], "budget_max": 5,
        "preuves": [{"champ": "categories", "citation": "type château"}, {"champ": "budget_max", "citation": "budget 5 dh"}],
    }
    assert keep_justified(raw, texte) == ({}, {})


# ─── Endpoint ────────────────────────────────────────────────────────────────

def test_endpoint_sans_modele_utilise_les_regles():
    body = {"textes": [{"source": "notes", "texte": "Client cherche studio à Agadir, location"}, {"texte": " "}]}
    r = client.post("/api/match/extraire-criteres", json=body, headers=HEADERS)
    assert r.status_code == 200
    data = r.json()
    assert data["moteur"] == "regles"
    assert data["criteres"]["categories"] == ["STUDIO"]
    assert data["criteres"]["cities"] == ["Agadir"]
    assert data["criteres"]["transaction_types"] == ["RENT"]


def test_endpoint_textes_vides_refuses():
    r = client.post("/api/match/extraire-criteres", json={"textes": [{"texte": "  "}]}, headers=HEADERS)
    assert r.status_code == 422


def test_endpoint_avec_modele_masque_et_filtre(monkeypatch):
    captured = {}

    async def fake_llm(prompt):
        captured["prompt"] = prompt
        return {
            "transaction_types": ["SALE"], "categories": [], "cities": ["Tanger"], "budget_min": None,
            "budget_max": 1_500_000, "surface_min": None, "surface_max": None, "furnished": None,
            "equipments": ["piscine"], "accepted_conditions": [],
            "preuves": [
                {"champ": "transaction_types", "citation": "pour acheter"},
                {"champ": "cities", "citation": "sur Tanger"},
                {"champ": "budget_max", "citation": "150 millions max"},
                {"champ": "equipments", "citation": "piscine obligatoire"},  # absente du texte
            ],
        }, "openai"

    monkeypatch.setattr(settings, "openai_enabled", True)
    monkeypatch.setattr(settings, "openai_api_key", "sk-test")
    monkeypatch.setattr(extract, "_call_llm", fake_llm)
    body = {"textes": [{"source": "whatsapp", "texte": "Salam, c'est pour acheter sur Tanger, 150 millions max. Mon numéro : 0661234567"}]}
    data = client.post("/api/match/extraire-criteres", json=body, headers=HEADERS).json()

    assert "0661234567" not in captured["prompt"]
    assert data["moteur"] == "openai"
    assert data["criteres"] == {"transaction_types": ["SALE"], "cities": ["Tanger"], "budget_max": 1_500_000.0}
    assert data["preuves"]["budget_max"] == "150 millions max"


def test_schema_strict():
    from tests.test_vision import _assert_strict
    _assert_strict(extract.EXTRACTION_SCHEMA)
    json.dumps(extract.EXTRACTION_SCHEMA)
