"""Extraction des critères de recherche à partir des notes et des messages d'un client.

Garde-fous :
  - les téléphones et e-mails sont masqués avant tout envoi à un modèle externe ;
  - chaque critère doit être justifié par une citation présente MOT POUR MOT dans le texte
    (après normalisation) ; sinon il est rejeté. Le modèle ne peut donc pas inventer un critère ;
  - sans modèle disponible, un extracteur à règles (français, darija, arabe) prend le relais.
Le résultat est une SUGGESTION : l'agent la relit et l'applique, rien n'est enregistré ici.
"""

import json
import logging
import re
import unicodedata

import httpx

from config import settings
from match.engine import EQUIPMENT_SYNONYMS

logger = logging.getLogger("match.extract")

TRANSACTIONS = ["SALE", "RENT"]
CATEGORIES = ["APARTMENT", "HOUSE", "STUDIO", "COMMERCIAL"]
CONDITIONS = ["neuf", "bon_etat", "a_rafraichir", "a_renover"]
EQUIPMENTS = list(EQUIPMENT_SYNONYMS)
FIELDS = [
    "transaction_types", "categories", "cities", "budget_min", "budget_max", "surface_min",
    "surface_max", "furnished", "equipments", "accepted_conditions",
]

# Villes marocaines courantes : variantes -> nom canonique
CITIES = {
    "Tanger": ["tanger", "tangier", "tanja", "طنجة"],
    "Tétouan": ["tetouan", "tetuan", "تطوان"],
    "Casablanca": ["casablanca", "casa", "الدار البيضاء", "كازا"],
    "Rabat": ["rabat", "الرباط"],
    "Salé": ["سلا"],  # « sale » latin : trop ambigu (for sale, sale…)
    "Témara": ["temara", "تمارة"],
    "Kénitra": ["kenitra", "القنيطرة"],
    "Mohammedia": ["mohammedia", "المحمدية"],
    "Marrakech": ["marrakech", "marrakesh", "مراكش"],
    "Fès": ["fes", "fez", "فاس"],
    "Meknès": ["meknes", "مكناس"],
    "Agadir": ["agadir", "أكادير", "اكادير"],
    "Oujda": ["oujda", "وجدة"],
    "El Jadida": ["el jadida", "eljadida", "الجديدة"],
    "Essaouira": ["essaouira", "الصويرة"],
    "Asilah": ["asilah", "assilah", "أصيلة", "اصيلة"],
    "Larache": ["larache", "العرائش"],
    "Martil": ["martil", "مرتيل"],
    "M'diq": ["mdiq", "m'diq", "المضيق"],
    "Nador": ["nador", "الناظور"],
    "Al Hoceïma": ["al hoceima", "alhoceima", "hoceima", "الحسيمة"],
}

ARABIC_EQUIPMENTS = {
    "parking": ["باركينغ", "باركينج", "كراج", "مرآب"],
    "piscine": ["مسبح", "بيسين"],
    "ascenseur": ["مصعد", "اسانسور"],
    "vue mer": ["على البحر", "مطل على البحر", "فيو على البحر"],
    "terrasse": ["تراس", "سطح"],
    "jardin": ["حديقة", "جردة", "جاردان"],
    "climatisation": ["مكيف", "كليماتيزور", "كليم"],
    "cuisine équipée": ["كوزينة مجهزة", "مطبخ مجهز"],
}

NEGATIONS = ["pas de", "sans", "non ", "pas besoin", "بلا", "ماشي", "بدون"]


