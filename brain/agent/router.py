from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import logging
import time
import httpx
import json

# 1. CORRECTION SÉCURITÉ : Pas de valeur par défaut pour api_key
class Settings(BaseSettings):
    api_key: str  # FastAPI plantera au démarrage si ce n'est pas défini dans le .env
    allowed_origins: list[str] = ["http://localhost:8080", "http://localhost:4200"]
    
    ollama_url: str = "http://ollama:11434"
    ollama_model: str = "mistral:7b"
    ollama_enabled: bool = False
    
    openai_api_key: str = ""
    openai_enabled: bool = False
    openai_model: str = "gpt-4o-mini"
    
    class Config:
        env_file = "../.env"

settings = Settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent-service")

router = APIRouter()

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

# 2. OPTIMISATION PERFORMANCES : Client HTTP global pour éviter l'épuisement des sockets
http_client = httpx.AsyncClient(timeout=10.0)

def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != settings.api_key:
        logger.warning("Tentative d'accès avec une clé invalide")
        raise HTTPException(status_code=403, detail="API Key invalide")
    return api_key

class AgentRequest(BaseModel):
    query: str
    conversation_id: str | None = None
    context: str | None = None

class AgentResponse(BaseModel):
    intent_type: str
    confidence: float
    params: dict
    answer: str
    actions: list[dict]
    engine: str

def parse_with_rules(query: str) -> AgentResponse:
    """Fallback offline ultra-basique calqué sur l'AiAgentService Angular"""
    query_lower = query.lower()
    
    if "cherche" in query_lower or "trouve" in query_lower:
        params = {}
        if "casablanca" in query_lower: params["city"] = "Casablanca"
        if "t3" in query_lower: params["propertyType"] = "T3"
        return AgentResponse(
            intent_type="SEARCH", confidence=0.85, params=params,
            answer="D'accord, je lance la recherche.",
            actions=[], engine="rules"
        )
    
    if "rendez-vous" in query_lower or "rdv" in query_lower or "visiter" in query_lower:
        return AgentResponse(
            intent_type="SCHEDULE_APPOINTMENT", confidence=0.9, params={},
            answer="Parfait, je vais m'occuper d'organiser cette visite. Êtes-vous disponible la semaine prochaine ?",
            actions=[{"type": "CREATE_APPOINTMENT", "params": {"status": "REQUESTED"}}], 
            engine="rules"
        )
    
    return AgentResponse(
        intent_type="UNKNOWN", confidence=0.0, params={},
        answer="Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ?",
        actions=[], engine="rules"
    )

async def process_with_ollama(query: str, context: str | None = None) -> AgentResponse:
    context_instruction = f"\n\nCONTEXTE IMMOBILIER (RAG):\n{context}\nUtilise ce contexte pour répondre à la question si c'est pertinent." if context else ""
    prompt = f"""Tu es Atlas IA, un agent immobilier.
Analyse cette requête utilisateur : "{query}"{context_instruction}
Réponds UNIQUEMENT avec ce JSON valide:
{{"intent_type": "SEARCH|CREATE|STATUS_CHANGE|SEND_MESSAGE|NAVIGATE|SCHEDULE_APPOINTMENT|UNKNOWN", "confidence": 0.9, "params": {{"city": "...", "propertyType": "..."}}, "answer": "Ta réponse textuelle à l'utilisateur", "actions": []}}
"""
    try:
        # Utilisation du client HTTP global
        resp = await http_client.post(
            f"{settings.ollama_url}/api/generate",
            json={
                "model": settings.ollama_model,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }
        )
        resp.raise_for_status()
        data = resp.json()
        
        # 3. CORRECTION FIABILITÉ : Gestion robuste du parsing JSON d'Ollama
        try:
            parsed = json.loads(data["response"])
        except json.JSONDecodeError as je:
            logger.error(f"Ollama a généré un JSON invalide : {je} - Contenu: {data['response']}")
            raise ValueError("Invalid JSON from Ollama")

        return AgentResponse(
            intent_type=parsed.get("intent_type", "UNKNOWN"),
            confidence=parsed.get("confidence", 0.5),
            params=parsed.get("params", {}),
            answer=parsed.get("answer", "Voici ma réponse."),
            actions=parsed.get("actions", []),
            engine="ollama"
        )
    except Exception as e:
        logger.error(f"Erreur Ollama: {e}")
        # 4a. CORRECTION ROUTAGE : On lève l'erreur pour laisser le routeur gérer le fallback
        raise e 

