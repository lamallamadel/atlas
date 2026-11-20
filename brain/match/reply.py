"""Réponse d'un client à une proposition de bien : intention et disponibilités.

- L'intention vient de règles (français, darija en lettres latines ou arabes, arabe, anglais),
  puis d'un modèle d'IA seulement si les règles ne trouvent rien. La réponse de l'IA n'est gardée
  que si la citation qu'elle donne figure dans le message.
- Les disponibilités (jours, heures, moments de la journée) ne viennent QUE des règles : une date
  n'est jamais inventée. Elles sont résolues par rapport à la date de réception du message.
"""

from __future__ import annotations

import json
import logging
import re
import unicodedata
from datetime import date, datetime, time, timedelta
from typing import Literal

from pydantic import BaseModel, Field

from match.extract import redact

logger = logging.getLogger("match-service")

Intention = Literal["VISITE", "INTERESSE", "NEGOCIATION", "QUESTION", "PAS_INTERESSE", "AUTRE"]

INTENTIONS: tuple[str, ...] = ("VISITE", "INTERESSE", "NEGOCIATION", "QUESTION", "PAS_INTERESSE", "AUTRE")

HEURE_OUVERTURE = 9
HEURE_FERMETURE = 19


class ReponseRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    recu_le: datetime  # heure locale du Maroc, sans fuseau
    titre_bien: str | None = Field(default=None, max_length=300)


class Disponibilite(BaseModel):
    debut: datetime
    fin: datetime
    texte: str  # passage du message d'où vient le créneau


class ReponseResponse(BaseModel):
    intention: Intention
    confiance: float
    indices: list[str]  # passages du message qui justifient l'intention
    disponibilites: list[Disponibilite]
    moteur: str  # regles ou openai/ollama


# ---------- normalisation ----------


