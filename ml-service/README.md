# ML Lead Scoring Service

Python Flask microservice providing machine learning-based lead conversion predictions using RandomForest classifier.

## Features

- Real-time lead conversion predictions
- Batch prediction support
- Model training with historical data
- Model versioning and rollback
- Feature importance analysis
- Prometheus metrics
- Health check endpoint

## Quick Start

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run service
python app.py
```

The service will start on http://localhost:5000

### Docker

```bash
# Build image
docker build -t ml-service:latest .

# Run container
docker run -d \
  -p 5000:5000 \
  -e DB_HOST=postgres \
  -e DB_NAME=backend_db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -v $(pwd)/models:/app/models \
  --name ml-service \
  ml-service:latest
```

### Docker Compose

```bash
docker-compose up -d
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T14:30:22.123456",
  "model_version": "20240115143022"
}
```

### Predict

```bash
POST /api/v1/predict
Content-Type: application/json

{
  "org_id": "default",
  "features": {
    "lead_source_score": 20,
    "response_time_minutes": 30,
    "inbound_messages_count": 5,
    "outbound_messages_count": 3,
    "appointments_count": 2,
    "has_property": 1,
    "property_price": 250000,
    "property_has_photos": 1,
    "engagement_rate": 1.67,
    "days_since_creation": 7,
    "market_activity_score": 55
  }
}
```

Response:
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
      "value": 2,
      "contribution": 0.35
    }
  ]
}
```

### Train Model

```bash
POST /api/v1/model/train
Content-Type: application/json

{
  "org_id": "default"
}
```

Response:
```json
{
  "status": "success",
  "org_id": "default",
  "version": "20240115143022",
  "metrics": {
    "precision": 0.85,
    "recall": 0.78,
    "f1_score": 0.81,
    "roc_auc": 0.89,
    "accuracy": 0.83
  },
  "training_data_size": 1500
}
```

### Get Model Info

```bash
GET /api/v1/model/info?org_id=default
```

Response:
```json
{
  "org_id": "default",
  "version": "20240115143022",
  "activated_at": "2024-01-15T14:30:22Z",
  "metrics": {
    "precision": 0.85,
    "recall": 0.78,
    "roc_auc": 0.89
  },
  "feature_names": [
    "lead_source_score",
    "response_time_minutes",
    "inbound_messages_count",
    "outbound_messages_count",
    "appointments_count",
    "has_property",
    "property_price",
    "property_has_photos",
    "engagement_rate",
    "days_since_creation",
    "market_activity_score"
  ],
  "training_data_size": 1500
}
```

### Get Feature Importance

```bash
GET /api/v1/model/feature-importance?org_id=default
```

Response:
```json
{
  "features": [
    {
      "feature": "appointments_count",
      "importance": 0.25,
      "rank": 1
    },
    {
      "feature": "engagement_rate",
      "importance": 0.18,
      "rank": 2
    }
  ],
  "model_version": "20240115143022"
}
```

### List Model Versions

```bash
GET /api/v1/model/versions?org_id=default
```

Response:
```json
{
  "versions": [
    {
      "version": "20240115143022",
      "is_active": true,
      "created_at": "2024-01-15T14:30:22Z",
      "metrics": {
        "precision": 0.85,
        "recall": 0.78
      }
    },
    {
      "version": "20231215100000",
      "is_active": false,
      "created_at": "2023-12-15T10:00:00Z",
      "metrics": {
        "precision": 0.82,
        "recall": 0.75
      }
    }
  ]
}
```

### Rollback Model

```bash
POST /api/v1/model/rollback
Content-Type: application/json

{
  "org_id": "default",
  "version": "20231215100000"
}
```

Response:
```json
{
  "status": "success",
  "org_id": "default",
  "version": "20231215100000",
  "message": "Successfully rolled back to version 20231215100000"
}
```

### Prometheus Metrics

```bash
GET /metrics
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_NAME | Database name | backend_db |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | postgres |
| MODEL_PATH | Directory for model storage | ./models |
| LOG_LEVEL | Logging level | INFO |

## Model Training

### Requirements

- Minimum 100 historical conversion records
- At least 20% positive conversion rate recommended
- Data from last 6 months

### Training Process

1. Fetch historical data from PostgreSQL
2. Prepare features and labels
3. Split data (80% train, 20% test)
4. Train RandomForest classifier
5. Evaluate on test set
6. Save model and metadata
7. Activate if metrics improve

### Model Metrics

- **Precision**: Percentage of predicted conversions that were correct
- **Recall**: Percentage of actual conversions that were identified
- **F1 Score**: Harmonic mean of precision and recall
- **ROC-AUC**: Area under the ROC curve (0.5 = random, 1.0 = perfect)
- **Accuracy**: Overall correctness

## Development

### Project Structure

```
ml-service/
├── app.py                    # Flask application
├── services/
│   ├── __init__.py
│   ├── model_registry.py     # Model versioning and storage
│   ├── prediction_service.py # Prediction logic
│   └── training_service.py   # Model training
├── models/                   # Trained models (gitignored)
├── requirements.txt          # Python dependencies
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### Adding New Features

1. Update `PredictionService.feature_names`
2. Update `TrainingService._prepare_training_data()`
3. Update database query in `TrainingService._fetch_training_data()`
4. Update backend `PredictiveLeadScoringService.extractFeatures()`
5. Retrain model with new features

### Testing

```bash
# Install test dependencies
pip install pytest pytest-cov

# Run tests
pytest tests/

# With coverage
pytest --cov=services tests/
```

## Monitoring

### Health Check

The service provides a health endpoint that returns:
- Service status
- Current timestamp
- Active model version

### Prometheus Metrics

- `ml_predictions_total`: Total predictions made (by model version)
- `ml_prediction_latency_seconds`: Prediction latency histogram
- `ml_model_training_total`: Total training runs (by status)

### Logging

Logs are written to stdout in JSON format for easy parsing:
```json
{
  "timestamp": "2024-01-15T14:30:22.123",
  "level": "INFO",
  "message": "Model training completed",
  "org_id": "default",
  "version": "20240115143022",
  "metrics": {"precision": 0.85}
}
```

## Troubleshooting

### Training Fails with "Insufficient Data"

Ensure you have at least 100 conversion records in the database.

### Predictions Return Error

Check:
1. ML service is running (`docker ps`)
2. Database connection is working
3. Model exists for the organization
4. All required features are provided

### Model Performance Degraded

Consider:
1. Retraining with more recent data
2. Feature engineering improvements
3. Hyperparameter tuning
4. Checking for data quality issues

## License

Proprietary - Internal Use Only
