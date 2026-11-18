"""Configuration unique du brain.

Tous les modules lisent leurs réglages ici. Les valeurs viennent des variables
d'environnement (Docker Compose) ou d'un fichier `.env` dans le dossier courant.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Sécurité : obligatoire, le service refuse de démarrer sans API_KEY.
    api_key: str
    allowed_origins: list[str] = ["http://localhost:8080", "http://localhost:4200"]

    # LLM local (Ollama)
    ollama_enabled: bool = False
    ollama_url: str = "http://ollama:11434"
    ollama_model: str = "mistral:7b"

    # LLM distant (OpenAI)
    openai_enabled: bool = False
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Détection de doublons (similarité cosinus des embeddings)
    seuil_doublon: float = 0.85
    dupli_model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"


settings = Settings()
