# Local Development Stack with H2 & llama.cpp

Lightweight local development environment with H2 database, unified Brain AI, and optional local LLM inference.

## 🚀 Quick Start

### 1. Start the Stack

```bash
cd infra

# Start the local stack (H2 + Brain + Backend + Frontend)
docker compose -f docker-compose.local.yml up

# With local LLM (optional)
docker compose -f docker-compose.local.yml --profile llama up
```

### 2. Access Services

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | http://localhost | Via Nginx reverse proxy |
| **Frontend Dev** | http://localhost:4200 | Direct Angular dev server |
| **Backend API** | http://localhost:8080 | Spring Boot app |
| **H2 Console** | http://localhost:8083 | Database web UI |
| **Brain AI** | http://localhost:8000 | Unified FastAPI monolith |
| **llama.cpp** | http://localhost:8008 | Local LLM API (optional) |

### 3. (Optional) Download a Model for llama.cpp

Only needed if you use `--profile llama`. Choose a model size based on your hardware:

**Option A: TinyLlama (Recommended for most laptops)**
```bash
# macOS / Linux
./download-model.sh tinyllama

# Windows
.\download-model.ps1 -ModelName tinyllama
```

**Other options:**
```bash
# Phi 2.7B - faster than Mistral
./download-model.sh phi

# Mistral 7B - better quality
./download-model.sh mistral

# Llama 2 7B - solid all-rounder
./download-model.sh llama2
```

Models are downloaded to `infra/models/model.gguf` (~600MB to 4GB).

## 🔧 Configuration

### Backend Environment Variables

Edit `docker-compose.local.yml` to customize:

```yaml
environment:
  # Database (H2)
  SPRING_DATASOURCE_URL: jdbc:h2:tcp://h2:9092/atlas;MODE=PostgreSQL

  # Brain AI (unified, all services on same host)
  BRAIN_SCORING_URL: http://brain:8000
  BRAIN_DUPLI_URL: http://brain:8000
  BRAIN_FRAUD_URL: http://brain:8000

  # Redis
  REDIS_HOST: redis
```

### Brain AI Service

The brain is a **unified FastAPI monolith** running all AI services on port 8000:

- Scoring (`/api/scoring/*`)
- Duplicate detection (`/api/dupli/*`)
- Fraud detection (`/api/fraud/*`)
- Matching (`/api/match/*`)
- Proposals (`/api/proposal/*`)
- Negotiation (`/api/nego/*`)
- Agent NLP (`/api/agent/*`)
- Document analysis (`/api/document/*`)

Health check: `GET http://localhost:8000/health`

### LLM Configuration

Adjust llama.cpp performance in `docker-compose.local.yml`:

```yaml
command: >
  -m /models/model.gguf
  --host 0.0.0.0
  --port 8000
  -n 256              # Max tokens in response
  --ctx-size 1024     # Context window
  -t 4                # CPU threads
  -ngl 0              # GPU layers (0=CPU only, 33+=GPU)
  -b 512              # Batch size
```

**GPU Support (NVIDIA):**
```yaml
# Uncomment in docker-compose.local.yml:
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

Then increase `-ngl` value (e.g., `-ngl 33`).

## 📊 Model Comparison

| Model | Size | Speed | Quality | VRAM |
|-------|------|-------|---------|------|
| TinyLlama 1.1B | 600MB | ⚡⚡⚡ | ⭐⭐ | 512MB |
| Phi 2.7B | 1.5GB | ⚡⚡ | ⭐⭐⭐ | 1GB |
| Mistral 7B | 4GB | ⚡ | ⭐⭐⭐⭐ | 2-3GB |
| Llama 2 7B | 4GB | ⚡ | ⭐⭐⭐⭐ | 2-3GB |

## 📝 H2 Database

### Features
- **In-memory** for blazing fast tests
- **Persistent** to `h2_data/` volume if needed
- **PostgreSQL mode** for compatibility
- **Web console** at http://localhost:8083

### Web Console Login
- **JDBC URL:** `jdbc:h2:tcp://h2:9092/atlas`
- **User:** `sa`
- **Password:** (leave empty)

### Convert to PostgreSQL Later
Just switch to the production compose (`docker-compose.yml`) which uses PostgreSQL by default.

## 🎯 API Examples

### Brain Health Check
```bash
curl http://localhost:8000/health
```

### Brain Scoring API
```bash
curl http://localhost:8000/api/scoring/score \
  -H "Content-Type: application/json" \
  -H "X-API-Key: local-dev" \
  -d '{"prix": 250000, "surface": 65, "etage": 3}'
```

### llama.cpp Completion API (optional, with --profile llama)
```bash
curl http://localhost:8008/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "prompt": "What is real estate?",
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

## 🔍 Troubleshooting

### Brain service takes long to start
The brain service downloads ML models on first start (~2-3 min). Subsequent starts use the Docker layer cache.

### Backend can't reach brain
Check that the brain service is healthy:
```bash
docker compose -f docker-compose.local.yml ps brain
docker logs brain_app
```

### Model stuck at "Downloading" (llama.cpp)
Check available disk space (requires 4-5GB minimum).

### Backend can't reach llama-cpp
Ensure `--profile llama` is used:
```bash
docker compose -f docker-compose.local.yml --profile llama up
```

### Out of memory (llama.cpp)
Reduce model size or lower context:
```yaml
-n 128           # Fewer tokens
--ctx-size 512   # Smaller context
-b 128           # Smaller batch
```

### H2 not connecting
Verify port 9092 is free and H2 is healthy:
```bash
docker compose -f docker-compose.local.yml ps h2
docker logs h2_db
```

## 🛑 Stop & Cleanup

```bash
# Stop services
docker compose -f docker-compose.local.yml down

# Remove volumes (wipe data)
docker compose -f docker-compose.local.yml down -v

# Remove images
docker compose -f docker-compose.local.yml down --rmi all
```

## 📚 References

- **llama.cpp:** https://github.com/ggerganov/llama.cpp
- **Models (HuggingFace):** https://huggingface.co/TheBloke
- **H2 Database:** https://www.h2database.com/
- **FastAPI:** https://fastapi.tiangolo.com/

## 💡 Tips

- The brain service includes all AI capabilities — no need to start individual services
- Use **TinyLlama** for rapid iteration, **Mistral** for production-like quality
- Increase `-t` (threads) for better CPU utilization on llama.cpp
- Monitor resource usage: `docker stats`