def norm(text: str | None) -> str:
    text = unicodedata.normalize("NFKD", (text or "").lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.replace("’", "'").replace("²", "2")
    return re.sub(r"\s+", " ", text).strip()


_PHONE = re.compile(r"(?:\+|00)?\d[\d .\-]{7,}\d")
_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")


def redact(text: str) -> str:
    """Masque téléphones et e-mails (inutiles pour les critères, sensibles)."""
    return _PHONE.sub("[téléphone]", _EMAIL.sub("[email]", text))


# ─── Montants ────────────────────────────────────────────────────────────────

_AMOUNT = re.compile(
    r"(\d+(?:[.,]\d+)?(?:\s\d{3})*)\s*(millions?|mlns?|mdh|mio|k|dh|mad|dhs|درهم|مليون|الف|ألف)?",
    re.IGNORECASE,
)


def parse_amount(number: str, unit: str | None) -> float | None:
    """Convertit en dirhams. « 120 millions » (usage marocain) = 120 millions de centimes."""
    value = float(number.replace(" ", "").replace(",", "."))
    u = norm(unit or "")
    if u in ("million", "millions", "mln", "mlns", "مليون", "mio"):
        # < 20 : millions de dirhams (1,2 million) ; >= 20 : millions de centimes (120 millions)
        return value * 1_000_000 if value < 20 else value * 10_000
    if u == "mdh":
        return value * 1_000_000
    if u in ("k", "الف", "ألف"):
        return value * 1_000
    return value


def _negated(text: str, pos: int) -> bool:
    before = text[max(0, pos - 15):pos]
    return any(n in before for n in NEGATIONS)


_ARABIC = re.compile(r"[\u0600-\u06FF]")


def _pattern(variant: str) -> str:
    v = re.escape(variant)
    if _ARABIC.search(variant):
        # Prépositions et conjonction collées au mot : فطنجة (à Tanger), وبطنجة, لطنجة
        return rf"(?<!\w)(?:و)?(?:[فبل])?{v}(?!\w)"
    # Accord en français : meublé / meublée / meublés
    return rf"(?<!\w){v}(?:e?s?)(?!\w)"


def _find(text: str, variants: list[str]) -> tuple[int, str] | None:
    for v in variants:
        nv = norm(v)
        m = re.search(_pattern(nv), text)
        if m and not _negated(text, m.start()):
            return m.start(), nv
    return None


def _snippet(text: str, pos: int, length: int = 60) -> str:
    start = max(0, text.rfind(" ", 0, max(0, pos - 20)) + 1)
    end = text.find(" ", pos + length)
    return text[start:end if end > 0 else len(text)].strip()


def rules_extract(texts: list[str]) -> tuple[dict, dict[str, str]]:
    """Extraction par règles. Renvoie (critères, preuves par champ)."""
    criteres: dict = {}
    preuves: dict[str, str] = {}
    full = norm(" \n ".join(texts))

    def add_list(field: str, value: str, pos: int):
        criteres.setdefault(field, [])
        if value not in criteres[field]:
            criteres[field].append(value)
            preuves.setdefault(field, _snippet(full, pos))

    for value, variants in {
        "SALE": ["acheter", "achat", "acquerir", "a vendre", "شراء", "نشري", "نشريو"],
        "RENT": ["louer", "location", "loyer", "a louer", "كراء", "نكري", "للكراء"],
    }.items():
        hit = _find(full, variants)
        if hit:
            add_list("transaction_types", value, hit[0])

    for value, variants in {
        "APARTMENT": ["appartement", "appart", "appt", "شقة", "ابارطمان", "apartment"],
        "HOUSE": ["villa", "maison", "riad", "duplex", "فيلا", "دار", "منزل"],
        "STUDIO": ["studio", "ستوديو"],
        "COMMERCIAL": ["local commercial", "magasin", "bureau", "محل", "مكتب"],
    }.items():
        hit = _find(full, variants)
        if hit:
            add_list("categories", value, hit[0])

    for city, variants in CITIES.items():
        hit = _find(full, variants)
        if hit:
            add_list("cities", city, hit[0])

    for equipment in EQUIPMENTS:
        hit = _find(full, EQUIPMENT_SYNONYMS[equipment] + ARABIC_EQUIPMENTS.get(equipment, []) + [equipment])
        if hit:
            add_list("equipments", equipment, hit[0])

    unfurnished = _find(full, ["non meuble", "vide", "غير مفروش", "خاوية"])
    furnished = _find(full, ["meuble", "مفروش", "مفروشة"])
    if unfurnished:
        criteres["furnished"] = False
        preuves["furnished"] = _snippet(full, unfurnished[0])
    elif furnished:
        criteres["furnished"] = True
        preuves["furnished"] = _snippet(full, furnished[0])

    hit = _find(full, ["neuf", "jamais habite", "جديد", "جديدة"])
    if hit:
        add_list("accepted_conditions", "neuf", hit[0])

    # Surface : « 90 m2 », « 100 mètres carrés », « 120 متر »
    m = re.search(r"(\d{2,4})\s*(?:m2|m |metres? carres|متر)", full + " ")
    if m:
        criteres["surface_min"] = float(m.group(1))
        preuves["surface_min"] = _snippet(full, m.start())

    # Budget : « entre X et Y », sinon un montant près d'un mot-clé
    between = re.search(r"entre\s+" + _AMOUNT.pattern + r"\s+et\s+" + _AMOUNT.pattern, full)
    if between:
        g = between.groups()
        lo, hi = parse_amount(g[0], g[1] or g[3]), parse_amount(g[2], g[3])
        if lo and hi and 10_000 <= lo <= hi <= 1_000_000_000:
            criteres["budget_min"], criteres["budget_max"] = lo, hi
            preuves["budget_min"] = preuves["budget_max"] = _snippet(full, between.start())
    else:
        kw = re.search(r"(budget|max|maximum|jusqu'?a|pas plus de|prix|ميزانية|فلوس|حتى)", full)
        if kw:
            for am in _AMOUNT.finditer(full, kw.start()):
                if am.start() - kw.end() > 30:
                    break
                if not am.group(2) and len(am.group(1).replace(" ", "")) < 5:
                    continue  # « 3 chambres », pas un prix
                value = parse_amount(am.group(1), am.group(2))
                if value and 10_000 <= value <= 1_000_000_000:
                    criteres["budget_max"] = value
                    preuves["budget_max"] = _snippet(full, kw.start())
                    break
    return criteres, preuves


# ─── Modèle (OpenAI / Ollama) ────────────────────────────────────────────────

def _nullable(t: str) -> dict:
    return {"type": [t, "null"]}


EXTRACTION_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": FIELDS + ["preuves"],
    "properties": {
        "transaction_types": {"type": "array", "items": {"type": "string", "enum": TRANSACTIONS}},
        "categories": {"type": "array", "items": {"type": "string", "enum": CATEGORIES}},
        "cities": {"type": "array", "items": {"type": "string"}},
        "budget_min": _nullable("number"),
        "budget_max": _nullable("number"),
        "surface_min": _nullable("number"),
        "surface_max": _nullable("number"),
        "furnished": _nullable("boolean"),
        "equipments": {"type": "array", "items": {"type": "string", "enum": EQUIPMENTS}},
        "accepted_conditions": {"type": "array", "items": {"type": "string", "enum": CONDITIONS}},
        "preuves": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["champ", "citation"],
                "properties": {"champ": {"type": "string", "enum": FIELDS}, "citation": {"type": "string"}},
            },
        },
    },
}

