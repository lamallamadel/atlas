# Brain — Atlasia AI Services

## Pattern standard pour chaque service

Chaque service dans brain/ suit exactement ce pattern :

### Structure
```
brain/nom-service/
├── main.py
├── Dockerfile
├── requirements.txt
└── tests/
    └── test_nom.py
```

### main.py — Template
- FastAPI + pydantic-settings
- API Key via header X-API-Key
- Endpoint /health
- Endpoint /api/nom-service/action
- Logging sur chaque requête
- Validation des inputs via Pydantic

### Dockerfile — Template
- FROM python:3.11-slim
- EXPOSE sur port assigné

### Ports assignés
- scoring-service  : 8000 ✅ fait
- dupli-service    : 8001 ✅ fait
- fraud-service    : 8002 ✅ fait
- match-service    : 8003 ✅ fait
- proposal-service : 8004 ✅ fait
- nego-service     : 8005 ✅ fait
- agent-service    : 8006 ✅ fait (Agent IA Conversationnel + Ollama)

### Intégration Spring Boot
- WebClient avec X-API-Key header
- Retry x2, timeout 5s
- Fallback si service down
- DTO : NomRequest.java / NomResponse.java

### docker-compose
Chaque service ajouté dans infra/docker-compose.yml
avec son port, API_KEY depuis .env, et atlas-network

## Algorithmes prototypés dans garage
- scoring : prix/m², étage, surface, proximité mer → score 0-100
- dupli : TF-IDF cosine similarity, seuil 0.30

## Statut actuel
Tous les services de la roadmap initiale ont été implémentés (scoring, dupli, fraud, match, proposal, nego).
Un nouveau service `agent-service` a été ajouté pour gérer le routage NLP et l'intégration Ollama.

## Prochaines étapes (Evolution)
- Affiner les prompts LLM dans `agent-service`
- Entraîner des modèles spécifiques pour le `match-service` (au lieu du random actuel)
- Intégrer un vrai LLM pour le `proposal-service` (génération d'emails)