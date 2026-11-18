"""Module vision : lecture des photos d'une annonce (sans jamais les modifier).

  POST /api/vision/analyze  -> analyse structurée d'UNE photo
  POST /api/vision/profile  -> profil agrégé de l'annonce + incohérences + description proposée
"""

import base64
import binascii
import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator

from config import settings
from security import verify_api_key
from vision.aggregate import build_facts, build_profile, find_inconsistencies, template_description
from vision.providers import (
    VisionUnavailable,
    VisionUnsupportedInput,
    analyze_photo,
    engines_enabled,
    generate_description,
)
from vision.schemas import PhotoAnalysis

logger = logging.getLogger("vision")
router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


class AnalyzeRequest(BaseModel):
    image_url: str | None = Field(default=None, max_length=2000)
    image_base64: str | None = None
    content_type: str = "image/jpeg"
    context: dict | None = None

    @model_validator(mode="after")
    def _one_source(self):
        if (self.image_url is None) == (self.image_base64 is None):
            raise ValueError("Fournir exactement une source : image_url ou image_base64.")
        if self.image_url is not None and not self.image_url.startswith("https://"):
            raise ValueError("image_url doit être une adresse https://.")
        if self.content_type not in ALLOWED_CONTENT_TYPES:
            raise ValueError(f"Type d'image non pris en charge : {self.content_type}.")
        if self.image_base64 is not None:
            try:
                size = len(base64.b64decode(self.image_base64, validate=True))
            except (binascii.Error, ValueError):
                raise ValueError("image_base64 n'est pas du base64 valide.")
            if size > settings.vision_max_image_bytes:
                raise ValueError("Image trop volumineuse.")
        return self


class AnalyzeResponse(BaseModel):
    analysis: PhotoAnalysis
    engine: str


class Declared(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    type: str | None = None
    city: str | None = None
    surface: float | None = None
    price: float | None = None
    currency: str | None = None


class ProfileRequest(BaseModel):
    analyses: list[PhotoAnalysis] = Field(max_length=200)
    declared: Declared = Declared()
    languages: list[Literal["fr", "ar", "en"]] = ["fr"]


class ProfileResponse(BaseModel):
    profile: dict
    inconsistencies: list[str]
    descriptions: dict[str, str]
    description_engine: str


@router.get("/api/vision/status")
def vision_status(api_key: str = Depends(verify_api_key)):
    return {"engines": engines_enabled()}


@router.post("/api/vision/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest, api_key: str = Depends(verify_api_key)):
    try:
        analysis, engine = await analyze_photo(req.image_url, req.image_base64, req.content_type, req.context)
    except VisionUnsupportedInput as e:
        raise HTTPException(status_code=422, detail=str(e))
    except VisionUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))
    return AnalyzeResponse(analysis=analysis, engine=engine)


@router.post("/api/vision/profile", response_model=ProfileResponse)
async def profile(req: ProfileRequest, api_key: str = Depends(verify_api_key)):
    declared = req.declared.model_dump()
    prof = build_profile(req.analyses)
    issues = find_inconsistencies(prof, declared)
    facts = build_facts(prof, declared)

    descriptions: dict[str, str] = {}
    engine = "template"
    for lang in req.languages:
        generated = await generate_description(facts, lang)
        if generated:
            descriptions[lang], engine = generated
        elif lang == "fr":
            descriptions["fr"] = template_description(prof, declared)
    return ProfileResponse(
        profile=prof, inconsistencies=issues, descriptions=descriptions, description_engine=engine
    )
