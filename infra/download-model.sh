#!/bin/bash
# Script to download a small GGUF model for local llama.cpp development
# Models available at: https://huggingface.co/TheBloke (filter by GGUF)

set -e

MODELS_DIR="./models"
MODEL_NAME="${1:-TinyLlama}"  # Default: TinyLlama (1.1B params, ~600MB)

# Create models directory
mkdir -p "$MODELS_DIR"

echo "📥 Downloading GGUF model: $MODEL_NAME"

case "$MODEL_NAME" in
  tinyllama|TinyLlama)
    # TinyLlama 1.1B - fastest, ~600MB
    echo "Installing TinyLlama (1.1B, ~600MB)..."
    cd "$MODELS_DIR"
    if [ ! -f "model.gguf" ]; then
      curl -L -o model.gguf \
        "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
      echo "✓ TinyLlama downloaded"
    else
      echo "✓ Model already exists at $MODELS_DIR/model.gguf"
    fi
    ;;
  
  phi|Phi)
    # Microsoft Phi 2.7B - better quality, ~1.5GB
    echo "Installing Phi 2.7B (~1.5GB)..."
    cd "$MODELS_DIR"
    if [ ! -f "model.gguf" ]; then
      curl -L -o model.gguf \
        "https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf"
      echo "✓ Phi 2.7B downloaded"
    else
      echo "✓ Model already exists at $MODELS_DIR/model.gguf"
    fi
    ;;
  
  mistral|Mistral)
    # Mistral 7B - quality model, ~4GB
    echo "Installing Mistral 7B (~4GB)..."
    cd "$MODELS_DIR"
    if [ ! -f "model.gguf" ]; then
      curl -L -o model.gguf \
        "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/Mistral-7B-Instruct-v0.1.Q4_K_M.gguf"
      echo "✓ Mistral 7B downloaded"
    else
      echo "✓ Model already exists at $MODELS_DIR/model.gguf"
    fi
    ;;
  
  llama2|Llama2)
    # Llama 2 7B - solid performer, ~4GB
    echo "Installing Llama 2 7B (~4GB)..."
    cd "$MODELS_DIR"
    if [ ! -f "model.gguf" ]; then
      curl -L -o model.gguf \
        "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf"
      echo "✓ Llama 2 7B downloaded"
    else
      echo "✓ Model already exists at $MODELS_DIR/model.gguf"
    fi
    ;;
  
  *)
    echo "Unknown model: $MODEL_NAME"
    echo ""
    echo "Available models:"
    echo "  tinyllama  - TinyLlama 1.1B (fastest, ~600MB)"
    echo "  phi        - Phi 2.7B (~1.5GB)"
    echo "  mistral    - Mistral 7B (~4GB)"
    echo "  llama2     - Llama 2 7B (~4GB)"
    echo ""
    echo "Usage: $0 [model_name]"
    echo "Default: tinyllama"
    exit 1
    ;;
esac

cd - > /dev/null
echo ""
echo "✓ Model ready. Start llama.cpp with:"
echo "  docker compose -f docker-compose.local.yml --profile llama up llama-cpp"
echo ""
echo "Then start the full stack:"
echo "  docker compose -f docker-compose.local.yml up"
