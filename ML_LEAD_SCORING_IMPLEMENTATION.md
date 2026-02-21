# ML-Powered Lead Qualification Engine - Implementation Guide

## Overview

This implementation replaces the rule-based lead scoring engine with an advanced machine learning-powered system that predicts lead conversion probability using a RandomForest classifier trained on historical conversion data.

## Architecture

### Components

1. **Python Flask ML Microservice** (`ml-service/`)
   - REST API for predictions and model management
   - RandomForest model training and inference
   - Model versioning and registry
   - Prometheus metrics exposure

2. **Java Spring Boot Backend Integration**
   - `PredictiveLeadScoringService`: Main service for ML predictions
   - `ModelTrainingService`: Handles model training and versioning
   - `ABTestingService`: A/B testing framework
   - `ConversionPredictionController`: REST API endpoints

3. **Angular Frontend Dashboard**
   - `MLInsightsDashboardComponent`: Visualization of ML insights
   - Feature importance charts
   - Model performance metrics
   - A/B test results

## Features

### 1. Machine Learning Model

**Algorithm**: RandomForest Classifier
- 100 estimators
- Max depth: 10
- Handles imbalanced datasets
- Feature importance extraction

**Training Features**:
- `lead_source_score`: Score based on lead source quality
- `response_time_minutes`: Time to first response
- `inbound_messages_count`: Number of inbound messages
- `outbound_messages_count`: Number of outbound messages
- `appointments_count`: Number of scheduled appointments
- `has_property`: Whether lead is associated with a property
- `property_price`: Property price (if available)
- `property_has_photos`: Whether property has photos
- `engagement_rate`: Ratio of inbound to outbound messages
- `days_since_creation`: Days since lead was created
- `market_activity_score`: Market activity indicator

**Performance Metrics**:
- Precision: Percentage of correctly predicted conversions
- Recall: Percentage of actual conversions identified
- F1 Score: Harmonic mean of precision and recall
- ROC-AUC: Area under the receiver operating characteristic curve
- Accuracy: Overall correctness of predictions

### 2. Real-Time Scoring

**Endpoint**: `POST /api/ml/predict/{dossierId}`

Returns:
```json
{
  "prediction": 1,
  "conversion_probability": 0.8542,
  "confidence": 0.92,
  "model_version": "20240115143022",
  "recommended_action": "HIGH_PRIORITY",
  "feature_contributions": [
    {
      "feature": "appointments_count",
      "value": 3,
      "contribution": 0.35
    }
  ]
}
```

**Recommended Actions**:
- `HIGH_PRIORITY`: probability ≥ 0.7, confidence ≥ 0.8
- `MEDIUM_PRIORITY`: probability ≥ 0.5, confidence ≥ 0.7
- `NURTURE`: probability ≥ 0.3
- `LOW_PRIORITY`: probability < 0.3

### 3. Model Training

**Scheduled Training**: Monthly (1st day at 2 AM)
- Configurable via `ml.training.cron` property
- Automatically fetches last 6 months of conversion data
- Requires minimum 100 records for training
- Automatically activates new model if metrics improve

**Manual Training**: `POST /api/ml/model/train`
- Requires admin permissions
- Training typically takes 5-30 minutes depending on data size

**Training Data Query**:
```sql
SELECT 
  d.id, d.status, ls.source_score, ls.response_time_score,
  COUNT(DISTINCT m_in.id) as inbound_messages,
  COUNT(DISTINCT m_out.id) as outbound_messages,
  COUNT(DISTINCT a.id) as appointments_count,
  CASE WHEN d.status IN ('QUALIFIED', 'CONVERTED', 'WON') THEN 1 ELSE 0 END as converted
FROM dossier d
LEFT JOIN lead_score ls ON ls.dossier_id = d.id
LEFT JOIN message_entity m_in ON m_in.dossier_id = d.id AND m_in.direction = 'INBOUND'
LEFT JOIN message_entity m_out ON m_out.dossier_id = d.id AND m_out.direction = 'OUTBOUND'
LEFT JOIN appointment_entity a ON a.dossier_id = d.id
WHERE d.created_at >= NOW() - INTERVAL '6 months'
GROUP BY d.id, d.status, ls.source_score, ls.response_time_score
```

### 4. Model Versioning and Rollback

**Version Format**: `YYYYMMDDHHMMSS` (e.g., `20240115143022`)

