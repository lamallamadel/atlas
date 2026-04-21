import sys
import json
import argparse
from pathlib import Path

OPENAI_DATASET_PATH = Path(__file__).resolve().parent.parent.parent / "atlas_openai_dataset.jsonl"
SHAREGPT_DATASET_PATH = Path(__file__).resolve().parent.parent.parent / "atlas_training_dataset.jsonl"
DATASETS_DIR = Path(__file__).resolve().parent.parent.parent / "datasets"

SYSTEM_PROMPT = "Tu es Atlas IA, un agent immobilier expert travaillant pour l'Agence. Tu es poli, proactif et tu connais l'immobilier marocain."

def add_example(user_msg: str, assistant_msg: str, openai_path: Path, sharegpt_path: Path):
    """
    Appends a new conversation example to BOTH JSONL datasets (OpenAI and ShareGPT).
    """
    # 1. Format OpenAI (messages: role, content)
    openai_record = {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
            {"role": "assistant", "content": assistant_msg}
        ]
    }
    
    with open(openai_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(openai_record, ensure_ascii=False) + "\n")
        
    # 2. Format ShareGPT/Mistral (conversations: from, value)
    sharegpt_record = {
        "conversations": [
            {"from": "system", "value": SYSTEM_PROMPT},
            {"from": "human", "value": user_msg},
            {"from": "gpt", "value": assistant_msg}
        ]
    }
    
    with open(sharegpt_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(sharegpt_record, ensure_ascii=False) + "\n")
    
    print(f"✅ Exemple ajouté avec succès aux deux datasets !")
    print(f" -> {openai_path.name}")
    print(f" -> {sharegpt_path.name}")
    print(f"\nMessage Utilisateur : {user_msg}")
    print(f"Réponse Assistant : {assistant_msg[:50]}...")

def main():
    parser = argparse.ArgumentParser(description="Atlas Dual-Dataset Manager (OpenAI + ShareGPT)")
    parser.add_argument("--user", type=str, required=True, help="Le message de l'utilisateur")
    parser.add_argument("--assistant", type=str, required=True, help="La réponse attendue de l'assistant")
    parser.add_argument("--version", type=str, default=None, help="Si fourni (ex: v2_contracts), créera un nouveau fichier delta dans le dossier 'datasets/'")
    
    args = parser.parse_args()
    
    if args.version:
        # Mode DELTA VERSIONING
        if not DATASETS_DIR.exists():
            DATASETS_DIR.mkdir()
            
        openai_path = DATASETS_DIR / f"{args.version}_openai.jsonl"
        sharegpt_path = DATASETS_DIR / f"{args.version}_sharegpt.jsonl"
        print(f"📦 Mode Versioning Activé : Création/Ajout au delta {args.version}")
    else:
        # Mode APPEND GENERAL
        openai_path = OPENAI_DATASET_PATH
        sharegpt_path = SHAREGPT_DATASET_PATH
    
    if not openai_path.exists():
        print(f"⚠️ Le fichier {openai_path.name} n'existe pas. Il sera créé.")
    if not sharegpt_path.exists():
        print(f"⚠️ Le fichier {sharegpt_path.name} n'existe pas. Il sera créé.")
        
    add_example(args.user, args.assistant, openai_path, sharegpt_path)

if __name__ == "__main__":
    main()
