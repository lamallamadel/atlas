import os
import sys
import time
import json
import argparse
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# ----- Configuration Path -----
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("OPENAI_API_KEY")
if not API_KEY or API_KEY == "change-me":
    print("❌ Erreur : OPENAI_API_KEY manquante ou invalide dans le fichier .env")
    sys.exit(1)

client = OpenAI(api_key=API_KEY)

# ----- Versioning Paths -----
DATASETS_DIR = Path(__file__).resolve().parent.parent.parent / "datasets"
HISTORY_FILE = Path(__file__).resolve().parent / "tune_history.json"

# Modèle original d'OpenAI utilisé tout au début
FOUNDATION_MODEL = "gpt-4o-mini-2024-07-18"

def load_history():
    if not HISTORY_FILE.exists():
        return {"versions": []}
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_history(history):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=4, ensure_ascii=False)

def get_base_model(history):
    """
    Retourne le dernier modèle fine-tuné généré. 
    S'il n'y en a aucun, retourne le modèle de fondation OpenAI.
    """
    if not history["versions"]:
        return FOUNDATION_MODEL
    
    # On prend l'ID du dernier entraînement réussi
    latest_version = history["versions"][-1]
    last_model_id = latest_version.get("model_id")
    
    return last_model_id if last_model_id else FOUNDATION_MODEL

def upload_and_train(dataset_path: Path, base_model: str, version_tag: str):
    if not dataset_path.exists():
        print(f"❌ Erreur : Le dataset delta introuvable à {dataset_path}")
        sys.exit(1)
        
    print(f"🔄 Delta Training : {dataset_path.name}")
    print(f"🏗 Modèle de base : {base_model}")
        
    print(f"\n⏳ 1. Upload du dataset (Delta) vers OpenAI...")
    with open(dataset_path, "rb") as f:
        file_response = client.files.create(
            file=f,
            purpose="fine-tune"
        )
    file_id = file_response.id
    print(f"✅ Upload réussi ! File ID: {file_id}")
    
    # Wait briefly for file processing
    time.sleep(5)
    
    print(f"\n⏳ 2. Lancement du job de Fine-Tuning sur {base_model}")
    try:
        job = client.fine_tuning.jobs.create(
            training_file=file_id,
            model=base_model,
            suffix=f"atlas-{version_tag}"
        )
        job_id = job.id
        print(f"✅ Job de Fine-Tuning démarré ! Job ID: {job_id}")
        print(f"Vous pouvez monitorer l'avancement sur : https://platform.openai.com/finetune")
        
        print("\n⏳ 3. Monitoring du job (Appuyez sur Ctrl+C pour quitter mais laisser tourner en tâche de fond)")
        while True:
            status_response = client.fine_tuning.jobs.retrieve(job_id)
            status = status_response.status
            
            if status == "succeeded":
                fine_tuned_model = status_response.fine_tuned_model
                print(f"\n🎉 SUCCÈS ! Modèle entrainé avec succès.")
                print(f"🤖 NOVEAU MODEL ID : {fine_tuned_model}")
                
                # Mise à jour de l'historique
                history = load_history()
                history["versions"].append({
                    "version_tag": version_tag,
                    "dataset_file": dataset_path.name,
                    "base_model_used": base_model,
                    "model_id": fine_tuned_model,
                    "job_id": job_id,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                })
                save_history(history)
                print(f"✅ Historique mis à jour dans {HISTORY_FILE.name}")
                print(f"👉 Mettez à jour votre variable OPENAI_MODEL dans .env avec '{fine_tuned_model}' !")
                break
            elif status in ["failed", "cancelled"]:
                print(f"\n❌ ERREUR : Le job a échoué ou a été annulé. Statut: {status}")
                break
            
            print(f"Statut actuel : {status}... (vérification dans 30s)")
            time.sleep(30)
            
    except Exception as e:
        print(f"\n❌ Erreur inattendue lors du fine-tuning : {e}")

def main():
    parser = argparse.ArgumentParser(description="Atlas Delta Fine-Tuner (Continuous Training)")
    parser.add_argument("dataset", type=str, help="Nom du fichier JSONL (ex: v2_create_contract.jsonl)")
    parser.add_argument("--force-base", type=str, default=None, help="Forcer un modèle de base spécifique (ID) au lieu d'utiliser le dernier modèle généré")
    
    args = parser.parse_args()
    
    dataset_file = Path(args.dataset)
    version_tag = dataset_file.stem.split('_')[0][:10] # e.g., 'v2' from 'v2_create_contract.jsonl'
    
    # 1. On cherche le dataset dans le dossier "datasets" ou dans le répertoire courant
    dataset_path = DATASETS_DIR / dataset_file.name
    if not dataset_path.exists():
        dataset_path = dataset_file # Fallback chemin absolu/relatif fourni
    
    # 2. On détermine le modèle de base (Foundation ou le précédent)
    history = load_history()
    base_model = args.force_base if args.force_base else get_base_model(history)
    
    upload_and_train(dataset_path, base_model, version_tag)

if __name__ == "__main__":
    main()
