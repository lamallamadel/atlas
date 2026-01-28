import os
import joblib
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class ModelRegistry:
    def __init__(self, base_path: str = None):
        self.base_path = Path(base_path or os.getenv('MODEL_PATH', './models'))
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.active_models: Dict[str, dict] = {}
        self._load_active_models()
    
    def _load_active_models(self):
        registry_file = self.base_path / 'registry.json'
        if registry_file.exists():
            with open(registry_file, 'r') as f:
                self.active_models = json.load(f)
        else:
            self.active_models = {}
    
    def _save_registry(self):
        registry_file = self.base_path / 'registry.json'
        with open(registry_file, 'w') as f:
            json.dump(self.active_models, f, indent=2)
    
    def get_model_path(self, org_id: str, version: str = None) -> Path:
        if version:
            return self.base_path / org_id / f'model_v{version}.pkl'
        
        active_version = self.get_active_model_version(org_id)
        if not active_version:
            raise ValueError(f"No active model for org {org_id}")
        
        return self.base_path / org_id / f'model_v{active_version}.pkl'
    
    def get_metadata_path(self, org_id: str, version: str) -> Path:
        return self.base_path / org_id / f'metadata_v{version}.json'
    
    def save_model(self, org_id: str, model, metadata: dict) -> str:
        org_path = self.base_path / org_id
        org_path.mkdir(parents=True, exist_ok=True)
        
        version = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        
        model_path = self.get_model_path(org_id, version)
        joblib.dump(model, model_path)
        logger.info(f"Model saved: {model_path}")
        
        metadata['version'] = version
        metadata['created_at'] = datetime.utcnow().isoformat()
        metadata_path = self.get_metadata_path(org_id, version)
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        self.active_models[org_id] = {
            'version': version,
            'activated_at': datetime.utcnow().isoformat(),
            'metadata': metadata
        }
        self._save_registry()
        
        return version
    
    def load_model(self, org_id: str, version: str = None):
        model_path = self.get_model_path(org_id, version)
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        return joblib.load(model_path)
    
    def load_metadata(self, org_id: str, version: str = None) -> dict:
        if version is None:
            version = self.get_active_model_version(org_id)
        
        metadata_path = self.get_metadata_path(org_id, version)
        if not metadata_path.exists():
            return {}
        
        with open(metadata_path, 'r') as f:
            return json.load(f)
    
    def get_active_model_version(self, org_id: str = 'default') -> Optional[str]:
        return self.active_models.get(org_id, {}).get('version')
    
    def list_versions(self, org_id: str) -> List[dict]:
        org_path = self.base_path / org_id
        if not org_path.exists():
            return []
        
        versions = []
        for model_file in org_path.glob('model_v*.pkl'):
            version = model_file.stem.replace('model_v', '')
            metadata = self.load_metadata(org_id, version)
            versions.append({
                'version': version,
                'is_active': version == self.get_active_model_version(org_id),
                'created_at': metadata.get('created_at'),
                'metrics': metadata.get('metrics', {})
            })
        
        return sorted(versions, key=lambda x: x['version'], reverse=True)
    
    def rollback_to_version(self, org_id: str, version: str) -> dict:
        model_path = self.get_model_path(org_id, version)
        if not model_path.exists():
            raise ValueError(f"Version {version} not found for org {org_id}")
        
        metadata = self.load_metadata(org_id, version)
        
        self.active_models[org_id] = {
            'version': version,
            'activated_at': datetime.utcnow().isoformat(),
            'metadata': metadata,
            'rollback': True
        }
        self._save_registry()
        
        logger.info(f"Rolled back to version {version} for org {org_id}")
        
        return {
            'status': 'success',
            'org_id': org_id,
            'version': version,
            'message': f'Successfully rolled back to version {version}'
        }
    
    def get_model_info(self, org_id: str) -> dict:
        active_version = self.get_active_model_version(org_id)
        if not active_version:
            return {
                'status': 'no_model',
                'message': f'No active model for org {org_id}'
            }
        
        metadata = self.load_metadata(org_id, active_version)
        
        return {
            'org_id': org_id,
            'version': active_version,
            'activated_at': self.active_models[org_id].get('activated_at'),
            'metrics': metadata.get('metrics', {}),
            'feature_names': metadata.get('feature_names', []),
            'training_data_size': metadata.get('training_data_size', 0)
        }
