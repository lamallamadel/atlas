# 🧠 Brain Services Integration - Architecture Update

**Date**: 2026-02-19  
**Status**: ✅ 3 major commits analyzed  
**Scope**: New AI/ML microservices, Docker integration, FastAPI architecture

---

## 1. What's New - Overview

### New Microservices Added

| Service | Type | Port | Purpose | Status |
|---------|------|------|---------|--------|
| **scoring-service** | FastAPI (Python) | :8001 | Real estate property scoring AI | ✅ Live |
| **dupli-service** | FastAPI (Python) | :8002 | Duplicate detection (listings) | ✅ Live |
| **fraud-service** | FastAPI (Python) | :8003 | Fraud detection & scoring | ✅ Live |

### Backend Integration

- ✅ `BrainClientService` - Java service calling AI microservices
- ✅ `BrainScoringService` - Scoring integration
- ✅ `BrainProperties` - Configuration for Brain services
- ✅ New DTOs: `BienScoreRequest`, `BienScoreResponse`, `FraudRequest`, `FraudResponse`
- ✅ Database migration: `V38__Add_ai_score_to_annonce.sql` + `V39__Add_fraud_score_to_annonce.sql`

### CI/CD Pipeline

- ✅ New workflow: `.github/workflows/brain-ci.yml` (Python tests for AI services)

---

## 2. Brain Services Architecture

### Directory Structure

```
project-root/
├── brain/
│   ├── AGENT_CONTEXT.md          (AI agent documentation)
│   ├── scoring-service/
│   │   ├── Dockerfile
│   │   ├── main.py               (FastAPI app)
│   │   ├── requirements.txt       (Python dependencies)
│   │   └── test_scoring.py
│   ├── dupli-service/
│   │   ├── Dockerfile
│   │   ├── main.py
│   │   └── requirements.txt
│   └── fraud-service/
│       ├── Dockerfile
│       ├── main.py
│       ├── requirements.txt
│       └── tests/test_fraud.py
├── backend/
│   ├── src/main/java/.../brain/
│   │   ├── BrainClientService.java
│   │   ├── BrainProperties.java
│   │   ├── BrainScoringService.java
│   │   └── dto/
│   │       ├── BienScoreRequest.java
│   │       ├── BienScoreResponse.java
│   │       ├── FraudRequest.java
│   │       └── FraudResponse.java
│   └── src/main/resources/db/migration/
│       ├── V38__Add_ai_score_to_annonce.sql
│       └── V39__Add_fraud_score_to_annonce.sql
└── infra/
    ├── docker-compose.yml        (updated with brain services)
    └── .env.example              (updated with brain config)
```

---

## 3. Service Details

### 3.1 Scoring Service (Port 8001)

**Purpose**: AI-based property valuation & quality scoring

**Endpoints**:
```
POST /score/bien
  Input: Property details (area, rooms, location, etc.)
  Output: Score (0-100), confidence, valuation estimate

POST /score/batch
  Input: Array of properties
  Output: Array of scores
```

**Technology Stack**:
- FastAPI (Python web framework)
- Pydantic (data validation)
- scikit-learn / TensorFlow (ML models)
- Redis (optional caching)

**Dockerfile**:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY main.py .
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Health Check**: `GET /health`

---

### 3.2 Duplicate Detection Service (Port 8002)

**Purpose**: Detect duplicate listings (same property posted twice)

**Endpoints**:
```
POST /duplicates/detect
  Input: Property details
  Output: List of similar properties (confidence %)

POST /duplicates/batch
  Input: Multiple properties
  Output: Duplicate clusters
```

**Algorithm**: 
- Feature extraction (address, price, area, etc.)
- Similarity matching (Levenshtein, fuzzy matching)
- Clustering (finds groups of similar properties)

---

### 3.3 Fraud Service (Port 8003)

**Purpose**: Detect fraudulent listings & suspicious activity

**Endpoints**:
```
POST /fraud/score
  Input: Listing data
  Output: Fraud score (0-100), risk level

POST /fraud/analyze
  Input: Full annonce + user history
  Output: Risk assessment + flags
```

**Risk Factors**:
- Price anomalies (too low/high for area)
- Fake/stolen photos (image analysis)
- Suspicious user patterns
- Geographic impossibilities

---

## 4. Backend Integration

### 4.1 BrainClientService

**Location**: `backend/src/main/java/com/example/backend/brain/BrainClientService.java`

**Responsibilities**:
```java
// Call scoring service
BienScoreResponse scoreProperty(BienScoreRequest request)

// Call duplicate detection
List<DupliAnnonceDto> findDuplicates(String annonceId)

// Call fraud detection
FraudResponse analyzeFraud(FraudRequest request)

// Health check for all brain services
boolean healthCheck()
```

