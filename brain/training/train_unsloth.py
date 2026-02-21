"""
Script d'entraînement QLoRA optimisé pour l'Agent Immobilier Atlas.
À exécuter dans votre environnement Jupyter Lab local équipé d'un GPU.

Pré-requis (à installer idéalement dans une cellule Jupyter) :
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
!pip install --no-deps xformers "trl<0.9.0" peft accelerate bitsandbytes
"""

from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# Paramètres de configuration
max_seq_length = 2048 # Longueur max de contexte
dtype = None # Détection automatique
load_in_4bit = True # Quantization 4-bit pour économiser la VRAM

# 1. Chargement du Modèle (Mistral ou Llama 3)
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/mistral-7b-instruct-v0.2-bnb-4bit",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# 2. Ajout des adaptateurs LoRA
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, # Rank, 16 est un bon compromis pour de l'instruction fine-tuning
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = 16,
    lora_dropout = 0, # Unsloth optimise avec 0
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

# 3. Préparation du Dataset
# Nous chargeons le fichier JSONL que nous avons généré via data_prep.py
def format_chat_template(examples):
    # Unsloth/HuggingFace supporte le format 'ShareGPT' que nous avons généré
    # avec la clé "conversations" (contenant "from" et "value").
    # Nous appliquons le template de chat spécifique à Mistral.
    texts = []
    for conv in examples["conversations"]:
        text = tokenizer.apply_chat_template(conv, tokenize=False, add_generation_prompt=False)
        texts.append(text)
    return { "text" : texts }

# Assurez-vous que le chemin pointe vers le dataset généré
dataset = load_dataset("json", data_files="atlas_training_dataset.jsonl", split="train")
dataset = dataset.map(format_chat_template, batched=True)

# 4. Configuration de l'Entraîneur
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False, # Peut rendre l'entraînement plus rapide sur de très gros datasets
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60, # Ajustez selon le nombre de data. 60 suffit pour un POC.
        learning_rate = 2e-4,
        fp16 = not FastLanguageModel.is_bfloat16_supported(),
        bf16 = FastLanguageModel.is_bfloat16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

# 5. Lancement de l'Entraînement
print("Début du Fine-Tuning de l'Agent Atlas...")
trainer_stats = trainer.train()

# 6. Sauvegarde des Poids LoRA LÉGERS
print("Entraînement terminé. Sauvegarde du modèle (Adaptateurs)...")
model.save_pretrained_merged("atlas_agent_lora", tokenizer, save_method="lora")

"""
BONUS : Export direct en GGUF pour Ollama !
Une fois l'entraînement fini et validé, vous pouvez exporter les poids fusionnés
au format GGUF 4-bit (q4_k_m) pour les charger directement dans votre serveur Ollama.

Décommentez la ligne ci-dessous pour exécuter l'export :
"""
# model.save_pretrained_gguf("atlas_agent_gguf", tokenizer, quantization_method = "q4_k_m")