**List Versions**: `GET /api/ml/model/versions`
```json
[
  {
    "version": "20240115143022",
    "is_active": true,
    "created_at": "2024-01-15T14:30:22Z",
    "metrics": {
      "precision": 0.85,
      "recall": 0.78,
      "roc_auc": 0.89
    }
  }
]
```

**Rollback**: `POST /api/ml/model/rollback/{version}`
- Instantly switches to previous model version
- Updates both ML service and database state
- Preserves all model metadata

### 5. A/B Testing Framework

**Create Experiment**: `POST /api/ml/ab-test`
```json
{
  "experiment_name": "ML vs Rule-Based Q1 2024",
  "description": "Compare ML predictions against rule-based scoring",
  "control_method": "RULE_BASED",
  "treatment_method": "ML",
  "traffic_split": 0.5
}
```

**Experiment Metrics**: `GET /api/ml/ab-test/{experimentId}/metrics`
```json
{
  "control_metrics": {
    "total_predictions": 1000,
    "conversions": 150,
    "conversion_rate": 0.15
  },
  "treatment_metrics": {
    "total_predictions": 1000,
    "conversions": 185,
    "conversion_rate": 0.185
  },
  "winner": "ML",
  "improvement": "23.3%"
}
```

**Traffic Split Logic**:
```java
public String assignToVariant(Dossier dossier) {
    double randomValue = random.nextDouble();
    if (randomValue < experiment.getTrafficSplit()) {
        return experiment.getControlMethod(); // e.g., RULE_BASED
    } else {
        return experiment.getTreatmentMethod(); // e.g., ML
    }
}
```

### 6. ML Insights Dashboard

**Features**:
- Real-time model performance visualization
- Feature importance ranking (bar chart)
- Model metrics radar chart (precision, recall, F1, ROC-AUC, accuracy)
- A/B test comparison charts
- Model version history table
- One-click model rollback
- Manual training trigger

**Access**: Navigate to `/ml-insights` in the frontend

**Charts**:
1. **Feature Importance**: Horizontal bar chart showing top 10 features
2. **Model Performance**: Radar chart displaying 5 key metrics
3. **A/B Test Results**: Comparative bar chart of conversion rates

## Setup Instructions

### 1. ML Service Setup

```bash
cd ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with database credentials

# Run service
python app.py
# Or with Gunicorn for production:
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 2. Docker Deployment

```bash
cd ml-service
docker build -t ml-service:latest .
docker run -d \
  -p 5000:5000 \
  -e DB_HOST=postgres \
  -e DB_NAME=backend_db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  --name ml-service \
  ml-service:latest
```

### 3. Backend Configuration

Add to `application.yml`:
```yaml
ml:
  service:
    url: http://localhost:5000
  training:
    enabled: true
    cron: "0 0 2 1 * ?"  # Monthly on 1st at 2 AM
```

### 4. Database Migration

```bash
cd backend
mvn flyway:migrate
```

This creates:
- `ml_model_version` table
- `ml_prediction` table
- `ab_test_experiment` table

## API Endpoints

### Predictions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ml/predict/{dossierId}` | Get ML prediction for a lead |
| GET | `/api/ml/predict/{dossierId}/latest` | Get latest prediction |
| GET | `/api/ml/predict/{dossierId}/history` | Get prediction history |
| POST | `/api/ml/predict/{dossierId}/outcome` | Record actual outcome |

### Model Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ml/model/info` | Get active model info |
| GET | `/api/ml/model/feature-importance` | Get feature importance |
| POST | `/api/ml/model/train` | Train new model |
| GET | `/api/ml/model/versions` | List all versions |
| POST | `/api/ml/model/rollback/{version}` | Rollback to version |

### A/B Testing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ml/ab-test` | Create experiment |
| GET | `/api/ml/ab-test` | List experiments |
| GET | `/api/ml/ab-test/{id}/metrics` | Get experiment metrics |
| POST | `/api/ml/ab-test/{id}/stop` | Stop experiment |

## ML Service API

### Flask Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/predict` | Single prediction |
| POST | `/api/v1/predict/batch` | Batch predictions |
| POST | `/api/v1/model/train` | Train model |
| GET | `/api/v1/model/info` | Model info |
| GET | `/api/v1/model/versions` | List versions |
| POST | `/api/v1/model/rollback` | Rollback model |
| GET | `/api/v1/model/feature-importance` | Feature importance |
| GET | `/metrics` | Prometheus metrics |