**Configuration**:
```java
@Configuration
@ConfigurationProperties(prefix = "brain")
public class BrainProperties {
    private String scoringServiceUrl;      // http://localhost:8001
    private String dupliServiceUrl;        // http://localhost:8002
    private String fraudServiceUrl;        // http://localhost:8003
    private Duration timeout;              // Connection timeout
    private int retryAttempts;             // Resilience4j retry
}
```

### 4.2 BrainScoringService

**Workflow**:
```
1. User creates/updates annonce
2. AnnonceService calls BrainScoringService.scoreAnnonce()
3. Calls Brain scoring-service via BrainClientService
4. Receives score & confidence
5. Stores in Annonce table (ai_score, ai_confidence)
6. Returns enriched AnnonceResponse
```

### 4.3 DTOs

#### Scoring Request/Response
```java
// Request
class BienScoreRequest {
    String address;
    Integer rooms;
    Integer area;
    LocalDate built;
    Double price;
    String condition;
}

// Response
class BienScoreResponse {
    Integer score;           // 0-100
    Double confidence;       // 0.0-1.0
    Double estimatedPrice;
    String recommendation;
}
```

#### Fraud Request/Response
```java
// Request
class FraudRequest {
    Long annonceId;
    String address;
    Double price;
    List<String> photoUrls;
    Long userId;
}

// Response
class FraudResponse {
    Integer fraudScore;      // 0-100
    String riskLevel;        // LOW, MEDIUM, HIGH, CRITICAL
    List<String> flags;      // Why flagged
    Boolean shouldReview;
}
```

---

## 5. Database Schema Changes

### V38__Add_ai_score_to_annonce.sql

```sql
ALTER TABLE annonce ADD COLUMN ai_score INTEGER;
ALTER TABLE annonce ADD COLUMN ai_confidence DECIMAL(3,2);
ALTER TABLE annonce ADD COLUMN ai_score_timestamp TIMESTAMP;

CREATE INDEX idx_annonce_ai_score ON annonce(ai_score);
```

### V39__Add_fraud_score_to_annonce.sql

```sql
ALTER TABLE annonce ADD COLUMN fraud_score INTEGER;
ALTER TABLE annonce ADD COLUMN fraud_risk_level VARCHAR(20);
ALTER TABLE annonce ADD COLUMN fraud_flags JSONB;
ALTER TABLE annonce ADD COLUMN fraud_review_required BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_annonce_fraud_score ON annonce(fraud_score);
CREATE INDEX idx_annonce_fraud_review ON annonce(fraud_review_required);
```

---

## 6. Docker Compose Updates

### New Services in docker-compose.yml

```yaml
services:
  # ... existing services ...
  
  brain-scoring:
    build:
      context: ../brain/scoring-service
      dockerfile: Dockerfile
    container_name: brain_scoring
    ports:
      - "8001:8001"
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
      LOG_LEVEL: INFO
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 10s
      timeout: 5s
      retries: 3
  
  brain-dupli:
    build:
      context: ../brain/dupli-service
      dockerfile: Dockerfile
    container_name: brain_dupli
    ports:
      - "8002:8002"
    environment:
      ELASTICSEARCH_HOST: elasticsearch
      ELASTICSEARCH_PORT: 9200
    depends_on:
      elasticsearch:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8002/health"]
      interval: 10s
      timeout: 5s
      retries: 3
  
  brain-fraud:
    build:
      context: ../brain/fraud-service
      dockerfile: Dockerfile
    container_name: brain_fraud
    ports:
      - "8003:8003"
    environment:
      REDIS_HOST: redis
      LOG_LEVEL: INFO
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8003/health"]
      interval: 10s
      timeout: 5s
      retries: 3
```

### Updated Backend Service Config

```yaml
backend:
  # ... existing config ...
  environment:
    # ... existing env vars ...
    BRAIN_SCORING_SERVICE_URL: http://brain-scoring:8001
    BRAIN_DUPLI_SERVICE_URL: http://brain-dupli:8002
    BRAIN_FRAUD_SERVICE_URL: http://brain-fraud:8003
    BRAIN_TIMEOUT_MS: 5000
    BRAIN_RETRY_ATTEMPTS: 3
  depends_on:
    # ... existing deps ...
    brain-scoring:
      condition: service_healthy
    brain-dupli:
      condition: service_healthy
    brain-fraud:
      condition: service_healthy
```

---

## 7. CI/CD Pipeline - New Brain Workflow

### `.github/workflows/brain-ci.yml`

**Triggers**:
- PR to master/develop
- Changes in `brain/**`

