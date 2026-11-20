import asyncio
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from main import app
from match import reply
from match.reply import ReponseRequest, analyse_reply, availability, rules_intent

# jeudi 19 novembre 2026, 20 h
RECU = datetime(2026, 11, 19, 20, 0)


@pytest.mark.parametrize(
    "message,intent",
    [
        ("Bonjour, je voudrais visiter l'appartement", "VISITE"),
        ("On peut passer voir samedi ?", "VISITE"),
        ("bghit nchoufha", "VISITE"),
        ("بغيت نشوفها عافاك", "VISITE"),
        ("I'd like to visit it", "VISITE"),
        ("Merci mais je ne suis pas intéressé", "PAS_INTERESSE"),
        ("la chokran, l9it dar", "PAS_INTERESSE"),
        ("ما بغيتش", "PAS_INTERESSE"),
        ("Le prix est négociable ?", "NEGOCIATION"),
        ("akhir taman chhal?", "NEGOCIATION"),
        ("Envoyez-moi plus de photos svp", "INTERESSE"),
        ("wakha", "INTERESSE"),
        ("Oui", "INTERESSE"),
        ("Il y a un parking ?", "QUESTION"),
        ("chhal dyal syndic?", "QUESTION"),
        ("Merci", "AUTRE"),
    ],
)
def test_intentions(message, intent):
    assert rules_intent(message)[0] == intent


def test_pas_interesse_l_emporte_sur_interesse():
    assert rules_intent("ça ne m'intéresse pas, merci")[0] == "PAS_INTERESSE"


def test_jour_et_heure():
    d = availability("samedi à 10h", RECU)
    assert [(x.debut, x.fin) for x in d] == [(datetime(2026, 11, 21, 10), datetime(2026, 11, 21, 11))]
    assert "samedi" in d[0].texte


def test_demain_apres_midi():
    d = availability("demain après-midi", RECU)
    assert [(x.debut, x.fin) for x in d] == [(datetime(2026, 11, 20, 14), datetime(2026, 11, 20, 18))]


def test_darija_ghedda_heure_sans_h_matin():
    d = availability("ghedda m3a 3h", RECU)  # 3 h en journée = 15 h
    assert d[0].debut == datetime(2026, 11, 20, 15)
    d = availability("السبت الصباح", RECU)
    assert (d[0].debut, d[0].fin) == (datetime(2026, 11, 21, 9), datetime(2026, 11, 21, 12))


def test_week_end_et_date():
    d = availability("ce week-end", RECU)
    assert [x.debut.date().isoformat() for x in d] == ["2026-11-21", "2026-11-22"]
    d = availability("le 25/11 à 17h30", RECU)
    assert d[0].debut == datetime(2026, 11, 25, 17, 30)


def test_meme_jour_de_semaine_semaine_suivante():
    d = availability("jeudi", RECU)  # reçu un jeudi
    assert d[0].debut.date().isoformat() == "2026-11-26"


def test_heure_seule_trop_tard_aujourd_hui():
    d = availability("à 10h", RECU)  # reçu à 20 h : demain 10 h
    assert d[0].debut == datetime(2026, 11, 20, 10)


def test_pas_de_date_inventee():
    assert availability("je suis intéressé", RECU) == []
    assert availability("Le prix 1 850 000 est ferme ?", RECU) == []


def test_disponibilite_seule_devient_visite(monkeypatch):
    async def none(*_):
        return None
    monkeypatch.setattr(reply, "_llm_intent", none)
    out = asyncio.run(analyse_reply(ReponseRequest(message="samedi 11h ?", recu_le=RECU)))
    assert out.intention == "VISITE" and out.disponibilites[0].debut == datetime(2026, 11, 21, 11)


def test_ia_citation_verifiee(monkeypatch):
    async def fake(*_):
        return "VISITE", "phrase inventée", "openai"
    monkeypatch.setattr(reply, "_llm_intent", fake)
    out = asyncio.run(analyse_reply(ReponseRequest(message="Hmm, à voir avec ma femme", recu_le=RECU)))
    assert out.intention == "AUTRE" and out.moteur == "regles"

    async def ok(*_):
        return "INTERESSE", "à voir avec ma femme", "openai"
    monkeypatch.setattr(reply, "_llm_intent", ok)
    out = asyncio.run(analyse_reply(ReponseRequest(message="Hmm, à voir avec ma femme", recu_le=RECU)))
    assert out.intention == "INTERESSE" and out.moteur == "openai"


def test_numero_masque_avant_analyse(monkeypatch):
    async def none(*_):
        return None
    monkeypatch.setattr(reply, "_llm_intent", none)
    out = asyncio.run(analyse_reply(ReponseRequest(message="appelez-moi au 0661223344 pour la visite", recu_le=RECU)))
    assert out.intention == "VISITE"
    assert all("0661" not in i for i in out.indices)


def test_endpoint(monkeypatch):
    async def none(*_):
        return None
    monkeypatch.setattr(reply, "_llm_intent", none)
    r = TestClient(app).post(
        "/api/match/reponse",
        headers={"X-API-Key": "test-key"},
        json={"message": "demain 16h pour visiter", "recu_le": "2026-11-19T20:00:00"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["intention"] == "VISITE"
    assert body["disponibilites"][0]["debut"] == "2026-11-20T16:00:00"
