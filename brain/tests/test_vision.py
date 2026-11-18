import base64
import json

import pytest
from fastapi.testclient import TestClient

import vision.providers as providers
import vision.router as vision_router
from main import app, settings
from vision.aggregate import build_profile, find_inconsistencies, template_description
from vision.schemas import PHOTO_ANALYSIS_JSON_SCHEMA, PhotoAnalysis

client = TestClient(app)
HEADERS = {"X-API-Key": settings.api_key}
TINY_PNG = base64.b64encode(b"\x89PNG\r\n\x1a\n" + b"0" * 32).decode()


def photo(**kw) -> PhotoAnalysis:
    base = {"is_property_photo": True, "room_type": "salon"}
    base.update(kw)
    return PhotoAnalysis.model_validate(base)


@pytest.fixture(autouse=True)
def no_engines(monkeypatch):
    monkeypatch.setattr(settings, "openai_enabled", False)
    monkeypatch.setattr(settings, "ollama_enabled", False)


# ─── Schéma ──────────────────────────────────────────────────────────────────

def _assert_strict(schema: dict, path: str = "$"):
    if schema.get("type") == "object" or schema.get("type") == ["object", "null"]:
        props = set(schema["properties"])
        assert schema.get("additionalProperties") is False, path
        assert set(schema["required"]) == props, f"{path}: toutes les propriétés doivent être requises"
        for k, sub in schema["properties"].items():
            _assert_strict(sub, f"{path}.{k}")
    if schema.get("type") == "array":
        _assert_strict(schema["items"], f"{path}[]")


def test_schema_compatible_mode_strict():
    _assert_strict(PHOTO_ANALYSIS_JSON_SCHEMA)
    assert set(PHOTO_ANALYSIS_JSON_SCHEMA["properties"]) <= set(PhotoAnalysis.model_fields)


def test_validation_nettoie_les_libelles_et_corrige_la_fourchette():
    a = photo(equipments=[" Climatisation", "climatisation", ""], area_m2_min=20, area_m2_max=12)
    assert a.equipments == ["climatisation"]
    assert a.area_m2_max == 20


def test_validation_refuse_un_type_de_piece_inconnu():
    with pytest.raises(Exception):
        photo(room_type="grenier_secret")


# ─── Agrégation ──────────────────────────────────────────────────────────────

def test_profil_ne_compte_pas_les_photos_comme_des_pieces():
    prof = build_profile([
        photo(room_type="chambre", furniture=[{"item": "lit double", "count": 1}]),
        photo(room_type="chambre", furniture=[{"item": "Lit double", "count": 1}, {"item": "chaise", "count": 2}]),
        photo(room_type="cuisine", equipments=["cuisine équipée"]),
    ])
    chambre = next(p for p in prof["pieces"] if p["room_type"] == "chambre")
    assert chambre["photos"] == 2
    # maximum vu sur une photo, pas la somme
    assert {"item": "lit double", "count": 1} in chambre["furniture"]
    assert {"item": "chaise", "count": 2} in chambre["furniture"]
    assert prof["equipements"] == [{"label": "cuisine équipée", "photos": 1}]


def test_profil_ignore_les_images_qui_ne_sont_pas_le_bien():
    prof = build_profile([photo(), photo(is_property_photo=False, room_type="autre")])
    assert prof["photos_analysees"] == 2
    assert prof["photos_du_bien"] == 1


def test_meuble():
    assert build_profile([photo(room_type="cuisine")])["meuble"] is None
    assert build_profile([photo(room_type="salon")])["meuble"] is False
    assert build_profile([photo(furniture=[{"item": "canapé", "count": 1}, {"item": "table", "count": 1}])])["meuble"] is True


def test_etat_a_egalite_retient_le_moins_bon():
    prof = build_profile([photo(condition="bon_etat"), photo(condition="a_renover"), photo(condition="inconnu")])
    assert prof["etat_general"] == "a_renover"


def test_epoque_et_surface_medianes():
    prof = build_profile([
        photo(era={"from_year": 1990, "to_year": 2000}, area_m2_min=18, area_m2_max=22),
        photo(era={"from_year": 1995, "to_year": 2010}, area_m2_min=20, area_m2_max=26),
    ])
    assert prof["epoque"] == {"from_year": 1992, "to_year": 2005}
    salon = prof["pieces"][0]
    assert (salon["area_m2_min"], salon["area_m2_max"]) == (19, 24)


# ─── Incohérences ────────────────────────────────────────────────────────────

def test_incoherences_detectees():
    prof = build_profile([
        photo(room_type="salon", condition="a_renover", area_m2_min=60, area_m2_max=70),
        photo(room_type="chambre"),
    ])
    issues = find_inconsistencies(prof, {
        "title": "Appartement neuf meublé avec piscine",
        "description": "Belle vue mer",
        "surface": 50,
    })
    text = " ".join(issues)
    assert "piscine" in text
    assert "vue mer" in text
    assert "meublée" in text
    assert "neuve" in text
    assert "60 m²" in text


def test_pas_d_incoherence_quand_tout_concorde():
    prof = build_profile([
        photo(room_type="piscine"),
        photo(furniture=[{"item": "canapé", "count": 2}], view="vue sur la mer", condition="neuf"),
    ])
    issues = find_inconsistencies(prof, {"title": "Villa neuve meublée", "description": "Piscine et vue mer"})
    assert issues == []