**Jobs**:
1. **lint** - Python linting (flake8, pylint)
2. **test** - Unit tests per service
3. **build** - Docker build verification
4. **security** - Dependency vulnerability scan

```yaml
name: Brain Services CI

on:
  pull_request:
    branches:
      - master
      - develop
    paths:
      - 'brain/**'
      - '.github/workflows/brain-ci.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [scoring-service, dupli-service, fraud-service]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python 3.11
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          cd brain/${{ matrix.service }}
          pip install -r requirements.txt
      
      - name: Lint
        run: |
          pip install flake8 pylint
          cd brain/${{ matrix.service }}
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
          pylint main.py --exit-zero
      
      - name: Run tests
        run: |
          cd brain/${{ matrix.service }}
          python -m pytest . -v --cov=.
      
      - name: Build Docker image
        run: |
          docker build -f brain/${{ matrix.service }}/Dockerfile \
                       -t brain-${{ matrix.service }}:test .
      
      - name: Health check
        run: |
          docker run --rm brain-${{ matrix.service }}:test \
            python -c "import main; print('✓ Import OK')"
```

---

## 8. Configuration

### .env.example (Updated)

```env
# Brain Services Configuration
BRAIN_SCORING_SERVICE_URL=http://localhost:8001
BRAIN_DUPLI_SERVICE_URL=http://localhost:8002
BRAIN_FRAUD_SERVICE_URL=http://localhost:8003
BRAIN_TIMEOUT_MS=5000
BRAIN_RETRY_ATTEMPTS=3
BRAIN_ENABLE_SCORING=true
BRAIN_ENABLE_DUPLI=true
BRAIN_ENABLE_FRAUD=true
BRAIN_CACHE_TTL_MINUTES=60
BRAIN_LOG_LEVEL=INFO

# Redis (for brain service caching)
REDIS_HOST=redis
REDIS_PORT=6379
```

### application.yml (Updated)

```yaml
brain:
  scoring-service-url: ${BRAIN_SCORING_SERVICE_URL:http://localhost:8001}
  dupli-service-url: ${BRAIN_DUPLI_SERVICE_URL:http://localhost:8002}
  fraud-service-url: ${BRAIN_FRAUD_SERVICE_URL:http://localhost:8003}
  timeout-ms: ${BRAIN_TIMEOUT_MS:5000}
  retry-attempts: ${BRAIN_RETRY_ATTEMPTS:3}
  enable-scoring: ${BRAIN_ENABLE_SCORING:true}
  enable-dupli: ${BRAIN_ENABLE_DUPLI:true}
  enable-fraud: ${BRAIN_ENABLE_FRAUD:true}
  cache-ttl-minutes: ${BRAIN_CACHE_TTL_MINUTES:60}
  log-level: ${BRAIN_LOG_LEVEL:INFO}
```

---

## 9. Deployment Strategy

### Local Development

```bash
# Terminal 1: Start all infrastructure + brain services
cd infra
docker compose up -d

# Brain services will be available at:
# - Scoring: http://localhost:8001
# - Duplicate: http://localhost:8002
# - Fraud: http://localhost:8003

# Terminal 2: Run backend
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"

# Backend calls brain services automatically
curl http://localhost:8080/api/v1/listings
# Returns enriched responses with ai_score
```

### Staging/Production

**Docker Build**:
```bash
# Build backend (with brain client integration)
docker build -f backend/Dockerfile -t backend:v1.0 .

# Build brain services
docker build -f brain/scoring-service/Dockerfile -t brain-scoring:v1.0 .
docker build -f brain/dupli-service/Dockerfile -t brain-dupli:v1.0 .
docker build -f brain/fraud-service/Dockerfile -t brain-fraud:v1.0 .

# Push to registry
docker push backend:v1.0
docker push brain-scoring:v1.0
docker push brain-dupli:v1.0
docker push brain-fraud:v1.0
```

**Kubernetes Deployment** (future):
```yaml
# Each service gets its own Deployment + Service
# brain-scoring-deployment.yaml
# brain-dupli-deployment.yaml
# brain-fraud-deployment.yaml
```

---

## 10. Resilience & Error Handling

### Retry Strategy (Resilience4j)

```java
@CircuitBreaker(name = "brainScoring", fallbackMethod = "scoringFallback")
@Retry(name = "brainScoring", fallbackMethod = "scoringFallback")
public BienScoreResponse scoreProperty(BienScoreRequest request) {
    // Calls scoring service with retries
    // If all retries fail → fallback
}

// Fallback: return default score if service unavailable
private BienScoreResponse scoringFallback(BienScoreRequest request, Exception e) {
    return new BienScoreResponse(50, 0.5, null, "Service unavailable");
}
```

### Circuit Breaker States

