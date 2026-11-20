import asyncio

import pytest
from fastapi.testclient import TestClient

from main import app

from match import pitch
from match.pitch import BienFiche, PitchRequest, check_llm_message, numbers_in, template_message, unknown_numbers


def req(**kw):
    base = dict(
        bien=BienFiche(titre="Appartement Malabata", categorie="APARTMENT", type="SALE", ville="Tanger",
                       prix=1_850_000, surface=95, meuble=True, pieces=["chambre", "chambre", "salon"]),
        prenom="Youssef",
        raisons=["Ville recherchée (Tanger)", "Budget respecté"],
    )
    base.update(kw)
    return PitchRequest(**base)


def test_numbers_in_formats():
    assert numbers_in("1 850 000 MAD") == [1_850_000]
    assert numbers_in("1.850.000 DH") == [1_850_000]
    assert numbers_in("1,85 million") == [1_850_000]
    assert numbers_in("95 m²") == [95]
    assert numbers_in("١٢٠ م²") == [120]


def test_chiffres_inconnus():
    r = req()
    assert unknown_numbers("Appartement de 95 m² à 1 850 000 MAD, 2 chambres", r) == []
    assert unknown_numbers("à 1,85 million de dirhams", r) == []
    assert unknown_numbers("à 5 minutes de la plage", r) == [5]
    assert unknown_numbers("3 chambres", r) == [3]


def test_rejets():
    r = req()
    assert check_llm_message("Bonjour Youssef, appelez le 0661 22 33 44", r) == "lien ou coordonnée inventés"
    assert check_llm_message("Voir https://x.ma", r) == "lien ou coordonnée inventés"
    assert "chiffres absents" in check_llm_message("Résidence de 2019, 95 m²", r)
    assert check_llm_message("Bonjour Youssef, 95 m² à 1 850 000 MAD. Une visite ?", r) is None
    assert check_llm_message("x" * 2000, r) == "message trop long"


@pytest.mark.parametrize("langue", ["fr", "ar", "en"])
def test_modele_sans_ia(langue):
    r = req(langue=langue, agent="Adel, Atlas")
    msg = template_message(r)
    assert "Youssef" in msg
    assert "1 850 000" in msg or "1,850,000" in msg
    assert msg.endswith("Adel, Atlas")
    assert unknown_numbers(msg, r) == []


def test_modele_location():
    r = req(bien=BienFiche(categorie="STUDIO", type="RENT", ville="Tanger", prix=4500))
    assert "4 500 MAD par mois" in template_message(r)


def test_generate_sans_ia(monkeypatch):
    async def none(_):
        return None
    monkeypatch.setattr(pitch, "_call_llm", none)
    out = asyncio.run(pitch.generate_pitch(req()))
    assert out.moteur == "modele" and out.rejet_ia is None


def test_generate_ia_rejetee(monkeypatch):
    async def fake(_):
        return "Bonjour Youssef, à 10 minutes de la mer !", "openai"
    monkeypatch.setattr(pitch, "_call_llm", fake)
    out = asyncio.run(pitch.generate_pitch(req()))
    assert out.moteur == "modele"
    assert "10" in out.rejet_ia


def test_generate_ia_acceptee(monkeypatch):
    async def fake(_):
        return "Bonjour Youssef ! Un appartement de 95 m² à Tanger, 1 850 000 MAD. Une visite ?", "openai"
    monkeypatch.setattr(pitch, "_call_llm", fake)
    out = asyncio.run(pitch.generate_pitch(req()))
    assert out.moteur == "openai"


def test_endpoint(monkeypatch):
    client = TestClient(app)
    async def none(_):
        return None
    monkeypatch.setattr(pitch, "_call_llm", none)
    r = client.post("/api/match/proposition", headers={"X-API-Key": "test-key"}, json={
        "bien": {"categorie": "APARTMENT", "ville": "Tanger", "prix": 900000},
        "prenom": "Salma", "langue": "fr", "canal": "sms",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["moteur"] == "modele" and body["canal"] == "sms" and "Salma" in body["message"]


# ---------- relances ----------

from datetime import datetime  # noqa: E402

from match.pitch import format_creneau, pitch_prompt  # noqa: E402


def test_format_creneau():
    dt = datetime(2026, 11, 21, 10, 30)
    assert format_creneau(dt, "fr") == "samedi 21 novembre à 10h30"
    assert format_creneau(dt, "en") == "Saturday November 21 at 10:30"
    assert format_creneau(dt, "ar").startswith("السبت 21 نونبر")


@pytest.mark.parametrize("langue", ["fr", "ar", "en"])
def test_relance_avec_creneau_sans_chiffre_inconnu(langue):
    r = req(objet="relance", langue=langue, creneau=datetime(2026, 11, 21, 10, 0),
            reponse_client="samedi 10h ?", intention_client="VISITE")
    msg = template_message(r)
    assert "21" in msg and "Youssef" in msg
    assert unknown_numbers(msg, r) == []


def test_relance_negociation_et_silence():
    r = req(objet="relance", intention_client="NEGOCIATION", reponse_client="dernier prix ?")
    assert "propriétaire" in template_message(r)
    assert "au sujet de l'appartement à Tanger" in template_message(r)
    silence = req(objet="relance")
    assert "plus de photos" in template_message(silence)
    assert "n'a pas répondu" in pitch_prompt(silence)
    assert "dernier prix" in pitch_prompt(r)


def test_relance_ia_ne_peut_pas_inventer_une_autre_heure():
    r = req(objet="relance", creneau=datetime(2026, 11, 21, 10, 0))
    assert check_llm_message("Bonjour Youssef, visite samedi 21 à 10h ?", r) is None
    assert "chiffres absents" in check_llm_message("Bonjour Youssef, visite samedi 21 à 16h ?", r)
