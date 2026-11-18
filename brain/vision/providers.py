"""Appels aux modèles de vision et de texte (OpenAI ou Ollama).

Ordre : OpenAI s'il est activé, sinon Ollama. Aucun repli « inventé » : si aucun
moteur n'est disponible, l'appelant reçoit VisionUnavailable.
"""

import json
import logging

import httpx

from config import settings
from vision.schemas import ANALYSIS_PROMPT, PHOTO_ANALYSIS_JSON_SCHEMA, PhotoAnalysis

logger = logging.getLogger("vision.providers")


class VisionUnavailable(Exception):
    """Aucun moteur de vision n'est activé ou joignable."""


class VisionUnsupportedInput(Exception):
    """Le moteur actif ne sait pas traiter cette entrée (ex. URL avec Ollama)."""


def engines_enabled() -> list[str]:
    engines = []
    if settings.openai_enabled and settings.openai_api_key:
        engines.append("openai")
    if settings.ollama_enabled:
        engines.append("ollama")
    return engines


def _context_text(context: dict | None) -> str:
    if not context:
        return ""
    parts = [f"{k} : {v}" for k, v in context.items() if v not in (None, "")]
    return "\n\nContexte déclaré par l'agent (à ne pas recopier si non visible) :\n" + "\n".join(parts)


async def _analyze_openai(image_url: str | None, image_b64: str | None, content_type: str, context: dict | None) -> PhotoAnalysis:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=settings.vision_timeout_seconds)
    url = image_url or f"data:{content_type};base64,{image_b64}"
    resp = await client.chat.completions.create(
        model=settings.openai_vision_model or settings.openai_model,
        temperature=0,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": ANALYSIS_PROMPT + _context_text(context)},
                    {"type": "image_url", "image_url": {"url": url, "detail": "high"}},
                ],
            }
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {"name": "photo_analysis", "strict": True, "schema": PHOTO_ANALYSIS_JSON_SCHEMA},
        },
    )
    return PhotoAnalysis.model_validate_json(resp.choices[0].message.content)


async def _analyze_ollama(image_url: str | None, image_b64: str | None, context: dict | None) -> PhotoAnalysis:
    if image_b64 is None:
        # Le brain ne télécharge pas d'URL lui-même (pas de requête vers des adresses arbitraires).
        raise VisionUnsupportedInput("Ollama a besoin de l'image elle-même : importez la photo dans Atlas.")
    async with httpx.AsyncClient(timeout=settings.vision_timeout_seconds) as client:
        r = await client.post(
            f"{settings.ollama_url}/api/chat",
            json={
                "model": settings.ollama_vision_model,
                "stream": False,
                "format": PHOTO_ANALYSIS_JSON_SCHEMA,
                "options": {"temperature": 0},
                "messages": [
                    {"role": "user", "content": ANALYSIS_PROMPT + _context_text(context), "images": [image_b64]}
                ],
            },
        )
        r.raise_for_status()
        return PhotoAnalysis.model_validate_json(r.json()["message"]["content"])


async def analyze_photo(
    image_url: str | None, image_b64: str | None, content_type: str, context: dict | None
) -> tuple[PhotoAnalysis, str]:
    """Analyse une photo. Renvoie (analyse, moteur utilisé)."""
    engines = engines_enabled()
    if not engines:
        raise VisionUnavailable("Aucun moteur de vision activé (OPENAI_ENABLED ou OLLAMA_ENABLED).")

    last_error: Exception | None = None
    for engine in engines:
        try:
            if engine == "openai":
                return await _analyze_openai(image_url, image_b64, content_type, context), engine
            return await _analyze_ollama(image_url, image_b64, context), engine
        except VisionUnsupportedInput:
            raise
        except Exception as e:  # on tente le moteur suivant
            logger.warning("Analyse %s échouée : %s", engine, e)
            last_error = e
    raise VisionUnavailable(f"Tous les moteurs de vision ont échoué : {last_error}")


DESCRIPTION_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["description"],
    "properties": {"description": {"type": "string"}},
}

LANG_NAMES = {"fr": "français", "ar": "arabe", "en": "anglais"}


def description_prompt(facts: dict, lang: str) -> str:
    return (
        f"Rédige la description d'une annonce immobilière en {LANG_NAMES.get(lang, lang)}, "
        "en 120 à 200 mots, ton professionnel et sobre.\n"
        "Utilise UNIQUEMENT les faits ci-dessous (déclarés par l'agent ou observés sur les photos). "
        "N'invente aucune caractéristique, aucune distance, aucun chiffre absent. "
        "Les surfaces estimées par l'analyse photo ne sont pas des mesures : ne les cite pas. "
        "Pas d'emoji, pas de superlatifs excessifs.\n\n"
        f"Faits :\n{json.dumps(facts, ensure_ascii=False, indent=2)}"
    )


async def generate_description(facts: dict, lang: str) -> tuple[str, str] | None:
    """Renvoie (texte, moteur) ou None si aucun moteur n'est disponible."""
    prompt = description_prompt(facts, lang)
    for engine in engines_enabled():
        try:
            if engine == "openai":
                from openai import AsyncOpenAI

                client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=settings.vision_timeout_seconds)
                resp = await client.chat.completions.create(
                    model=settings.openai_model,
                    temperature=0.3,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={
                        "type": "json_schema",
                        "json_schema": {"name": "listing_description", "strict": True, "schema": DESCRIPTION_SCHEMA},
                    },
                )
                return json.loads(resp.choices[0].message.content)["description"].strip(), engine
            async with httpx.AsyncClient(timeout=settings.vision_timeout_seconds) as client:
                r = await client.post(
                    f"{settings.ollama_url}/api/chat",
                    json={
                        "model": settings.ollama_model,
                        "stream": False,
                        "format": DESCRIPTION_SCHEMA,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                r.raise_for_status()
                return json.loads(r.json()["message"]["content"])["description"].strip(), engine
        except Exception as e:
            logger.warning("Génération de description %s échouée : %s", engine, e)
    return None