EXTRACTION_PROMPT = """Tu aides un agent immobilier au Maroc. Voici des notes de l'agent et des messages
d'un client (français, darija, arabe ou anglais). Extrais UNIQUEMENT les critères de recherche que le
client exprime clairement.

Règles :
- Si un critère n'est pas exprimé : liste vide ou null. N'invente rien, ne déduis rien.
- Pour CHAQUE critère renseigné, ajoute dans "preuves" une citation EXACTE et COURTE du texte
  (copiée telle quelle, 3 à 12 mots) qui le justifie.
- Montants en dirhams (MAD). Usage marocain : « 120 millions » ou « 120 مليون » sans autre précision
  = 120 millions de CENTIMES = 1 200 000 MAD ; « 1,2 million » = 1 200 000 MAD ; « 800k » = 800 000 MAD.
- Un plafond (« max », « pas plus de », « jusqu'à ») va dans budget_max.
- transaction_types : SALE (achat) ou RENT (location).
- cities : noms de villes en français (Tanger, Tétouan, Casablanca…).
- equipments : uniquement dans la liste autorisée. Ignore ce que le client dit NE PAS vouloir.

Textes :
"""


def _llm_engines() -> list[str]:
    engines = []
    if settings.openai_enabled and settings.openai_api_key:
        engines.append("openai")
    if settings.ollama_enabled:
        engines.append("ollama")
    return engines


