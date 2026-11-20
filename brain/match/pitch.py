"""Message de proposition d'un bien à un acheteur (WhatsApp ou SMS).

L'agent relit et valide toujours le message avant l'envoi. Garde-fous :
- l'IA ne reçoit que les faits du bien (aucune coordonnée) ;
- tout chiffre du message doit venir de ces faits, sinon le texte de l'IA est écarté
  et un modèle sans IA est utilisé ;
- sans moteur d'IA disponible, le modèle sans IA est utilisé.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from typing import Literal

import httpx
from pydantic import BaseModel, Field

from config import settings
from match.extract import _llm_engines

logger = logging.getLogger("match-service")

Langue = Literal["fr", "ar", "en"]
Canal = Literal["whatsapp", "sms"]
Objet = Literal["proposition", "relance"]

MAX_CHARS = {"whatsapp": 700, "sms": 320}

CATEGORY_LABELS = {
    "fr": {"APARTMENT": "appartement", "HOUSE": "maison", "STUDIO": "studio", "COMMERCIAL": "local commercial",
           "VILLA": "villa", "LAND": "terrain"},
    "ar": {"APARTMENT": "شقة", "HOUSE": "دار", "STUDIO": "ستوديو", "COMMERCIAL": "محل تجاري",
           "VILLA": "فيلا", "LAND": "أرض"},
    "en": {"APARTMENT": "apartment", "HOUSE": "house", "STUDIO": "studio", "COMMERCIAL": "commercial space",
           "VILLA": "villa", "LAND": "plot of land"},
}


class BienFiche(BaseModel):
    titre: str | None = Field(default=None, max_length=300)
    categorie: str | None = None
    type: str | None = None  # SALE ou RENT
    ville: str | None = Field(default=None, max_length=120)
    prix: float | None = Field(default=None, ge=0)
    devise: str | None = "MAD"
    surface: float | None = Field(default=None, ge=0)
    description: str | None = Field(default=None, max_length=4000)
    meuble: bool | None = None
    etat: str | None = None
    equipements: list[str] = Field(default=[], max_length=40)
    vues: list[str] = Field(default=[], max_length=10)
    pieces: list[str] = Field(default=[], max_length=40)


class PitchRequest(BaseModel):
    bien: BienFiche
    prenom: str | None = Field(default=None, max_length=80)
    raisons: list[str] = Field(default=[], max_length=20)
    langue: Langue = "fr"
    canal: Canal = "whatsapp"
    agent: str | None = Field(default=None, max_length=80)
    # Relance : après une réponse du client restée sans suite, ou un silence du client
    objet: Objet = "proposition"
    reponse_client: str | None = Field(default=None, max_length=1000)
    intention_client: str | None = Field(default=None, max_length=30)
    creneau: datetime | None = None  # visite proposée (créneau libre de l'agent)


class PitchResponse(BaseModel):
    message: str
    moteur: str  # openai, ollama ou modele
    langue: Langue
    canal: Canal
    rejet_ia: str | None = None


# ---------- chiffres ----------

_NUM = re.compile(r"\d[\d\s  .,]*\d|\d")
_UNIT_AFTER = re.compile(r"\s*(millions?|mdh\b|k\b|mille\b)", re.IGNORECASE)


def _to_float(raw: str) -> float | None:
    s = re.sub(r"[\s  ]", "", raw)
    if re.fullmatch(r"\d{1,3}([.,]\d{3})+", s):  # séparateurs de milliers
        s = re.sub(r"[.,]", "", s)
    else:
        s = s.replace(",", ".")
        if s.count(".") > 1:
            s = s.replace(".", "")
    try:
        return float(s)
    except ValueError:
        return None


def numbers_in(text: str) -> list[float]:
    out = []
    for m in _NUM.finditer(text):
        v = _to_float(m.group(0).rstrip(".,"))
        if v is None:
            continue
        unit = _UNIT_AFTER.match(text, m.end())
        if unit:
            u = unit.group(1).lower()
            if u.startswith("million") or u == "mdh":
                v *= 1_000_000
            elif u in ("k", "mille"):
                v *= 1_000
        out.append(v)
    return out


JOURS = {
    "fr": ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
    "en": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "ar": ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
}
MOIS = {
    "fr": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre",
           "octobre", "novembre", "décembre"],
    "en": ["January", "February", "March", "April", "May", "June", "July", "August", "September",
           "October", "November", "December"],
    "ar": ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتنبر", "أكتوبر",
           "نونبر", "دجنبر"],
}


def format_creneau(dt: datetime, langue: str) -> str:
    j, m = JOURS[langue][dt.weekday()], MOIS[langue][dt.month - 1]
    if langue == "en":
        return f"{j} {m} {dt.day} at {dt.strftime('%H:%M')}"
    if langue == "ar":
        return f"{j} {dt.day} {m} مع {dt.strftime('%H:%M')}"
    return f"{j} {dt.day} {m} à {dt.hour}h{dt.minute:02d}"


def allowed_numbers(req: PitchRequest) -> set[float]:
    b = req.bien
    allowed: set[float] = {1.0}
    if req.creneau:
        allowed.update(round(n, 2) for n in numbers_in(format_creneau(req.creneau, req.langue)))
        allowed.update({float(req.creneau.day), float(req.creneau.hour), float(req.creneau.minute)})
    if req.reponse_client:
        allowed.update(round(n, 2) for n in numbers_in(req.reponse_client))
    for room in set(b.pieces):  # « 2 chambres » quand l'analyse photo en a vu deux
        allowed.add(float(b.pieces.count(room)))
    for v in (b.prix, b.surface):
        if v:
            allowed.add(round(v, 2))
    # chiffres présents dans les textes fournis (titre, description, raisons)
    for t in [b.titre or "", b.description or "", *req.raisons]:
        allowed.update(round(n, 2) for n in numbers_in(t))
    return allowed


def unknown_numbers(message: str, req: PitchRequest) -> list[float]:
    allowed = allowed_numbers(req)
    unknown = []
    for n in numbers_in(message):
        r = round(n, 2)
        # le même chiffre peut être écrit en millions (« 3,5 millions ») : comparé ci-dessus
        if r in allowed or any(a >= 1000 and abs(r - a) <= a * 0.005 for a in allowed):
            continue
        unknown.append(n)
    return unknown


# ---------- modèle sans IA ----------


def _fmt_price(v: float, langue: str) -> str:
    s = f"{v:,.0f}"
    return s.replace(",", " " if langue != "en" else ",")


def _category(b: BienFiche, langue: str) -> str:
    labels = CATEGORY_LABELS[langue]
    if b.categorie and b.categorie.upper() in labels:
        return labels[b.categorie.upper()]
    return {"fr": "bien", "ar": "عقار", "en": "property"}[langue]


FR_DU = {"APARTMENT": "de l'appartement", "HOUSE": "de la maison", "STUDIO": "du studio",
         "COMMERCIAL": "du local commercial", "VILLA": "de la villa", "LAND": "du terrain"}


def _fr_du(b: BienFiche) -> str:
    return FR_DU.get((b.categorie or "").upper(), "du bien")


def template_relance(req: PitchRequest) -> str:
    b, lg = req.bien, req.langue
    cat = _category(b, lg)
    slot = format_creneau(req.creneau, lg) if req.creneau else None
    nego = req.intention_client == "NEGOCIATION"
    if lg == "en":
        lines = [f"Hello {req.prenom}," if req.prenom else "Hello,",
                 f"Following up about the {cat}" + (f" in {b.ville}" if b.ville else "") + "."]
        if slot:
            lines.append(f"I can show it to you on {slot}. Does that work for you?")
        elif nego:
            lines.append("I can pass your offer on to the owner: what price did you have in mind?")
        else:
            lines.append("Would you like more photos or to arrange a viewing?")
    elif lg == "ar":
        lines = [f"السلام {req.prenom}،" if req.prenom else "السلام،",
                 f"كنرجع ليك على {cat}" + (f" ف{b.ville}" if b.ville else "") + "."]
        if slot:
            lines.append(f"نقدر نوريها ليك {slot}. واش مناسب ليك؟")
        elif nego:
            lines.append("نقدر نوصل العرض ديالك لمول الدار: شحال كتفكر؟")
        else:
            lines.append("بغيتي تصاور كثر ولا نديرو زيارة؟")
    else:
        lines = [f"Bonjour {req.prenom}," if req.prenom else "Bonjour,",
                 f"Je reviens vers vous au sujet {_fr_du(b)}" + (f" à {b.ville}" if b.ville else "") + "."]
        if slot:
            lines.append(f"Je peux vous le faire visiter {slot}. Cela vous convient-il ?")
        elif nego:
            lines.append("Je peux transmettre votre proposition au propriétaire : quel prix envisagez-vous ?")
        else:
            lines.append("Souhaitez-vous plus de photos ou organiser une visite ?")
    if req.agent:
        lines.append(req.agent)
    return "\n".join(lines)


def template_message(req: PitchRequest) -> str:
    if req.objet == "relance":
        return template_relance(req)
    b, lg = req.bien, req.langue
    cat = _category(b, lg)
    rent = (b.type or "").upper() == "RENT"
    dev = b.devise or "MAD"
    parts: list[str] = []
    if lg == "fr":
        parts.append(f"Bonjour {req.prenom}," if req.prenom else "Bonjour,")
        lieu = f" à {b.ville}" if b.ville else ""
        parts.append(f"Un {cat}{lieu} vient d'entrer chez nous et correspond à votre recherche.")
        details = []
        if b.surface:
            details.append(f"{b.surface:g} m²")
        if b.prix:
            details.append(f"{_fmt_price(b.prix, lg)} {dev}" + (" par mois" if rent else ""))
        if b.meuble is True:
            details.append("meublé")
        if details:
            parts.append(" · ".join(details))
        if req.raisons:
            parts.append("Points forts : " + ", ".join(r.lower() for r in req.raisons[:3]) + ".")
        parts.append("Souhaitez-vous plus de photos ou une visite ?")
    elif lg == "en":
        parts.append(f"Hello {req.prenom}," if req.prenom else "Hello,")
        lieu = f" in {b.ville}" if b.ville else ""
        parts.append(f"A new {cat}{lieu} matching your search has just come in.")
        details = []
        if b.surface:
            details.append(f"{b.surface:g} m²")
        if b.prix:
            details.append(f"{_fmt_price(b.prix, lg)} {dev}" + (" per month" if rent else ""))
        if b.meuble is True:
            details.append("furnished")
        if details:
            parts.append(" · ".join(details))
        parts.append("Would you like more photos or a viewing?")
    else:  # darija en alphabet arabe
        parts.append(f"السلام {req.prenom}،" if req.prenom else "السلام،")
        lieu = f" ف{b.ville}" if b.ville else ""
        parts.append(f"عندنا {cat} جديدة{lieu} كتناسب داكشي اللي كتقلب عليه.")
        details = []
        if b.surface:
            details.append(f"{b.surface:g} م²")
        if b.prix:
            details.append(f"{_fmt_price(b.prix, lg)} {dev}" + (" فالشهر" if rent else ""))
        if b.meuble is True:
            details.append("مفروشة")
        if details:
            parts.append(" · ".join(details))
        parts.append("بغيتي نصيفط ليك تصاور كثر ولا نديرو زيارة؟")
    if req.agent:
        parts.append(req.agent)
    return "\n".join(parts)


# ---------- IA ----------

PITCH_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {"message": {"type": "string"}},
    "required": ["message"],
}

LANG_INSTRUCTIONS = {
    "fr": "en français",
    "en": "in English",
    "ar": "en darija marocaine écrite en alphabet arabe, simple et polie",
}


def relance_prompt(req: PitchRequest, facts: dict, limit: int) -> str:
    slot = format_creneau(req.creneau, req.langue) if req.creneau else None
    if req.reponse_client:
        situation = (
            f"Le client a répondu à la proposition : « {req.reponse_client} » "
            f"(intention détectée : {req.intention_client or 'inconnue'}), et n'a pas encore eu de réponse. "
            "Rédige la réponse de l'agent, qui fait avancer vers une visite. "
            "S'il pose une question dont la réponse n'est pas dans les faits, dis que tu vérifies et reviens vers lui, "
            "sans inventer de réponse."
        )
    else:
        situation = (
            "Le client n'a pas répondu à la proposition envoyée il y a quelques jours. Rédige une relance courte et "
            "polie, sans insister, qui rappelle le bien en une phrase."
        )
    return (
        f"Rédige un message {req.canal.upper()} {LANG_INSTRUCTIONS[req.langue]} d'un agent immobilier à un client "
        f"acheteur. {situation} {limit} caractères maximum, ton chaleureux et professionnel, pas de markdown"
        + (", au plus un emoji" if req.canal == "whatsapp" else ", sans emoji")
        + ".\n"
        + (f"Propose la visite exactement à ce moment, écrit tel quel : « {slot} ».\n" if slot else
           "Termine par une question qui propose plus de photos ou une visite.\n")
        + "Utilise UNIQUEMENT les faits ci-dessous. N'invente aucune caractéristique, aucun chiffre absent. "
        "N'écris ni numéro de téléphone, ni lien, ni adresse précise.\n\n"
        f"Prénom du client : {req.prenom or '(inconnu)'}\n"
        f"Faits du bien :\n{json.dumps(facts, ensure_ascii=False, indent=2)}"
        + (f"\nSigne avec : {req.agent}" if req.agent else "")
    )


def pitch_prompt(req: PitchRequest) -> str:
    facts = req.bien.model_dump(exclude_none=True)
    facts = {k: v for k, v in facts.items() if v not in ([], "")}
    limit = MAX_CHARS[req.canal]
    if req.objet == "relance":
        return relance_prompt(req, facts, limit)
    return (
        f"Rédige un message {req.canal.upper()} {LANG_INSTRUCTIONS[req.langue]} d'un agent immobilier "
        f"à un client acheteur pour lui proposer un bien qui correspond à sa recherche. "
        f"{limit} caractères maximum, ton chaleureux et professionnel, pas de markdown"
        + (", au plus un emoji" if req.canal == "whatsapp" else ", sans emoji")
        + ".\n"
        "Commence par saluer le client par son prénom s'il est donné. Termine par une question qui propose "
        "d'envoyer plus de photos ou d'organiser une visite.\n"
        "Utilise UNIQUEMENT les faits ci-dessous. N'invente aucune caractéristique, aucune distance, "
        "aucun quartier, aucun chiffre absent. N'écris ni numéro de téléphone, ni lien, ni adresse précise.\n\n"
        f"Prénom du client : {req.prenom or '(inconnu)'}\n"
        f"Pourquoi ce bien lui correspond : {json.dumps(req.raisons, ensure_ascii=False)}\n"
        f"Faits du bien :\n{json.dumps(facts, ensure_ascii=False, indent=2)}"
        + (f"\nSigne avec : {req.agent}" if req.agent else "")
    )


async def _call_json(engine: str, prompt: str, schema: dict, name: str) -> dict | None:
    """Appel d'un moteur avec sortie JSON contrainte ; None en cas d'échec."""
    try:
        if engine == "openai":
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=settings.vision_timeout_seconds)
            resp = await client.chat.completions.create(
                model=settings.openai_model,
                temperature=0.4,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_schema", "json_schema": {"name": name, "strict": True, "schema": schema}},
            )
            return json.loads(resp.choices[0].message.content)
        async with httpx.AsyncClient(timeout=settings.vision_timeout_seconds) as client:
            r = await client.post(
                f"{settings.ollama_url}/api/chat",
                json={
                    "model": settings.ollama_model,
                    "stream": False,
                    "format": schema,
                    "options": {"temperature": 0.4},
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            r.raise_for_status()
            return json.loads(r.json()["message"]["content"])
    except Exception as e:
        logger.warning("Appel %s (%s) échoué : %s", engine, name, e)
        return None


async def _call_llm(prompt: str) -> tuple[str, str] | None:
    for engine in _llm_engines():
        data = await _call_json(engine, prompt, PITCH_SCHEMA, "pitch")
        if data and isinstance(data.get("message"), str):
            return data["message"].strip(), engine
    return None


_CONTACT = re.compile(r"(https?://|www\.|\S+@\S+\.\w+|\+\d{6,}|\b0[5-7](?:[\s.-]?\d{2}){4}\b)")


def check_llm_message(message: str, req: PitchRequest) -> str | None:
    """Raison du rejet, ou None si le message est acceptable."""
    if not message:
        return "message vide"
    if len(message) > MAX_CHARS[req.canal] * 1.3:
        return "message trop long"
    if _CONTACT.search(message):
        return "lien ou coordonnée inventés"
    unknown = unknown_numbers(message, req)
    if unknown:
        return "chiffres absents de la fiche : " + ", ".join(f"{n:g}" for n in unknown[:3])
    return None


async def generate_pitch(req: PitchRequest) -> PitchResponse:
    result = await _call_llm(pitch_prompt(req))
    rejet = None
    if result is not None:
        message, engine = result
        rejet = check_llm_message(message, req)
        if rejet is None:
            return PitchResponse(message=message, moteur=engine, langue=req.langue, canal=req.canal)
        logger.warning("Message de l'IA écarté (%s)", rejet)
    return PitchResponse(
        message=template_message(req), moteur="modele", langue=req.langue, canal=req.canal, rejet_ia=rejet
    )
