"""Authentification par clé API, partagée par tous les routers."""

import logging
import secrets

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

from config import settings

logger = logging.getLogger("brain.security")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)


def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    # compare_digest : comparaison en temps constant (pas de fuite par timing)
    if not secrets.compare_digest(api_key, settings.api_key):
        logger.warning("Tentative d'accès avec une clé invalide")
        raise HTTPException(status_code=403, detail="API Key invalide")
    return api_key
