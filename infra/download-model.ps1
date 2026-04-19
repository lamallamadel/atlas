# PowerShell script to download a small GGUF model for local llama.cpp development
# Models available at: https://huggingface.co/TheBloke (filter by GGUF)

param(
    [string]$ModelName = "tinyllama"
)

$MODELS_DIR = "./models"
$null = New-Item -ItemType Directory -Path $MODELS_DIR -Force

Write-Host "📥 Downloading GGUF model: $ModelName" -ForegroundColor Cyan

$modelUrl = ""
$displayName = ""

switch ($ModelName.ToLower()) {
    "tinyllama" {
        # TinyLlama 1.1B - fastest, ~600MB
        $displayName = "TinyLlama (1.1B, ~600MB)"
        $modelUrl = "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
    }
    "phi" {
        # Microsoft Phi 2.7B - better quality, ~1.5GB
        $displayName = "Phi 2.7B (~1.5GB)"
        $modelUrl = "https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf"
    }
    "mistral" {
        # Mistral 7B - quality model, ~4GB
        $displayName = "Mistral 7B (~4GB)"
        $modelUrl = "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/Mistral-7B-Instruct-v0.1.Q4_K_M.gguf"
    }
    "llama2" {
        # Llama 2 7B - solid performer, ~4GB
        $displayName = "Llama 2 7B (~4GB)"
        $modelUrl = "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf"
    }
    default {
        Write-Host "Unknown model: $ModelName" -ForegroundColor Red
        Write-Host ""
        Write-Host "Available models:" -ForegroundColor Green
        Write-Host "  tinyllama  - TinyLlama 1.1B (fastest, ~600MB)"
        Write-Host "  phi        - Phi 2.7B (~1.5GB)"
        Write-Host "  mistral    - Mistral 7B (~4GB)"
        Write-Host "  llama2     - Llama 2 7B (~4GB)"
        Write-Host ""
        Write-Host "Usage: .\download-model.ps1 -ModelName phi"
        Write-Host "Default: tinyllama"
        exit 1
    }
}

$modelPath = Join-Path $MODELS_DIR "model.gguf"

if (Test-Path $modelPath) {
    Write-Host "✓ Model already exists at $modelPath" -ForegroundColor Green
} else {
    Write-Host "Installing $displayName..." -ForegroundColor Yellow
    
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $modelUrl -OutFile $modelPath -UseBasicParsing
    
    if ($?) {
        Write-Host "✓ $displayName downloaded" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to download model" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✓ Model ready. Start llama.cpp with:" -ForegroundColor Green
Write-Host "  docker compose -f docker-compose.local.yml --profile llama up llama-cpp" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then start the full stack:" -ForegroundColor Green
Write-Host "  docker compose -f docker-compose.local.yml up" -ForegroundColor Cyan
