"""Agrégation des analyses photo en un profil d'annonce, sans modèle (déterministe).

Point important : plusieurs photos peuvent montrer la même pièce. On ne compte donc
jamais « 3 chambres » parce que 3 photos montrent une chambre : on rapporte des
photos par type de pièce, et pour le mobilier on garde le maximum vu sur une photo
(pas la somme).
"""

import statistics
import unicodedata
from collections import Counter

from vision.schemas import PhotoAnalysis

# Pièces où la présence de meubles indique un bien meublé
LIVING_ROOMS = {"salon", "salle_a_manger", "chambre", "bureau"}
CONDITION_SEVERITY = {"neuf": 0, "bon_etat": 1, "a_rafraichir": 2, "a_renover": 3}

ROOM_LABELS = {
    "salon": "salon", "salle_a_manger": "salle à manger", "cuisine": "cuisine",
    "chambre": "chambre", "salle_de_bain": "salle de bain", "toilettes": "toilettes",
    "entree": "entrée", "couloir": "couloir", "bureau": "bureau", "buanderie": "buanderie",
    "dressing": "dressing", "balcon": "balcon", "terrasse": "terrasse", "jardin": "jardin",
    "piscine": "piscine", "facade": "façade", "vue": "vue", "parking": "parking",
    "garage": "garage", "cage_escalier": "cage d'escalier", "autre": "autre",
}
CONDITION_LABELS = {
    "neuf": "neuf", "bon_etat": "bon état", "a_rafraichir": "à rafraîchir",
    "a_renover": "à rénover", "inconnu": "inconnu",
}


def _norm(text: str | None) -> str:
    text = unicodedata.normalize("NFKD", (text or "").lower())
    return "".join(c for c in text if not unicodedata.combining(c))


def _most_common_condition(values: list[str]) -> str | None:
    known = [v for v in values if v in CONDITION_SEVERITY]
    if not known:
        return None
    counts = Counter(known)
    best = max(counts.values())
    # à égalité, on retient l'état le moins bon (prudence)
    return max((c for c, n in counts.items() if n == best), key=CONDITION_SEVERITY.get)


def build_profile(analyses: list[PhotoAnalysis]) -> dict:
    property_photos = [a for a in analyses if a.is_property_photo]

    rooms: dict[str, dict] = {}
    for a in property_photos:
        r = rooms.setdefault(
            a.room_type,
            {"room_type": a.room_type, "label": ROOM_LABELS[a.room_type], "photos": 0,
             "_mins": [], "_maxs": [], "_furniture": {}, "_conditions": []},
        )
        r["photos"] += 1
        if a.area_m2_min is not None and a.area_m2_max is not None:
            r["_mins"].append(a.area_m2_min)
            r["_maxs"].append(a.area_m2_max)
        for f in a.furniture:
            key = f.item.strip().lower()
            r["_furniture"][key] = max(r["_furniture"].get(key, 0), f.count)
        r["_conditions"].append(a.condition)

    pieces = []
    for r in rooms.values():
        pieces.append({
            "room_type": r["room_type"],
            "label": r["label"],
            "photos": r["photos"],
            # Fourchette médiane des estimations : ce sont des estimations, pas des mesures
            "area_m2_min": round(statistics.median(r["_mins"]), 1) if r["_mins"] else None,
            "area_m2_max": round(statistics.median(r["_maxs"]), 1) if r["_maxs"] else None,
            "furniture": [{"item": k, "count": v} for k, v in sorted(r["_furniture"].items())],
            "condition": _most_common_condition(r["_conditions"]),
        })
    pieces.sort(key=lambda p: (-p["photos"], p["room_type"]))

    equip_counter: Counter = Counter(e for a in property_photos for e in a.equipments)
    material_counter: Counter = Counter(
        (m.surface, m.material.strip().lower()) for a in property_photos for m in a.materials
    )

    living = [a for a in property_photos if a.room_type in LIVING_ROOMS]
    if not living:
        meuble = None
    else:
        meuble = any(sum(f.count for f in a.furniture) >= 2 for a in living)

    froms = [a.era.from_year for a in property_photos if a.era.from_year]
    tos = [a.era.to_year for a in property_photos if a.era.to_year]
    epoque = None
    if froms or tos:
        epoque = {
            "from_year": int(statistics.median(froms)) if froms else None,
            "to_year": int(statistics.median(tos)) if tos else None,
        }

    signes = []
    for a in property_photos:
        for s in a.condition_signs:
            if s not in signes:
                signes.append(s)

    lights = Counter(a.natural_light for a in property_photos if a.natural_light != "inconnu")
    views = []
    for a in property_photos:
        if a.view and a.view.strip().lower() not in [v.lower() for v in views]:
            views.append(a.view.strip())

    return {
        "photos_analysees": len(analyses),
        "photos_du_bien": len(property_photos),
        "pieces": pieces,
        "equipements": [{"label": k, "photos": n} for k, n in equip_counter.most_common()],
        "materiaux": [
            {"surface": s, "material": m, "photos": n} for (s, m), n in material_counter.most_common()
        ],
        "meuble": meuble,
        "etat_general": _most_common_condition([a.condition for a in property_photos]),
        "signes_etat": signes,
        "epoque": epoque,
        "vues": views,
        "lumiere": lights.most_common(1)[0][0] if lights else None,
    }


