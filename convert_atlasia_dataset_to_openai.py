import json

input_file = 'atlas_training_dataset.jsonl'
output_file = 'atlas_openai_dataset.jsonl'

# Dictionnaire pour traduire les anciens rôles vers ceux d'OpenAI
role_mapping = {
    "system": "system",
    "human": "user",
    "gpt": "assistant"
}

processed_lines = 0

try:
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8') as outfile:
        
        for line in infile:
            if not line.strip():
                continue
            
            # Charger la ligne JSON
            data = json.loads(line)
            
            # Récupérer l'ancien tableau 'conversations'
            conversations = data.get('conversations', [])
            
            new_messages = []
            for turn in conversations:
                # Récupérer l'ancien rôle et le traduire
                old_role = turn.get("from", "")
                new_role = role_mapping.get(old_role, old_role) 
                
                # Créer le nouveau message avec 'role' et 'content'
                new_message = {
                    "role": new_role,
                    "content": turn.get("value", "")
                }
                new_messages.append(new_message)
            
            # Créer l'objet final pour OpenAI
            openai_data = {"messages": new_messages}
            
            # Sauvegarder (ensure_ascii=False garde les accents français intacts)
            outfile.write(json.dumps(openai_data, ensure_ascii=False) + '\n')
            processed_lines += 1

    print(f"Succès ! {processed_lines} lignes traitées et formatées pour OpenAI.")

except FileNotFoundError:
    print(f"Erreur : Le fichier '{input_file}' est introuvable.")
except json.JSONDecodeError as e:
    print(f"Erreur de lecture JSON à la ligne {processed_lines + 1} : {e}")