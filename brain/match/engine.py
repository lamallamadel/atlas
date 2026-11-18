"""Matching acheteur ↔ biens, déterministe et explicable (pas de modèle).

1. Filtres éliminatoires : type de transaction, catégorie, ville, budget (+10 % de tolérance).
2. Score pondéré sur les critères renseignés uniquement (budget, surface, ville, meublé,
   équipements, état), ramené sur 100.
3. Chaque point du score s'accompagne d'une raison lisible ; ce qui manque ou n'est pas
   vérifiable devient une alerte. Aucune raison n'est inventée.

Les caractéristiques « vues sur les photos » viennent du module vision (profil agrégé).
"""

import unicodedata

from pydantic import BaseModel, Field

BUDGET_TOLERANCE = 0.10

WEIGHTS = {
    "budget": 30,
    "surface": 20,
    "ville": 15,
    "equipements": 15,
    "etat": 10,
    "meuble": 10,
}

# Variantes d'un même type de transaction
TRANSACTION_GROUPS = {"SALE": "SALE", "RENT": "RENT", "RENTAL": "RENT", "LEASE": "RENT", "EXCHANGE": "EXCHANGE"}
CATEGORY_LABELS = {"APARTMENT": "appartement", "HOUSE": "maison", "STUDIO": "studio", "COMMERCIAL": "local commercial"}
CONDITION_LABELS = {"neuf": "neuf", "bon_etat": "bon état", "a_rafraichir": "à rafraîchir", "a_renover": "à rénover"}

# Synonymes pour retrouver un équipement dans les photos ou le texte de l'annonce
EQUIPMENT_SYNONYMS = {
    "parking": ["parking", "garage", "place de stationnement", "box"],
    "climatisation": ["climatisation", "clim", "climatiseur"],
    "ascenseur": ["ascenseur"],
    "piscine": ["piscine"],
    "jardin": ["jardin"],
    "terrasse": ["terrasse"],
    "balcon": ["balcon"],
    "cuisine équipée": ["cuisine equipee", "cuisine amenagee"],
    "vue mer": ["vue mer", "vue sur la mer", "vue sur mer", "front de mer"],
    "chauffage": ["chauffage", "chauffage central", "radiateur"],
    "cheminée": ["cheminee"],
    "concierge": ["concierge", "gardien", "securite 24"],
}


def norm(text: str | None) -> str:
    text = unicodedata.normalize("NFKD", (text or "").lower().strip())
    return "".join(c for c in text if not unicodedata.combining(c))


class Criteria(BaseModel):
    transaction_types: list[str] = []
    categories: list[str] = []
    cities: list[str] = []
    budget_min: float | None = Field(default=None, ge=0)
    budget_max: float | None = Field(default=None, ge=0)
    surface_min: float | None = Field(default=None, ge=0)
    surface_max: float | None = Field(default=None, ge=0)
    furnished: bool | None = None
    equipments: list[str] = []
    accepted_conditions: list[str] = []

    def is_empty(self) -> bool:
        return not any([
            self.transaction_types, self.categories, self.cities, self.budget_min, self.budget_max,
            self.surface_min, self.surface_max, self.furnished is not None, self.equipments,
            self.accepted_conditions,
        ])


class Bien(BaseModel):
    id: int
    title: str | None = None
    description: str | None = None
    category: str | None = None
    type: str | None = None
    city: str | None = None
    price: float | None = None
    surface: float | None = None
    currency: str | None = None
    # Issus de l'analyse des photos (module vision) — absents si non analysé
    vision_meuble: bool | None = None
    vision_etat: str | None = None
    vision_equipements: list[str] = []
    vision_vues: list[str] = []
    vision_pieces: list[str] = []
    fraud_statut: str | None = None
    duplicate_statut: str | None = None


class MatchResult(BaseModel):
    bien_id: int
    score_match: int
    raisons: list[str]
    alertes: list[str]
    details: dict[str, float]


def _fmt_price(v: float, currency: str | None) -> str:
    return f"{v:,.0f}".replace(",", " ") + f" {currency or 'MAD'}"


def exclusion_reason(c: Criteria, b: Bien) -> str | None:
    """Raison d'exclusion, ou None si le bien reste candidat."""
    if c.transaction_types:
        wanted = {TRANSACTION_GROUPS.get(t.upper(), t.upper()) for t in c.transaction_types}
        if TRANSACTION_GROUPS.get((b.type or "").upper()) not in wanted:
            return "type de transaction"
    if c.categories and (b.category or "").upper() not in {x.upper() for x in c.categories}:
        return "catégorie"
    if c.cities and norm(b.city) not in {norm(x) for x in c.cities}:
        return "ville"
    if c.budget_max and b.price and b.price > c.budget_max * (1 + BUDGET_TOLERANCE):
        return "budget"
    return None


def _equipment_sources(b: Bien) -> tuple[str, str]:
    seen = norm(" | ".join(b.vision_equipements + b.vision_vues + b.vision_pieces))
    text = norm(f"{b.title or ''} {b.description or ''}")
    return seen, text


def _find_equipment(wanted: str, seen: str, text: str) -> str | None:
    """Renvoie « photos », « annonce » ou None."""
    key = norm(wanted)
    variants = [norm(v) for v in EQUIPMENT_SYNONYMS.get(wanted, EQUIPMENT_SYNONYMS.get(key, [wanted]))]
    if key not in variants:
        variants.append(key)
    if any(v in seen for v in variants):
        return "photos"
    if any(v in text for v in variants):
        return "annonce"
    return None


