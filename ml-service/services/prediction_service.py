import numpy as np
import logging
from typing import Dict, List
from services.model_registry import ModelRegistry

logger = logging.getLogger(__name__)

class PredictionService:
    def __init__(self, model_registry: ModelRegistry):
        self.model_registry = model_registry
        self.feature_names = [
            'lead_source_score',
            'response_time_minutes',
            'inbound_messages_count',
            'outbound_messages_count',
            'appointments_count',
            'has_property',
            'property_price',
            'property_has_photos',
            'engagement_rate',
            'days_since_creation',
            'market_activity_score'
        ]
    
    def predict(self, features: Dict, org_id: str = 'default') -> Dict:
        try:
            model = self.model_registry.load_model(org_id)
            metadata = self.model_registry.load_metadata(org_id)
            
            feature_vector = self._prepare_features(features)
            
            prediction_proba = model.predict_proba([feature_vector])[0]
            prediction = int(model.predict([feature_vector])[0])
            
            conversion_probability = float(prediction_proba[1] if len(prediction_proba) > 1 else 0.0)
            
            confidence = self._calculate_confidence(prediction_proba)
            
            return {
                'prediction': prediction,
                'conversion_probability': round(conversion_probability, 4),
                'confidence': round(confidence, 4),
                'model_version': self.model_registry.get_active_model_version(org_id),
                'recommended_action': self._get_recommended_action(conversion_probability, confidence),
                'feature_contributions': self._get_feature_contributions(model, feature_vector)
            }
        
        except Exception as e:
            logger.error(f"Prediction error for org {org_id}: {str(e)}", exc_info=True)
            raise
    
    def predict_batch(self, batch: List[Dict], org_id: str = 'default') -> List[Dict]:
        results = []
        for features in batch:
            try:
                result = self.predict(features, org_id)
                results.append(result)
            except Exception as e:
                logger.error(f"Batch prediction error: {str(e)}")
                results.append({
                    'error': str(e),
                    'features': features
                })
        return results
    
    def get_feature_importance(self, org_id: str = 'default') -> Dict:
        try:
            model = self.model_registry.load_model(org_id)
            
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
            else:
                return {'error': 'Model does not support feature importance'}
            
            feature_importance = [
                {
                    'feature': name,
                    'importance': float(importance),
                    'rank': rank + 1
                }
                for rank, (name, importance) in enumerate(
                    sorted(zip(self.feature_names, importances), 
                           key=lambda x: x[1], reverse=True)
                )
            ]
            
            return {
                'features': feature_importance,
                'model_version': self.model_registry.get_active_model_version(org_id)
            }
        
        except Exception as e:
            logger.error(f"Feature importance error: {str(e)}", exc_info=True)
            raise
    
    def _prepare_features(self, features: Dict) -> List[float]:
        return [
            float(features.get('lead_source_score', 10)),
            float(features.get('response_time_minutes', 120)),
            float(features.get('inbound_messages_count', 0)),
            float(features.get('outbound_messages_count', 0)),
            float(features.get('appointments_count', 0)),
            float(features.get('has_property', 0)),
            float(features.get('property_price', 0)),
            float(features.get('property_has_photos', 0)),
            float(features.get('engagement_rate', 0)),
            float(features.get('days_since_creation', 0)),
            float(features.get('market_activity_score', 50))
        ]
    
    def _calculate_confidence(self, prediction_proba: np.ndarray) -> float:
        return float(np.max(prediction_proba))
    
    def _get_recommended_action(self, probability: float, confidence: float) -> str:
        if probability >= 0.7 and confidence >= 0.8:
            return 'HIGH_PRIORITY'
        elif probability >= 0.5 and confidence >= 0.7:
            return 'MEDIUM_PRIORITY'
        elif probability >= 0.3:
            return 'NURTURE'
        else:
            return 'LOW_PRIORITY'
    
    def _get_feature_contributions(self, model, feature_vector: List[float]) -> List[Dict]:
        try:
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                
                contributions = []
                for i, (name, value, importance) in enumerate(
                    zip(self.feature_names, feature_vector, importances)
                ):
                    contributions.append({
                        'feature': name,
                        'value': float(value),
                        'contribution': float(value * importance)
                    })
                
                return sorted(contributions, key=lambda x: abs(x['contribution']), reverse=True)[:5]
            
            return []
        except Exception as e:
            logger.error(f"Error calculating feature contributions: {str(e)}")
            return []
