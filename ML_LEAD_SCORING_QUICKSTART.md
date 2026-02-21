# ML Lead Scoring - Quick Start Guide

## Overview

This system replaces the rule-based lead scoring with an ML-powered predictive engine that forecasts lead conversion probability using historical data.

## Quick Setup (5 Minutes)

### 1. Start ML Service

```bash
cd ml-service

# Install dependencies
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env: Set DB_HOST, DB_NAME, DB_USER, DB_PASSWORD

# Run
python app.py
```

Service starts at http://localhost:5000

### 2. Update Backend Configuration

Add to `backend/src/main/resources/application.yml`:
```yaml
ml:
  service:
    url: http://localhost:5000
  training:
    enabled: true
    cron: "0 0 2 1 * ?"
```

### 3. Run Database Migration

```bash
cd backend
mvn flyway:migrate
```

### 4. Train Initial Model

```bash
curl -X POST http://localhost:8080/api/ml/model/train \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Access ML Dashboard

Navigate to: http://localhost:4200/ml-insights

## Usage

### Get Prediction for a Lead

```bash
curl -X POST http://localhost:8080/api/ml/predict/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "conversion_probability": 0.85,
  "confidence": 0.92,
  "recommended_action": "HIGH_PRIORITY"
}
```

### View Feature Importance

```bash
curl http://localhost:8080/api/ml/model/feature-importance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create A/B Test

```bash
curl -X POST http://localhost:8080/api/ml/ab-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "experiment_name": "ML vs Rules Q1",
    "control_method": "RULE_BASED",
    "treatment_method": "ML",
    "traffic_split": 0.5
  }'
```

## Key Features

### Automatic Lead Scoring
- Real-time predictions on every lead
- Conversion probability (0-100%)
- Confidence score (0-100%)
- Recommended action (HIGH/MEDIUM/LOW priority)

### Monthly Model Retraining
- Automatic training on 1st of month at 2 AM
- Uses last 6 months of conversion data
- Requires minimum 100 records
- Auto-activates if metrics improve

### Model Versioning
- All models are versioned (YYYYMMDDHHMMSS)
- One-click rollback to previous versions
- Complete metric history preserved
- Zero-downtime version switching

### A/B Testing Framework
- Compare ML vs rule-based scoring
- Track conversion rates
- Statistical significance testing
- Traffic split control (e.g., 50/50)

### ML Insights Dashboard
- Live model performance metrics
- Feature importance visualization
- Model version comparison
- A/B test results
- Training history

## Model Performance

Expected metrics after training:
- **Precision**: 80-90% (predicted conversions that actually convert)
- **Recall**: 70-85% (actual conversions correctly identified)
- **ROC-AUC**: 85-95% (overall model quality)
- **Accuracy**: 80-90% (overall correctness)

## Docker Deployment

```bash
cd ml-service
docker-compose up -d
```

Or manually:
```bash
docker build -t ml-service .
docker run -d -p 5000:5000 \
  -e DB_HOST=postgres \
  -e DB_NAME=backend_db \
  ml-service
```

## Monitoring

### Health Check
```bash
curl http://localhost:5000/health
```

### Prometheus Metrics
```bash
curl http://localhost:5000/metrics
```

### Backend Actuator
```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/metrics
```

## Troubleshooting

### Training Fails

**Error**: "Insufficient data"
**Fix**: Need at least 100 conversion records. Wait for more data.

**Error**: "Database connection timeout"
**Fix**: Check DB_HOST, DB_PORT in `.env`

### Predictions Fail

**Error**: "Model not found"
**Fix**: Train a model first: `POST /api/ml/model/train`

**Error**: "ML service unavailable"
**Fix**: Check ML service is running: `curl http://localhost:5000/health`

### Dashboard Won't Load

**Error**: CORS errors
**Fix**: Ensure ML service URL is correct in `application.yml`

**Error**: 401 Unauthorized
**Fix**: Include valid JWT token in requests

## Best Practices

### 1. Initial Setup
- Train model with at least 100 conversion records
- Monitor first model performance closely
- Run A/B test for 2 weeks before full rollout

### 2. Monthly Maintenance
- Review model metrics after automatic retraining
- Compare to previous version
- Rollback if performance degrades

### 3. Feature Updates
- Document any new features added
- Retrain model after feature changes
- Test predictions before deploying to production

### 4. A/B Testing
- Run experiments for minimum 2 weeks
- Ensure statistical significance (>100 samples per variant)
- Consider both conversion rate and revenue impact

## Architecture

```
┌─────────────┐     REST API      ┌──────────────┐
│   Frontend  │ ────────────────> │   Backend    │
│  (Angular)  │                    │ (Spring Boot)│
└─────────────┘                    └──────┬───────┘
                                          │
                                          │ HTTP
                                          │
                                   ┌──────▼───────┐
                                   │ ML Service   │
                                   │  (Flask)     │
                                   └──────┬───────┘
                                          │
                                          │ SQL
                                          │
                                   ┌──────▼───────┐
                                   │  PostgreSQL  │
                                   │   Database   │
                                   └──────────────┘
```

## API Endpoints Summary

### Backend (Spring Boot)
- `POST /api/ml/predict/{dossierId}` - Get prediction
- `GET /api/ml/model/info` - Model info
- `POST /api/ml/model/train` - Train model
- `GET /api/ml/model/versions` - List versions
- `POST /api/ml/model/rollback/{version}` - Rollback
- `POST /api/ml/ab-test` - Create A/B test
- `GET /api/ml/ab-test` - List experiments

### ML Service (Flask)
- `GET /health` - Health check
- `POST /api/v1/predict` - Prediction
- `POST /api/v1/model/train` - Train
- `GET /api/v1/model/info` - Model info
- `GET /api/v1/model/feature-importance` - Feature importance
- `GET /metrics` - Prometheus metrics

## Next Steps

1. ✅ Train initial model with historical data
2. ✅ Verify predictions are working
3. ✅ Set up monitoring dashboards
4. ✅ Create first A/B test experiment
5. ✅ Review model performance weekly
6. ✅ Plan feature improvements based on importance analysis

## Support

For detailed documentation, see:
- **Full Implementation Guide**: `ML_LEAD_SCORING_IMPLEMENTATION.md`
- **ML Service README**: `ml-service/README.md`
- **API Documentation**: http://localhost:8080/swagger-ui.html

For issues:
- Check application logs
- Review Prometheus metrics
- Verify database connectivity
- Ensure all services are running