## Monitoring and Observability

### Prometheus Metrics

**ML Service Metrics**:
- `ml_predictions_total{model_version}`: Total predictions made
- `ml_prediction_latency_seconds`: Prediction latency histogram
- `ml_model_training_total{status}`: Training runs by status

**Backend Metrics**:
- Available at `/actuator/metrics`
- Includes prediction count, latency, errors

### Grafana Dashboard

Create dashboard with:
1. Prediction volume over time
2. Average prediction latency
3. Model performance trends
4. A/B test conversion rates
5. Feature importance changes

### Production Monitoring

**Alert on**:
- Prediction latency > 2 seconds
- Training failures
- Model accuracy drop > 10%
- Prediction error rate > 5%

## Best Practices

### 1. Model Retraining

- Retrain monthly with latest conversion data
- Require minimum 100 samples for training
- Always validate on holdout test set (20%)
- Compare new model metrics to current model before activation

### 2. Feature Engineering

- Normalize numerical features to similar ranges
- Handle missing values appropriately
- Consider adding time-based features (day of week, hour)
- Monitor feature drift over time

### 3. A/B Testing

- Run experiments for at least 2 weeks
- Ensure equal traffic split (50/50)
- Calculate statistical significance
- Monitor both conversion rate and revenue impact

### 4. Model Versioning

- Keep at least 5 previous versions
- Document significant changes in notes field
- Test rollback procedure regularly
- Archive old versions after 6 months

### 5. Security

- Require admin permissions for training
- Rate limit prediction endpoints
- Validate all input features
- Log all training and rollback operations

## Performance Optimization

### Caching

```java
@Cacheable(value = "ml-predictions", key = "#dossierId")
public MLPrediction getLatestPrediction(Long dossierId) {
    return predictionRepository.findTopByDossierIdOrderByPredictedAtDesc(dossierId)
        .orElse(null);
}
```

### Batch Predictions

Use batch endpoint for bulk scoring:
```python
POST /api/v1/predict/batch
{
  "org_id": "default",
  "batch": [
    {"features": {...}},
    {"features": {...}}
  ]
}
```

### Database Indexes

Ensure indexes exist on:
- `ml_prediction(dossier_id)`
- `ml_prediction(predicted_at)`
- `ml_prediction(model_version, org_id)`
- `ml_model_version(org_id, is_active)`

## Troubleshooting

### Model Training Fails

**Issue**: Insufficient data
**Solution**: Wait until sufficient conversion data is available (minimum 100 records)

**Issue**: Database connection timeout
**Solution**: Increase timeout in ML service configuration

### Predictions Return Errors

**Issue**: ML service unavailable
**Solution**: Check ML service health at `/health` endpoint

**Issue**: Missing features
**Solution**: Ensure all required features are present in request

### Dashboard Not Loading

**Issue**: CORS errors
**Solution**: Verify Flask-CORS configuration allows frontend origin

**Issue**: API authentication errors
**Solution**: Ensure JWT token includes required scopes

## Future Enhancements

1. **Advanced Models**
   - XGBoost or LightGBM for better performance
   - Neural networks for complex patterns
   - Ensemble methods combining multiple models

2. **Feature Additions**
   - Geographic data (location, market trends)
   - Behavioral signals (page views, email opens)
   - External data (economic indicators, seasonality)

3. **Real-time Updates**
   - WebSocket support for live predictions
   - Streaming model updates
   - Event-driven retraining triggers

4. **Advanced Analytics**
   - SHAP values for prediction explanations
   - What-if analysis for feature optimization
   - Automated feature selection

5. **MLOps Integration**
   - Integration with MLflow or Kubeflow
   - Automated model validation pipeline
   - Continuous training and deployment

## References

- Scikit-learn Documentation: https://scikit-learn.org/
- RandomForest Classifier: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html
- Flask Documentation: https://flask.palletsprojects.com/
- Spring WebFlux: https://docs.spring.io/spring-framework/reference/web/webflux.html
- Chart.js: https://www.chartjs.org/

## Support

For issues or questions:
- Check logs in `ml-service/` directory
- Review backend logs for integration errors
- Monitor Prometheus metrics for anomalies
- Contact ML team for model-specific questions
