import os
import logging
import psycopg2
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, classification_report
)
from services.model_registry import ModelRegistry

logger = logging.getLogger(__name__)

class TrainingService:
    def __init__(self, model_registry: ModelRegistry):
        self.model_registry = model_registry
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'backend_db'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'postgres')
        }
    
    def train_model(self, org_id: str = 'default') -> dict:
        try:
            logger.info(f"Starting model training for org: {org_id}")
            
            df = self._fetch_training_data(org_id)
            
            if len(df) < 100:
                return {
                    'status': 'insufficient_data',
                    'message': f'Need at least 100 records, got {len(df)}',
                    'org_id': org_id
                }
            
            X, y, feature_names = self._prepare_training_data(df)
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=10,
                min_samples_leaf=5,
                random_state=42,
                n_jobs=-1
            )
            
            model.fit(X_train, y_train)
            
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)[:, 1]
            
            metrics = {
                'precision': float(precision_score(y_test, y_pred)),
                'recall': float(recall_score(y_test, y_pred)),
                'f1_score': float(f1_score(y_test, y_pred)),
                'roc_auc': float(roc_auc_score(y_test, y_pred_proba)),
                'accuracy': float(model.score(X_test, y_test))
            }
            
            cm = confusion_matrix(y_test, y_pred)
            metrics['confusion_matrix'] = {
                'true_negatives': int(cm[0][0]),
                'false_positives': int(cm[0][1]),
                'false_negatives': int(cm[1][0]),
                'true_positives': int(cm[1][1])
            }
            
            metadata = {
                'org_id': org_id,
                'feature_names': feature_names,
                'training_data_size': len(df),
                'test_size': len(X_test),
                'metrics': metrics,
                'model_type': 'RandomForestClassifier',
                'hyperparameters': {
                    'n_estimators': 100,
                    'max_depth': 10,
                    'min_samples_split': 10,
                    'min_samples_leaf': 5
                }
            }
            
            version = self.model_registry.save_model(org_id, model, metadata)
            
            logger.info(f"Model training completed for org {org_id}, version: {version}")
            logger.info(f"Metrics: {metrics}")
            
            return {
                'status': 'success',
                'org_id': org_id,
                'version': version,
                'metrics': metrics,
                'training_data_size': len(df)
            }
        
        except Exception as e:
            logger.error(f"Training error for org {org_id}: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'org_id': org_id,
                'error': str(e)
            }
    
    def _fetch_training_data(self, org_id: str) -> pd.DataFrame:
        query = """
        SELECT 
            d.id as dossier_id,
            d.lead_source,
            d.created_at as dossier_created_at,
            d.status,
            ls.source_score,
            ls.response_time_score,
            ls.engagement_score,
            ls.property_match_score,
            ls.total_score,
            CASE 
                WHEN d.status IN ('QUALIFIED', 'CONVERTED', 'WON') THEN 1
                ELSE 0
            END as converted,
            COUNT(DISTINCT CASE WHEN m.direction = 'INBOUND' THEN m.id END) as inbound_messages,
            COUNT(DISTINCT CASE WHEN m.direction = 'OUTBOUND' THEN m.id END) as outbound_messages,
            COUNT(DISTINCT a.id) as appointments_count,
            CASE WHEN d.annonce_id IS NOT NULL THEN 1 ELSE 0 END as has_property,
            COALESCE(an.price, 0) as property_price,
            CASE WHEN an.photos IS NOT NULL AND jsonb_array_length(an.photos) > 0 THEN 1 ELSE 0 END as has_photos,
            EXTRACT(EPOCH FROM (NOW() - d.created_at))/86400 as days_since_creation
        FROM dossier d
        LEFT JOIN lead_score ls ON ls.dossier_id = d.id
        LEFT JOIN message_entity m ON m.dossier_id = d.id
        LEFT JOIN appointment_entity a ON a.dossier_id = d.id
        LEFT JOIN annonce an ON an.id = d.annonce_id
        WHERE d.org_id = %s
        AND d.created_at >= NOW() - INTERVAL '6 months'
        GROUP BY d.id, d.lead_source, d.created_at, d.status, d.annonce_id,
                 ls.source_score, ls.response_time_score, ls.engagement_score,
                 ls.property_match_score, ls.total_score, an.price, an.photos
        """
        
        try:
            conn = psycopg2.connect(**self.db_config)
            df = pd.read_sql_query(query, conn, params=(org_id,))
            conn.close()
            
            logger.info(f"Fetched {len(df)} records for training from org {org_id}")
            return df
        
        except Exception as e:
            logger.error(f"Error fetching training data: {str(e)}", exc_info=True)
            raise
    
    def _prepare_training_data(self, df: pd.DataFrame):
        feature_columns = [
            'source_score',
            'response_time_score',
            'inbound_messages',
            'outbound_messages',
            'appointments_count',
            'has_property',
            'property_price',
            'has_photos',
            'days_since_creation'
        ]
        
        for col in feature_columns:
            if col not in df.columns:
                df[col] = 0
        
        df['engagement_rate'] = (
            df['inbound_messages'] / (df['outbound_messages'] + 1)
        ).fillna(0)
        
        df['market_activity_score'] = np.random.uniform(40, 60, size=len(df))
        
        feature_columns.extend(['engagement_rate', 'market_activity_score'])
        
        X = df[feature_columns].fillna(0).values
        y = df['converted'].values
        
        return X, y, feature_columns
