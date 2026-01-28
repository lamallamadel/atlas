from flask import Flask, request, jsonify
from flask_cors import CORS
from prometheus_client import Counter, Histogram, generate_latest, REGISTRY
import os
import logging
from datetime import datetime

from services.prediction_service import PredictionService
from services.training_service import TrainingService
from services.model_registry import ModelRegistry

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

prediction_counter = Counter('ml_predictions_total', 'Total predictions made', ['model_version'])
prediction_latency = Histogram('ml_prediction_latency_seconds', 'Prediction latency')
training_counter = Counter('ml_model_training_total', 'Total model training runs', ['status'])

model_registry = ModelRegistry()
prediction_service = PredictionService(model_registry)
training_service = TrainingService(model_registry)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'model_version': model_registry.get_active_model_version()
    })

@app.route('/api/v1/predict', methods=['POST'])
@prediction_latency.time()
def predict():
    try:
        data = request.get_json()
        
        if not data or 'features' not in data:
            return jsonify({'error': 'Missing features'}), 400
        
        org_id = data.get('org_id', 'default')
        features = data['features']
        
        result = prediction_service.predict(features, org_id)
        
        prediction_counter.labels(model_version=result['model_version']).inc()
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/predict/batch', methods=['POST'])
def predict_batch():
    try:
        data = request.get_json()
        
        if not data or 'batch' not in data:
            return jsonify({'error': 'Missing batch data'}), 400
        
        org_id = data.get('org_id', 'default')
        batch = data['batch']
        
        results = prediction_service.predict_batch(batch, org_id)
        
        return jsonify({
            'predictions': results,
            'count': len(results)
        }), 200
    
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/model/train', methods=['POST'])
def train_model():
    try:
        data = request.get_json() or {}
        org_id = data.get('org_id', 'default')
        
        result = training_service.train_model(org_id)
        
        if result['status'] == 'success':
            training_counter.labels(status='success').inc()
        else:
            training_counter.labels(status='failure').inc()
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Training error: {str(e)}", exc_info=True)
        training_counter.labels(status='error').inc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/model/info', methods=['GET'])
def model_info():
    try:
        org_id = request.args.get('org_id', 'default')
        info = model_registry.get_model_info(org_id)
        return jsonify(info), 200
    except Exception as e:
        logger.error(f"Model info error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/model/versions', methods=['GET'])
def list_versions():
    try:
        org_id = request.args.get('org_id', 'default')
        versions = model_registry.list_versions(org_id)
        return jsonify({'versions': versions}), 200
    except Exception as e:
        logger.error(f"List versions error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/model/rollback', methods=['POST'])
def rollback_model():
    try:
        data = request.get_json()
        org_id = data.get('org_id', 'default')
        version = data.get('version')
        
        if not version:
            return jsonify({'error': 'Missing version'}), 400
        
        result = model_registry.rollback_to_version(org_id, version)
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Rollback error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/model/feature-importance', methods=['GET'])
def feature_importance():
    try:
        org_id = request.args.get('org_id', 'default')
        importance = prediction_service.get_feature_importance(org_id)
        return jsonify(importance), 200
    except Exception as e:
        logger.error(f"Feature importance error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/metrics', methods=['GET'])
def metrics():
    return generate_latest(REGISTRY)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
