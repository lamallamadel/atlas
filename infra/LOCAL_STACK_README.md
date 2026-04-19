# Local Development Stack with H2 & llama.cpp

Lightweight local development environment with H2 database and local LLM inference.

## 🚀 Quick Start

### 1. Download a Model (First Time Only)

Choose a model size based on your hardware:

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

### 2. Start the Stack

```bash
cd infra

# Start with llama.cpp (recommended)
docker compose -f docker-compose.local.yml --profile llama up

# OR use vLLM instead (faster but more RAM)
# docker compose -f docker-compose.local.yml --profile vllm up
```

### 3. Access Services

| Service | URL | Notes |
|---------|-----|-------|
| **Backend API** | http://localhost:8080 | Spring Boot app |
| **Frontend** | http://localhost | Nginx serving dist/ |
| **H2 Console** | http://localhost:8083 | Database web UI |
| **Redis** | localhost:6379 | Cache service |
| **llama.cpp** | http://localhost:8008 | Local LLM API |

## 🔧 Configuration

### Backend Environment Variables

Edit `docker-compose.local.yml` to customize:

```yaml
environment:
  # Database (H2)
  SPRING_DATASOURCE_URL: jdbc:h2:tcp://h2:9092/~/atlas
  
  # LLM endpoints
  BRAIN_SCORING_URL: http://llama-cpp:8000
  BRAIN_DUPLI_URL: http://llama-cpp:8000
  
  # Redis
  REDIS_HOST: redis
```

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
Just switch back to production compose and change:
```yaml
backend:
  depends_on:
    postgres:
      condition: service_healthy
  environment:
    SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/atlas
```

## 🎯 LLM API Examples

### llama.cpp Completion API

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

### Backend → llama.cpp
Backend services call LLM at `http://llama-cpp:8000` for:
- Lead scoring
- Duplicate detection
- Fraud detection

## 🔍 Troubleshooting

### Model stuck at "Downloading"
Check available disk space (requires 4-5GB minimum).

### Backend can't reach llama-cpp
Ensure `--profile llama` is used:
```bash
docker compose -f docker-compose.local.yml --profile llama up
```

### Out of memory
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
- **vLLM:** https://github.com/vllm-project/vllm
- **Models (HuggingFace):** https://huggingface.co/TheBloke
- **H2 Database:** https://www.h2database.com/

## 💡 Tips

- Use **TinyLlama** for rapid iteration, **Mistral** for production-like quality
- Increase `-t` (threads) for better CPU utilization
- Use **vLLM** for batch processing and OpenAI-compatible API
- Monitor resource usage: `docker stats`