async def _call_llm(prompt: str) -> tuple[dict, str] | None:
    for engine in _llm_engines():
        try:
            if engine == "openai":
                from openai import AsyncOpenAI

                client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=settings.vision_timeout_seconds)
                resp = await client.chat.completions.create(
                    model=settings.openai_model,
                    temperature=0,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={
                        "type": "json_schema",
                        "json_schema": {"name": "search_criteria", "strict": True, "schema": EXTRACTION_SCHEMA},
                    },
                )
                return json.loads(resp.choices[0].message.content), engine
            async with httpx.AsyncClient(timeout=settings.vision_timeout_seconds) as client:
                r = await client.post(
                    f"{settings.ollama_url}/api/chat",
                    json={
                        "model": settings.ollama_model,
                        "stream": False,
                        "format": EXTRACTION_SCHEMA,
                        "options": {"temperature": 0},
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                r.raise_for_status()
                return json.loads(r.json()["message"]["content"]), engine
        except Exception as e:
            logger.warning("Extraction %s échouée : %s", engine, e)
    return None


def keep_justified(raw: dict, source_text: str) -> tuple[dict, dict[str, str]]:
    """Ne garde que les critères valides ET justifiés par une citation présente dans le texte."""
    haystack = norm(source_text)
    preuves: dict[str, str] = {}
    for p in raw.get("preuves") or []:
        champ, citation = p.get("champ"), (p.get("citation") or "").strip()
        if champ in FIELDS and citation and len(norm(citation)) >= 3 and norm(citation) in haystack:
            preuves.setdefault(champ, citation)

    criteres: dict = {}
    allowed = {
        "transaction_types": TRANSACTIONS, "categories": CATEGORIES,
        "equipments": EQUIPMENTS, "accepted_conditions": CONDITIONS,
    }
    for field in FIELDS:
        if field not in preuves:
            continue
        value = raw.get(field)
        if field in allowed:
            items = [v for v in (value or []) if v in allowed[field]]
            if items:
                criteres[field] = list(dict.fromkeys(items))
        elif field == "cities":
            items = [c.strip() for c in (value or []) if isinstance(c, str) and c.strip()]
            if items:
                criteres[field] = list(dict.fromkeys(items))[:10]
        elif field == "furnished":
            if isinstance(value, bool):
                criteres[field] = value
        elif isinstance(value, (int, float)) and not isinstance(value, bool):
            lo, hi = (10_000, 1_000_000_000) if field.startswith("budget") else (5, 100_000)
            if lo <= value <= hi:
                criteres[field] = float(value)

    if (criteres.get("budget_min") or 0) > (criteres.get("budget_max") or float("inf")):
        criteres.pop("budget_min")
    return criteres, {k: v for k, v in preuves.items() if k in criteres}


async def extract_criteria(textes: list[dict]) -> tuple[dict, dict[str, str], str]:
    """Renvoie (critères, preuves, moteur)."""
    cleaned = [redact(t["texte"]) for t in textes if (t.get("texte") or "").strip()]
    labelled = "\n".join(
        f"[{t.get('source', 'message')}] {redact(t['texte'])}" for t in textes if (t.get("texte") or "").strip()
    )
    llm = await _call_llm(EXTRACTION_PROMPT + labelled) if _llm_engines() else None
    if llm:
        raw, engine = llm
        criteres, preuves = keep_justified(raw, "\n".join(cleaned))
        return criteres, preuves, engine
    criteres, preuves = rules_extract(cleaned)
    return criteres, preuves, "regles"