async def process_with_openai(query: str, context: str | None = None) -> AgentResponse:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    context_instruction = f"\n\nCONTEXTE IMMOBILIER (RAG):\n{context}\nUtilise ce contexte pour répondre à la question." if context else ""
    
    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "Tu es Atlas IA, un agent immobilier expert travaillant pour l'Agence. Tu es poli, proactif et tu connais l'immobilier marocain."},
                {"role": "user", "content": f"Analyse cette requête utilisateur : \"{query}\"{context_instruction}"}
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "agent_action",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "intent_type": {
                                "type": "string",
                                "enum": ["SEARCH", "CREATE", "STATUS_CHANGE", "SEND_MESSAGE", "NAVIGATE", "SCHEDULE_APPOINTMENT", "UNKNOWN"]
                            },
                            "confidence": {"type": "number"},
                            "params": {
                                "type": "object",
                                "additionalProperties": {"type": "string"}
                            },
                            "answer": {"type": "string"},
                            "actions": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {"type": "string"},
                                        "params": {
                                            "type": "object",
                                            "additionalProperties": {"type": "string"}
                                        }
                                    },
                                    "required": ["type", "params"],
                                    "additionalProperties": False
                                }
                            }
                        },
                        "required": ["intent_type", "confidence", "params", "answer", "actions"],
                        "additionalProperties": False
                    }
                }
            },
            temperature=0.0
        )
        
        data = json.loads(response.choices[0].message.content)
        
        return AgentResponse(
            intent_type=data.get("intent_type", "UNKNOWN"),
            confidence=data.get("confidence", 0.5),
            params=data.get("params", {}),
            answer=data.get("answer", "Voici ma réponse."),
            actions=data.get("actions", []),
            engine="openai"
        )
    except Exception as e:
        logger.error(f"Erreur OpenAI: {e}")
        # 4b. CORRECTION ROUTAGE : On lève l'erreur pour laisser le routeur décider
        raise e

@router.post("/api/agent/process", response_model=AgentResponse)
async def process(req: AgentRequest, _: str = Depends(verify_api_key)):
    start = time.time()
    
    # 4c. CORRECTION LOGIQUE : Implémentation du "Waterfall" de fallback
    
    # Étape 1 : On teste les règles locales, ultra-rapide et déterministe
    rule_result = parse_with_rules(req.query)
    if rule_result.confidence >= 0.8:
        logger.info(f"Agent [{req.query[:20]}...] → {rule_result.intent_type} ({round((time.time()-start)*1000)}ms) via {rule_result.engine}")
        return rule_result

    # Étape 2 : OpenAI (Si activé et configuré)
    if settings.openai_enabled and settings.openai_api_key:
        try:
            result = await process_with_openai(req.query, req.context)
            logger.info(f"Agent [{req.query[:20]}...] → {result.intent_type} ({round((time.time()-start)*1000)}ms) via {result.engine}")
            return result
        except Exception:
            logger.warning("OpenAI a échoué. Tentative de Fallback vers Ollama ou Rules...")
            pass # Si OpenAI échoue, on glisse à l'étape suivante

    # Étape 3 : Ollama (Backup local gratuit)
    if settings.ollama_enabled:
        try:
            result = await process_with_ollama(req.query, req.context)
            logger.info(f"Agent [{req.query[:20]}...] → {result.intent_type} ({round((time.time()-start)*1000)}ms) via {result.engine}")
            return result
        except Exception:
            logger.warning("Ollama a échoué. Fallback final vers les Rules.")
            pass # Si Ollama échoue, on glisse à l'étape suivante

    # Étape 4 : Fallback final si tout échoue ou n'est pas confiant
    logger.info(f"Agent [{req.query[:20]}...] → {rule_result.intent_type} ({round((time.time()-start)*1000)}ms) via {rule_result.engine} (Fallback ultime)")
    return rule_result