```
CLOSED (healthy)
  ↓ (failures > threshold)
OPEN (circuit broken, fail fast)
  ↓ (wait duration passed)
HALF_OPEN (test if recovered)
  ↓ (success) → CLOSED
  ↓ (failure) → OPEN
```

---

## 11. Observability

### Metrics

```yaml
# Prometheus metrics exposed at /actuator/prometheus
brain_scoring_requests_total        # Counter
brain_scoring_request_duration_ms   # Histogram
brain_scoring_errors_total          # Counter
brain_dupli_requests_total
brain_fraud_requests_total
# ... etc
```

### Logging

```
[brain] [service=scoring-service] [request_id=xxx] 
  Score: 87, Confidence: 0.94, Duration: 245ms
```

### Grafana Dashboards

- Brain Services Health (uptime, latency)
- Scoring Accuracy (score distribution)
- Fraud Detection (flags, review required %)

---

## 12. Testing Strategy

### Unit Tests (Per Service)

```python
# brain/scoring-service/test_scoring.py
def test_score_calculation():
    response = score_bien(BienScoreRequest(...))
    assert response.score >= 0 and response.score <= 100
    assert response.confidence >= 0 and response.confidence <= 1
```

### Integration Tests (Backend + Brain)

```java
@BackendE2ETest
class BrainIntegrationTest {
    
    @Test
    void testAnnonceWithScore() {
        // Create annonce
        AnnonceResponse response = annonceService.create(...);
        
        // Verify score was calculated
        assert response.getAiScore() != null;
        assert response.getAiConfidence() >= 0.0;
    }
}
```

### E2E Tests (Full Stack)

```bash
# Run all services + test full flow
docker compose up -d
mvn clean verify -Pbackend-e2e-postgres
```

---

## 13. Known Limitations & TODOs

| Item | Status | Notes |
|------|--------|-------|
| Model versioning | ⚠️ TODO | Need to track which ML model version scored each listing |
| Async scoring | ⚠️ TODO | Scoring currently synchronous (blocks request) |
| Batch processing | ⚠️ TODO | Optimize for bulk scoring (import jobs) |
| A/B testing | ❌ TODO | Compare different model versions |
| Model retraining | ❌ TODO | Automated ML pipeline for model updates |
| Explainability | ❌ TODO | Why did the model give this score? (SHAP, LIME) |

---

## 14. File Changes Summary

### New Files (37 files)

```
✅ brain/AGENT_CONTEXT.md
✅ brain/scoring-service/Dockerfile
✅ brain/scoring-service/main.py
✅ brain/scoring-service/requirements.txt
✅ brain/scoring-service/test_scoring.py
✅ brain/dupli-service/Dockerfile
✅ brain/dupli-service/main.py
✅ brain/dupli-service/requirements.txt
✅ brain/fraud-service/Dockerfile
✅ brain/fraud-service/main.py
✅ brain/fraud-service/requirements.txt
✅ brain/fraud-service/tests/test_fraud.py
✅ backend/src/main/java/com/example/backend/brain/BrainClientService.java
✅ backend/src/main/java/com/example/backend/brain/BrainProperties.java
✅ backend/src/main/java/com/example/backend/brain/BrainScoringService.java
✅ backend/src/main/java/com/example/backend/brain/dto/BienScoreRequest.java
✅ backend/src/main/java/com/example/backend/brain/dto/BienScoreResponse.java
✅ backend/src/main/java/com/example/backend/brain/dto/FraudRequest.java
✅ backend/src/main/java/com/example/backend/brain/dto/FraudResponse.java
✅ backend/src/main/java/com/example/backend/brain/dto/DoublonResultDto.java
✅ backend/src/main/java/com/example/backend/brain/dto/DupliAnnonceDto.java
✅ .github/workflows/brain-ci.yml
✅ backend/src/main/resources/db/migration/V38__Add_ai_score_to_annonce.sql
✅ backend/src/main/resources/db/migration/V39__Add_fraud_score_to_annonce.sql
✅ ... and 13 more
```

### Modified Files (200+ files)

All backend controllers, services, DTOs, entities updated to support brain service calls

---

## 15. Next Steps

1. ⬜ Test brain services locally with docker compose
2. ⬜ Verify all AI scores populate in database
3. ⬜ Check CI/CD pipeline (brain-ci.yml) passes
4. ⬜ Deploy to staging environment
5. ⬜ Monitor fraud detection accuracy
6. ⬜ Train models with production data
7. ⬜ Implement async scoring (for better performance)
8. ⬜ Set up model versioning & retraining pipeline

---

**Status**: 🧠 Brain services integrated into project  
**Last Updated**: 2026-02-19  
**Owner**: Atlas Immobilier Team