def find_inconsistencies(profile: dict, declared: dict) -> list[str]:
    """Écarts entre ce que l'agent déclare et ce que montrent les photos.

    Formulations prudentes : « non visible sur les photos », jamais « faux ».
    """
    issues: list[str] = []
    text = _norm(f"{declared.get('title', '')} {declared.get('description', '')}")
    room_types = {p["room_type"] for p in profile["pieces"]}
    equipments = _norm(" ".join(e["label"] for e in profile["equipements"]))

    if profile["photos_du_bien"] == 0:
        return issues

    if "piscine" in text and "piscine" not in room_types and "piscine" not in equipments:
        issues.append("La description mentionne une piscine, non visible sur les photos.")
    if ("jardin" in text) and "jardin" not in room_types:
        issues.append("La description mentionne un jardin, non visible sur les photos.")
    if "terrasse" in text and "terrasse" not in room_types:
        issues.append("La description mentionne une terrasse, non visible sur les photos.")
    if "vue mer" in text and not any("mer" in _norm(v) for v in profile["vues"]):
        issues.append("La description mentionne une vue mer, non visible sur les photos.")

    unfurnished = "non meuble" in text
    if "meuble" in text and not unfurnished and profile["meuble"] is False:
        issues.append("L'annonce est présentée comme meublée, mais les pièces de vie photographiées sont vides.")
    if unfurnished and profile["meuble"] is True:
        issues.append("L'annonce est présentée comme non meublée, mais des meubles sont visibles.")

    etat = profile["etat_general"]
    if ("neuf" in text.split() or "jamais habite" in text) and etat in ("a_rafraichir", "a_renover"):
        issues.append(
            f"L'annonce est présentée comme neuve, mais l'état apparent est « {CONDITION_LABELS[etat]} »."
        )

    surface = declared.get("surface")
    if surface:
        for p in profile["pieces"]:
            if p["area_m2_min"] and p["area_m2_min"] > surface:
                issues.append(
                    f"La pièce « {p['label']} » est estimée à au moins {p['area_m2_min']:g} m², "
                    f"plus que la surface déclarée ({surface:g} m²)."
                )
    return issues


def build_facts(profile: dict, declared: dict) -> dict:
    """Faits transmis au rédacteur : uniquement déclaré ou observé, sans estimations chiffrées."""
    facts: dict = {k: v for k, v in declared.items() if k != "description" and v not in (None, "")}
    facts["pieces_photographiees"] = [p["label"] for p in profile["pieces"] if p["room_type"] != "autre"]
    facts["equipements_visibles"] = [e["label"] for e in profile["equipements"]]
    facts["materiaux_visibles"] = [f"{m['material']} ({m['surface']})" for m in profile["materiaux"]]
    if profile["meuble"] is not None:
        facts["meuble"] = profile["meuble"]
    if profile["etat_general"]:
        facts["etat_apparent"] = CONDITION_LABELS[profile["etat_general"]]
    if profile["vues"]:
        facts["vues"] = profile["vues"]
    if profile["lumiere"]:
        facts["luminosite"] = profile["lumiere"]
    return facts


def template_description(profile: dict, declared: dict) -> str:
    """Description de secours, sans modèle, à partir des seuls faits."""
    category = declared.get("category") or "Bien"
    city = declared.get("city")
    surface = declared.get("surface")

    first = category
    if surface:
        first += f" de {surface:g} m²"
    if city:
        first += f" situé à {city}"
    sentences = [first + "."]

    pieces = [p["label"] for p in profile["pieces"] if p["room_type"] not in ("autre", "vue", "facade")]
    if pieces:
        sentences.append("Il comprend notamment : " + ", ".join(pieces) + ".")
    equipments = [e["label"] for e in profile["equipements"][:6]]
    if equipments:
        sentences.append("Équipements : " + ", ".join(equipments) + ".")
    materials = [m["material"] for m in profile["materiaux"][:4]]
    if materials:
        sentences.append("Finitions : " + ", ".join(dict.fromkeys(materials)) + ".")
    if profile["meuble"] is True:
        sentences.append("Le bien est proposé meublé.")
    if profile["vues"]:
        sentences.append("Vue : " + ", ".join(profile["vues"]) + ".")
    etat = profile["etat_general"]
    if etat in ("neuf", "bon_etat"):
        sentences.append(f"État : {CONDITION_LABELS[etat]}.")
    return " ".join(sentences)