def score_bien(c: Criteria, b: Bien) -> MatchResult:
    raisons: list[str] = []
    alertes: list[str] = []
    parts: dict[str, float] = {}

    if c.transaction_types or c.categories:
        label = CATEGORY_LABELS.get((b.category or "").upper())
        if label and c.categories:
            raisons.append(f"Type de bien recherché ({label})")

    # Budget
    if c.budget_min or c.budget_max:
        if b.price is None:
            parts["budget"] = 0.5
            alertes.append("Prix non renseigné")
        else:
            lo, hi = c.budget_min or 0, c.budget_max
            if hi and b.price > hi:
                over = (b.price - hi) / hi
                parts["budget"] = max(0.0, 1 - over / BUDGET_TOLERANCE)
                alertes.append(f"Dépasse le budget de {over * 100:.0f} % ({_fmt_price(b.price, b.currency)})")
            elif b.price < lo:
                parts["budget"] = 0.8
                raisons.append(f"Sous le budget ({_fmt_price(b.price, b.currency)})")
            else:
                parts["budget"] = 1.0
                raisons.append(f"Dans le budget ({_fmt_price(b.price, b.currency)})")

    # Surface
    if c.surface_min or c.surface_max:
        if b.surface is None:
            parts["surface"] = 0.5
            alertes.append("Surface non renseignée")
        elif c.surface_min and b.surface < c.surface_min:
            ratio = b.surface / c.surface_min
            parts["surface"] = ratio**2
            alertes.append(f"Surface inférieure au minimum ({b.surface:g} m² pour {c.surface_min:g} m²)")
        elif c.surface_max and b.surface > c.surface_max:
            parts["surface"] = 0.8
            raisons.append(f"Surface plus grande que demandé ({b.surface:g} m²)")
        else:
            parts["surface"] = 1.0
            raisons.append(f"Surface adaptée ({b.surface:g} m²)")

    # Ville (déjà filtrée : si renseignée, elle correspond)
    if c.cities:
        parts["ville"] = 1.0
        raisons.append(f"Ville recherchée ({b.city})")

    # Équipements souhaités
    if c.equipments:
        seen, text = _equipment_sources(b)
        found = 0.0
        for wanted in c.equipments:
            where = _find_equipment(wanted, seen, text)
            if where == "photos":
                found += 1
                raisons.append(f"{wanted.capitalize()} (vu sur les photos)")
            elif where == "annonce":
                found += 0.8  # déclaré mais pas vérifié visuellement
                raisons.append(f"{wanted.capitalize()} (mentionné dans l'annonce)")
            else:
                alertes.append(f"{wanted.capitalize()} : non trouvé")
        parts["equipements"] = found / len(c.equipments)

    # État
    if c.accepted_conditions:
        if not b.vision_etat:
            parts["etat"] = 0.5
            alertes.append("État non vérifié (photos non analysées)")
        elif b.vision_etat in c.accepted_conditions:
            parts["etat"] = 1.0
            raisons.append(f"État : {CONDITION_LABELS.get(b.vision_etat, b.vision_etat)}")
        else:
            parts["etat"] = 0.0
            alertes.append(f"État apparent « {CONDITION_LABELS.get(b.vision_etat, b.vision_etat)} » non souhaité")

    # Meublé
    if c.furnished is not None:
        if b.vision_meuble is None:
            parts["meuble"] = 0.5
            alertes.append("Meublé : non vérifié")
        elif b.vision_meuble == c.furnished:
            parts["meuble"] = 1.0
            raisons.append("Meublé" if c.furnished else "Non meublé")
        else:
            parts["meuble"] = 0.0
            alertes.append("Meublé alors que non souhaité" if b.vision_meuble else "Non meublé")

    total_weight = sum(WEIGHTS[k] for k in parts)
    score = round(100 * sum(WEIGHTS[k] * v for k, v in parts.items()) / total_weight) if total_weight else 0

    # Signaux de confiance : on avertit et on pénalise, sans exclure
    if b.fraud_statut == "FRAUDULEUX":
        score -= 30
        alertes.insert(0, "Annonce signalée comme fraude probable")
    elif b.fraud_statut == "SUSPECT":
        score -= 10
        alertes.insert(0, "Annonce signalée comme suspecte")
    if b.duplicate_statut:
        alertes.append("Doublon possible d'une autre annonce")

    return MatchResult(
        bien_id=b.id,
        score_match=max(0, min(100, score)),
        raisons=raisons,
        alertes=alertes,
        details={k: round(v, 2) for k, v in parts.items()},
    )


def match(c: Criteria, biens: list[Bien], limit: int = 50) -> tuple[list[MatchResult], dict[str, int]]:
    """Renvoie (résultats triés, nombre de biens exclus par raison)."""
    results: list[MatchResult] = []
    excluded: dict[str, int] = {}
    for b in biens:
        reason = exclusion_reason(c, b)
        if reason:
            excluded[reason] = excluded.get(reason, 0) + 1
            continue
        results.append(score_bien(c, b))
    results.sort(key=lambda r: (-r.score_match, r.bien_id))
    return results[:limit], excluded