def _norm(text: str) -> str:
    t = unicodedata.normalize("NFKD", text.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = t.replace("’", "'")
    return re.sub(r"\s+", " ", t)


def _rx(words: list[str]) -> re.Pattern:
    # Bornes de mot souples : les lettres arabes et latines n'ont pas les mêmes \b.
    alts = "|".join(sorted((re.escape(_norm(w)) for w in words), key=len, reverse=True))
    return re.compile(rf"(?<![\w؀-ۿ])(?:{alts})(?![\w؀-ۿ])")


# ---------- intentions ----------

INTENT_WORDS: dict[str, list[str]] = {
    "PAS_INTERESSE": [
        "pas interesse", "pas interessee", "ne m'interesse pas", "ca ne m'interesse pas", "non merci",
        "deja trouve", "pas pour moi", "plus la peine", "ne cherche plus", "j'ai trouve",
        "ma bghitch", "mabghitch", "la chokran", "la choukran", "ma3jbatnich", "ma3ejbatnich",
        "ما بغيتش", "مابغيتش", "لا شكرا", "ما عجبتنيش", "لقيت",
        "not interested", "no thanks", "no thank you", "already found",
    ],
    "VISITE": [
        "visite", "visiter", "voir le bien", "voir l'appartement", "voir la maison", "voir la villa",
        "passer voir", "venir voir", "rendez-vous", "rendez vous", "rdv", "quand peut-on voir",
        "nchouf", "nchoufha", "nchoufo", "nji nchouf", "ziyara", "nzour",
        "نشوف", "نشوفها", "نشوفو", "زيارة", "نزور", "نجي نشوف",
        "visit", "viewing", "see it", "see the property", "come and see",
    ],
    "NEGOCIATION": [
        "negociable", "negocier", "dernier prix", "meilleur prix", "baisser", "baisse", "reduction",
        "remise", "un geste", "trop cher", "akhir taman", "akhir thaman", "nqess", "n9ess", "ghali",
        "آخر ثمن", "اخر ثمن", "نقص", "غالي", "تخفيض",
        "negotiable", "last price", "best price", "lower the price", "discount", "too expensive",
    ],
    "INTERESSE": [
        "interesse", "interessee", "ca m'interesse", "ca m interesse", "plus de photos", "d'autres photos",
        "envoyez", "envoie", "plus d'infos", "plus d'informations", "d'accord", "pourquoi pas",
        "wakha", "mzyan", "zwin", "3jbatni", "sift", "siftli",
        "واخا", "مزيان", "زوين", "عجبتني", "صيفط",
        "interested", "more photos", "more pictures", "sounds good", "send me",
    ],
    "QUESTION": [
        "combien", "quel prix", "ou se trouve", "quel quartier", "est-ce que", "est ce que", "y a-t-il",
        "il y a", "charges", "syndic", "disponible", "wach", "chhal", "ch7al", "fin kayna", "fayn",
        "واش", "شحال", "فين", "كاين",
        "how much", "where is", "is there", "does it have", "available",
    ],
}
_INTENT_RX = {k: _rx(v) for k, v in INTENT_WORDS.items()}
# « oui » seul (ou presque) : intérêt, sauf si une autre intention est trouvée
_YES_RX = _rx(["oui", "ok", "okay", "yes", "iyeh", "ah", "نعم", "اه", "إيه"])

_PRIORITY = ["PAS_INTERESSE", "VISITE", "NEGOCIATION", "INTERESSE", "QUESTION"]


def rules_intent(message: str) -> tuple[str, float, list[str]]:
    text = _norm(message)
    found: dict[str, list[str]] = {}
    for intent, rx in _INTENT_RX.items():
        hits = [m.group(0) for m in rx.finditer(text)]
        if hits:
            found[intent] = hits
    # une question sur un bien qu'on veut visiter reste une demande de visite
    for intent in _PRIORITY:
        if intent in found:
            conf = 0.9 if intent in ("PAS_INTERESSE", "VISITE") else 0.75
            return intent, conf, found[intent][:3]
    if "?" in message or "؟" in message:
        return "QUESTION", 0.6, ["?"]
    if _YES_RX.search(text):
        return "INTERESSE", 0.6, [_YES_RX.search(text).group(0)]
    return "AUTRE", 0.3, []


# ---------- disponibilités ----------

DAYS = {
    0: ["lundi", "letnin", "tnin", "الاثنين", "الإثنين", "التنين", "monday"],
    1: ["mardi", "tlat", "tlata", "الثلاثاء", "التلات", "tuesday"],
    2: ["mercredi", "larb3", "larbe3", "الأربعاء", "الاربعاء", "لاربع", "wednesday"],
    3: ["jeudi", "lkhmis", "khmis", "الخميس", "thursday"],
    4: ["vendredi", "jem3a", "jm3a", "الجمعة", "الجمعه", "friday"],
    5: ["samedi", "sebt", "sabt", "السبت", "saturday"],
    6: ["dimanche", "l7ed", "lhad", "had", "الأحد", "الاحد", "الحد", "sunday"],
}
_DAY_RX = {d: _rx(w) for d, w in DAYS.items()}
_TODAY_RX = _rx(["aujourd'hui", "aujourd hui", "ce jour", "lyoum", "lyouma", "اليوم", "today"])
_TOMORROW_RX = _rx(["demain", "ghedda", "ghda", "ghadda", "غدا", "غدوة", "tomorrow"])
_AFTER_TOMORROW_RX = _rx(["apres-demain", "apres demain", "ba3d ghedda", "بعد غدا", "day after tomorrow"])
_WEEKEND_RX = _rx(["ce week-end", "ce weekend", "le week-end", "le weekend", "week-end", "weekend", "wikand", "الويكاند"])

PERIODS = {
    "matin": (9, 12, ["matin", "matinee", "sbah", "f sbah", "الصباح", "صباح", "morning"]),
    "midi": (12, 14, ["midi", "le3cha", "nhar", "الظهر", "noon", "lunch"]),
    "apres-midi": (14, 18, ["apres-midi", "apres midi", "aprem", "l3chiya", "la3chiya", "العشية", "afternoon"]),
    "soir": (18, 20, ["soir", "soiree", "fin de journee", "lil", "f lil", "المساء", "evening", "after work"]),
}
_PERIOD_RX = {k: (a, b, _rx(w)) for k, (a, b, w) in PERIODS.items()}

_TIME_RX = re.compile(
    r"(?<![\d/])(?:a |vers |a partir de |avant |apres |at |around |m3a |مع )?"
    r"([01]?\d|2[0-3])\s*(?:h|:|heures?\b)\s*([0-5]\d)?"
    r"|(?<![\d/])([1-9]|1[0-2])\s*(am|pm)\b"
)
_DATE_RX = re.compile(r"(?<!\d)(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?(?!\d)")


def _next_weekday(ref: date, weekday: int) -> date:
    return ref + timedelta(days=(weekday - ref.weekday()) % 7)


def _days_mentioned(text: str, ref: date) -> list[tuple[date, str]]:
    out: list[tuple[date, str]] = []
    if m := _AFTER_TOMORROW_RX.search(text):
        out.append((ref + timedelta(days=2), m.group(0)))
    elif m := _TOMORROW_RX.search(text):
        out.append((ref + timedelta(days=1), m.group(0)))
    if m := _TODAY_RX.search(text):
        out.append((ref, m.group(0)))
    for wd, rx in _DAY_RX.items():
        if m := rx.search(text):
            d = ref if ref.weekday() == wd and _TODAY_RX.search(text) else _next_weekday(ref, wd)
            if d == ref:  # « samedi » reçu un samedi : le samedi suivant
                d = ref + timedelta(days=7)
            out.append((d, m.group(0)))
    if not out and (m := _WEEKEND_RX.search(text)):
        sat = _next_weekday(ref, 5) if ref.weekday() != 5 else ref
        out.append((sat, m.group(0)))
        out.append((sat + timedelta(days=1), m.group(0)))
    for m in _DATE_RX.finditer(text):
        d_, mo, y = int(m.group(1)), int(m.group(2)), m.group(3)
        year = int(y) + (2000 if y and len(y) == 2 else 0) if y else ref.year
        try:
            d = date(year, mo, d_)
        except ValueError:
            continue
        if not y and d < ref:
            d = date(year + 1, mo, d_)
        out.append((d, m.group(0)))
    # dédoublonne en gardant l'ordre
    seen, uniq = set(), []
    for d, t in sorted(out, key=lambda x: x[0]):
        if d not in seen and ref <= d <= ref + timedelta(days=60):
            seen.add(d)
            uniq.append((d, t))
    return uniq


def _times_mentioned(text: str) -> list[tuple[time, str]]:
    out = []
    for m in _TIME_RX.finditer(text):
        if m.group(1) is not None:
            h, mi = int(m.group(1)), int(m.group(2) or 0)
        else:
            h, mi = int(m.group(3)) % 12 + (12 if m.group(4) == "pm" else 0), 0
        # « à 3h » en journée de visite : 15h
        if 1 <= h <= 7 and m.group(4) is None:
            h += 12
        if HEURE_OUVERTURE - 1 <= h <= 21:
            out.append((time(h, mi), m.group(0).strip()))
    return out


def _periods_mentioned(text: str) -> list[tuple[int, int, str]]:
    found = {k: m.group(0) for k, (_, _, rx) in _PERIOD_RX.items() if (m := rx.search(text))}
    if "apres-midi" in found:  # « après-midi » contient « midi »
        found.pop("midi", None)
    return [(_PERIOD_RX[k][0], _PERIOD_RX[k][1], t) for k, t in found.items()]


def availability(message: str, received: datetime) -> list[Disponibilite]:
    text = _norm(message)
    days = _days_mentioned(text, received.date())
    times = _times_mentioned(text)
    periods = _periods_mentioned(text)
    if not days and (times or periods):
        # « à 15h » sans jour : aujourd'hui si c'est encore possible, sinon demain
        first = times[0][0] if times else time(periods[0][0])
        d = received.date() if datetime.combine(received.date(), first) > received + timedelta(hours=2) else received.date() + timedelta(days=1)
        days = [(d, "")]
    out: list[Disponibilite] = []
    for d, day_txt in days[:5]:
        if times:
            for t, t_txt in times[:3]:
                start = datetime.combine(d, t)
                out.append(Disponibilite(debut=start, fin=start + timedelta(hours=1), texte=" ".join(x for x in (day_txt, t_txt) if x)))
        elif periods:
            for a, b, p_txt in periods[:2]:
                out.append(Disponibilite(debut=datetime.combine(d, time(a)), fin=datetime.combine(d, time(b)), texte=" ".join(x for x in (day_txt, p_txt) if x)))
        else:
            out.append(Disponibilite(debut=datetime.combine(d, time(HEURE_OUVERTURE)), fin=datetime.combine(d, time(HEURE_FERMETURE)), texte=day_txt))
    # rien dans le passé
    return [x for x in out if x.fin > received]


# ---------- IA (intention seulement, en secours) ----------

REPLY_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "intention": {"type": "string", "enum": list(INTENTIONS)},
        "citation": {"type": "string"},
    },
    "required": ["intention", "citation"],
}


