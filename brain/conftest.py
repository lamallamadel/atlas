"""Configuration pytest commune au brain.

Lancer depuis le dossier brain/ :  python -m pytest
"""

import os
import sys

# API_KEY est obligatoire au démarrage : on fournit une clé de test
# avant que config.py ne soit importé.
os.environ.setdefault("API_KEY", "test-key")

sys.path.insert(0, os.path.dirname(__file__))
