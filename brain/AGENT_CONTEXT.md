# Brain — Atlasia AI Services (Unified Monolith)

## Architecture

Le brain est un **monolithe FastAPI unifié** qui regroupe tous les services AI sous un seul process et un seul port.

### Structure
```
brain/
├── main.py              # Point d'entrée FastAPI — inclut tous les routers
├── Dockerfile           # Image unique pour le monolith
├── requirements.txt     # Dépendances globales
├── agent/               # Agent IA conversationnel (routage NLP)
│   └── router.py
├── document/            # Extraction et analyse de documents
│   └── router.py
├── dupli/               # Détection de doublons (TF-IDF cosine similarity)
│   └── router.py
├── fraud/               # Détection de fraude
│   └── router.py
├── match/               # Matching annonces/dossiers
│   └── router.py
├── nego/                # Aide à la négociation
│   └── router.py
├── proposal/            # Génération de propositions
│   └── router.py
├── scoring/             # Scoring de leads (prix/m², étage, surface, etc.)
│   └── router.py
└── training/            # Données et scripts d'entraînement
```

### Port unique
- **Port 8000** — Tous les endpoints sont exposés sur ce port unique
- Health check : `GET /health`

### Docker
```yaml
# docker-compose.yml (production) ou docker-compose.local.yml
brain:
  build:
    context: ../brain
    dockerfile: Dockerfile
  ports:
    - "8000:8000"
  environment:
    API_KEY: ${BRAIN_API_KEY:-change-me-in-production}
```

### Intégration Spring Boot
- Le backend Spring Boot contacte le brain via des URLs unifiées :
  - `BRAIN_SCORING_URL=http://brain:8000`
  - `BRAIN_DUPLI_URL=http://brain:8000`
  - `BRAIN_FRAUD_URL=http://brain:8000`
  - `BRAIN_MATCH_URL=http://brain:8000`
  - `BRAIN_PROPOSAL_URL=http://brain:8000`
  - `BRAIN_NEGO_URL=http://brain:8000`
  - `BRAIN_AGENT_URL=http://brain:8000`
  - `BRAIN_DOCUMENT_URL=http://brain:8000`
- WebClient avec header `X-API-Key`
- Retry x2, timeout 5s
- Fallback si service down

### Endpoints par module
| Module | Endpoint pattern | Description |
|--------|-----------------|-------------|
| Scoring | `/api/scoring/*` | Score 0-100 basé sur prix/m², étage, surface |
| Dupli | `/api/dupli/*` | Détection doublons (cosine similarity, seuil 0.30) |
| Fraud | `/api/fraud/*` | Détection de fraude |
| Match | `/api/match/*` | Matching annonces/dossiers |
| Proposal | `/api/proposal/*` | Génération d'emails et propositions |
| Nego | `/api/nego/*` | Aide à la négociation |
| Agent | `/api/agent/*` | Routage NLP, intégration Ollama |
| Document | `/api/document/*` | Extraction et analyse de documents |

## Prochaines étapes (Evolution)
- Affiner les prompts LLM dans le module agent
- Entraîner des modèles spécifiques pour le matching (au lieu du random actuel)
- Intégrer un vrai LLM pour la génération de propositions (emails)