def reply_prompt(message: str, titre: str | None) -> str:
    return (
        "Un agent immobilier marocain a proposé un bien à un client par WhatsApp"
        + (f" (« {titre} »)" if titre else "")
        + ". Voici la réponse du client (français, darija ou arabe). Classe-la : VISITE (veut visiter), "
        "INTERESSE (intéressé, veut plus d'informations ou de photos), NEGOCIATION (discute le prix), "
        "QUESTION (pose une question), PAS_INTERESSE (refuse), AUTRE. Donne en citation le passage exact "
        "du message qui justifie ton choix, recopié mot pour mot.\n\nRéponse du client :\n" + message
    )


async def _llm_intent(message: str, titre: str | None) -> tuple[str, str, str] | None:
    from match.extract import _llm_engines  # noqa: PLC0415
    from match.pitch import _call_json  # noqa: PLC0415

    for engine in _llm_engines():
        data = await _call_json(engine, reply_prompt(message, titre), REPLY_SCHEMA, "reponse")
        if data:
            return data.get("intention", "AUTRE"), data.get("citation", ""), engine
    return None


async def analyse_reply(req: ReponseRequest) -> ReponseResponse:
    message = redact(req.message)
    intent, conf, hints = rules_intent(message)
    engine = "regles"
    if intent == "AUTRE":
        llm = await _llm_intent(message, req.titre_bien)
        if llm is not None:
            llm_intent, citation, llm_engine = llm
            if llm_intent in INTENTIONS and citation and _norm(citation) in _norm(message):
                intent, conf, hints, engine = llm_intent, 0.6, [citation[:120]], llm_engine
            else:
                logger.info("Intention de l'IA écartée (citation absente du message)")
    dispo = availability(message, req.recu_le)
    if dispo and intent in ("AUTRE", "INTERESSE", "QUESTION"):
        # « samedi 10h ? » : le client propose un moment, c'est une demande de visite
        intent, conf = "VISITE", max(conf, 0.7)
        hints = hints + [dispo[0].texte]
    return ReponseResponse(intention=intent, confiance=conf, indices=hints, disponibilites=dispo, moteur=engine)
