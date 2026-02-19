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
- fraud-service    : 8002 🔜 à faire
- match-service    : 8003 🔜 à faire
- proposal-service : 8004 🔜 à faire
- nego-service     : 8005 🔜 à faire

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

## Prochain service à créer : fraud-service :8002
Détection :
- Prix anormalement bas par rapport au marché
- Vendeur avec historique suspect
- Incohérence surface/prix/localisation
```

---

Maintenant dans Claude Code tu dis juste :
```
Lis AGENT_CONTEXT.md et crée le fraud-service 
en suivant exactement le même pattern que scoring-service