def test_description_de_secours_ne_cite_que_des_faits():
    prof = build_profile([photo(room_type="cuisine", equipments=["cuisine équipée"], materials=[{"surface": "sol", "material": "Zellige"}])])
    text = template_description(prof, {"category": "Appartement", "city": "Tanger", "surface": 85})
    assert text.startswith("Appartement de 85 m² situé à Tanger.")
    assert "cuisine équipée" in text
    assert "zellige" in text


# ─── Endpoints ───────────────────────────────────────────────────────────────

def test_analyze_sans_moteur_renvoie_503():
    r = client.post("/api/vision/analyze", json={"image_base64": TINY_PNG, "content_type": "image/png"}, headers=HEADERS)
    assert r.status_code == 503


@pytest.mark.parametrize("body", [
    {"image_url": "http://exemple.ma/a.jpg"},
    {"image_base64": "pas du base64 !!"},
    {},
    {"image_url": "https://exemple.ma/a.jpg", "image_base64": TINY_PNG},
    {"image_url": "https://exemple.ma/a.gif", "content_type": "image/gif"},
])
def test_analyze_entrees_invalides(body):
    assert client.post("/api/vision/analyze", json=body, headers=HEADERS).status_code == 422


def test_analyze_renvoie_l_analyse_du_moteur(monkeypatch):
    async def fake(image_url, image_b64, content_type, context):
        assert image_b64 == TINY_PNG and context == {"city": "Tanger"}
        return photo(room_type="cuisine", caption="Cuisine équipée."), "openai"

    monkeypatch.setattr(vision_router, "analyze_photo", fake)
    r = client.post(
        "/api/vision/analyze",
        json={"image_base64": TINY_PNG, "content_type": "image/png", "context": {"city": "Tanger"}},
        headers=HEADERS,
    )
    assert r.status_code == 200
    assert r.json()["engine"] == "openai"
    assert r.json()["analysis"]["room_type"] == "cuisine"


def test_ollama_refuse_les_url(monkeypatch):
    monkeypatch.setattr(settings, "ollama_enabled", True)
    r = client.post("/api/vision/analyze", json={"image_url": "https://exemple.ma/a.jpg"}, headers=HEADERS)
    assert r.status_code == 422
    assert "importez" in r.json()["detail"]


def test_openai_recoit_le_schema_strict(monkeypatch):
    captured = {}

    class FakeCompletions:
        async def create(self, **kwargs):
            captured.update(kwargs)
            content = json.dumps({
                "is_property_photo": True, "room_type": "chambre", "caption": "Chambre.",
                "equipments": [], "materials": [], "furniture": [], "condition": "bon_etat",
                "condition_signs": [], "era": {"from_year": None, "to_year": None, "rationale": ""},
                "area_m2_min": None, "area_m2_max": None, "dimension_reference": None,
                "view": None, "natural_light": "bonne", "confidence": 0.8,
            })
            msg = type("M", (), {"content": content})
            return type("R", (), {"choices": [type("C", (), {"message": msg})]})

    class FakeClient:
        def __init__(self, **kwargs):
            self.chat = type("Chat", (), {"completions": FakeCompletions()})

    import openai
    monkeypatch.setattr(openai, "AsyncOpenAI", FakeClient)
    monkeypatch.setattr(settings, "openai_enabled", True)
    monkeypatch.setattr(settings, "openai_api_key", "sk-test")

    r = client.post("/api/vision/analyze", json={"image_url": "https://exemple.ma/a.jpg"}, headers=HEADERS)
    assert r.status_code == 200, r.text
    assert r.json()["analysis"]["room_type"] == "chambre"
    fmt = captured["response_format"]
    assert fmt["type"] == "json_schema" and fmt["json_schema"]["strict"] is True
    image_part = captured["messages"][0]["content"][1]
    assert image_part["image_url"]["url"] == "https://exemple.ma/a.jpg"


def test_profile_sans_moteur_utilise_la_description_de_secours():
    body = {
        "analyses": [photo(room_type="cuisine", equipments=["cuisine équipée"]).model_dump()],
        "declared": {"category": "Appartement", "city": "Tanger", "title": "Appartement avec piscine"},
    }
    r = client.post("/api/vision/profile", json=body, headers=HEADERS)
    assert r.status_code == 200
    data = r.json()
    assert data["description_engine"] == "template"
    assert data["descriptions"]["fr"].startswith("Appartement situé à Tanger.")
    assert any("piscine" in i for i in data["inconsistencies"])


def test_profile_avec_moteur(monkeypatch):
    async def fake(facts, lang):
        assert "estimation" not in json.dumps(facts)
        return f"Description {lang}", "openai"

    monkeypatch.setattr(vision_router, "generate_description", fake)
    body = {"analyses": [photo().model_dump()], "languages": ["fr", "en"]}
    data = client.post("/api/vision/profile", json=body, headers=HEADERS).json()
    assert data["descriptions"] == {"fr": "Description fr", "en": "Description en"}
    assert data["description_engine"] == "openai"
