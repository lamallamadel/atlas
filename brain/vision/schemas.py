"""Schéma des analyses visuelles.

Le même vocabulaire sert à trois choses :
  - le schéma JSON imposé au modèle de vision (réponse structurée, pas de texte libre),
  - la validation Pydantic de ce que le modèle renvoie,
  - l'agrégation par annonce.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ROOM_TYPES = [
    "salon", "salle_a_manger", "cuisine", "chambre", "salle_de_bain", "toilettes",
    "entree", "couloir", "bureau", "buanderie", "dressing", "balcon", "terrasse",
    "jardin", "piscine", "facade", "vue", "parking", "garage", "cage_escalier", "autre",
]
CONDITIONS = ["neuf", "bon_etat", "a_rafraichir", "a_renover", "inconnu"]
LIGHT_LEVELS = ["faible", "moyenne", "bonne", "inconnu"]
SURFACES = ["sol", "mur", "plafond", "plan_de_travail", "menuiserie", "facade", "autre"]

RoomType = Literal[tuple(ROOM_TYPES)]  # type: ignore[valid-type]
Condition = Literal[tuple(CONDITIONS)]  # type: ignore[valid-type]
Light = Literal[tuple(LIGHT_LEVELS)]  # type: ignore[valid-type]
Surface = Literal[tuple(SURFACES)]  # type: ignore[valid-type]


class Material(BaseModel):
    model_config = ConfigDict(extra="ignore")
    surface: Surface
    material: str = Field(min_length=1, max_length=80)


class FurnitureItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item: str = Field(min_length=1, max_length=80)
    count: int = Field(ge=1, le=50)


class EraEstimate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    from_year: int | None = Field(default=None, ge=1800, le=2100)
    to_year: int | None = Field(default=None, ge=1800, le=2100)
    rationale: str = ""


class PhotoAnalysis(BaseModel):
    """Ce que le modèle voit sur UNE photo. Jamais de déduction au-delà du visible."""

    model_config = ConfigDict(extra="ignore")

    is_property_photo: bool
    room_type: RoomType
    caption: str = Field(default="", max_length=300)
    equipments: list[str] = []
    materials: list[Material] = []
    furniture: list[FurnitureItem] = []
    condition: Condition = "inconnu"
    condition_signs: list[str] = []
    era: EraEstimate = EraEstimate()
    area_m2_min: float | None = Field(default=None, ge=0, le=2000)
    area_m2_max: float | None = Field(default=None, ge=0, le=2000)
    dimension_reference: str | None = None
    view: str | None = None
    natural_light: Light = "inconnu"
    confidence: float = Field(default=0.5, ge=0, le=1)

    @field_validator("equipments", "condition_signs")
    @classmethod
    def _clean_labels(cls, values: list[str]) -> list[str]:
        seen: list[str] = []
        for v in values:
            v = v.strip().lower()
            if v and v not in seen:
                seen.append(v[:80])
        return seen

    @field_validator("area_m2_max")
    @classmethod
    def _max_not_below_min(cls, v, info):
        mn = info.data.get("area_m2_min")
        if v is not None and mn is not None and v < mn:
            return mn
        return v


def _nullable(schema: dict) -> dict:
    t = schema["type"]
    return {**schema, "type": [t, "null"]}


# Schéma JSON « strict » (format OpenAI Structured Outputs, aussi accepté par Ollama) :
# toutes les propriétés sont requises, les absences s'expriment par null.
PHOTO_ANALYSIS_JSON_SCHEMA: dict = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "is_property_photo", "room_type", "caption", "equipments", "materials", "furniture",
        "condition", "condition_signs", "era", "area_m2_min", "area_m2_max",
        "dimension_reference", "view", "natural_light", "confidence",
    ],
    "properties": {
        "is_property_photo": {"type": "boolean"},
        "room_type": {"type": "string", "enum": ROOM_TYPES},
        "caption": {"type": "string"},
        "equipments": {"type": "array", "items": {"type": "string"}},
        "materials": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["surface", "material"],
                "properties": {
                    "surface": {"type": "string", "enum": SURFACES},
                    "material": {"type": "string"},
                },
            },
        },
        "furniture": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["item", "count"],
                "properties": {"item": {"type": "string"}, "count": {"type": "integer"}},
            },
        },
        "condition": {"type": "string", "enum": CONDITIONS},
        "condition_signs": {"type": "array", "items": {"type": "string"}},
        "era": {
            "type": "object",
            "additionalProperties": False,
            "required": ["from_year", "to_year", "rationale"],
            "properties": {
                "from_year": _nullable({"type": "integer"}),
                "to_year": _nullable({"type": "integer"}),
                "rationale": {"type": "string"},
            },
        },
        "area_m2_min": _nullable({"type": "number"}),
        "area_m2_max": _nullable({"type": "number"}),
        "dimension_reference": _nullable({"type": "string"}),
        "view": _nullable({"type": "string"}),
        "natural_light": {"type": "string", "enum": LIGHT_LEVELS},
        "confidence": {"type": "number"},
    },
}


ANALYSIS_PROMPT = """Tu es un expert immobilier au Maroc. Analyse cette photo d'un bien à vendre ou à louer.

Règles strictes :
- Décris UNIQUEMENT ce qui est visible sur la photo. N'invente rien.
- Si une information n'est pas visible : null, liste vide ou "inconnu".
- is_property_photo = false si l'image n'est pas une photo du bien (logo, plan, texte, capture d'écran…).
- equipments : éléments fixes du logement, en français, courts (ex. "cuisine équipée", "climatisation",
  "placards intégrés", "cheminée", "chauffe-eau", "double vitrage", "ascenseur", "piscine").
- materials : matériaux identifiables par surface (ex. sol "zellige", mur "tadelakt", sol "marbre",
  plan_de_travail "granit", menuiserie "aluminium").
- furniture : meubles mobiles visibles avec leur nombre (ex. "canapé" 1, "lit double" 1, "chaise" 4).
- condition et condition_signs : état apparent et indices concrets (fissure, trace d'humidité, peinture écaillée…).
- era : fourchette LARGE d'époque de construction ou de dernière rénovation, d'après le style et les
  matériaux, avec la justification. null si impossible à estimer.
- area_m2_min / area_m2_max : fourchette de surface de la pièce SEULEMENT si un repère de taille connue est
  visible (porte ≈ 2,04 m de haut, carreau standard, lit double ≈ 1,40 × 1,90 m, prise électrique…).
  Indique ce repère dans dimension_reference. Sinon null.
- Ne décris jamais les personnes présentes sur la photo.
- caption : une phrase factuelle en français.
- confidence : ta confiance globale entre 0 et 1."""
