FROM python:3.11-slim

WORKDIR /app

# Upgrade pip and install common dependencies if needed
RUN pip install --upgrade pip

# Copy the global requirements
COPY requirements.txt .

# Install PyTorch CPU version first to prevent ~2-3GB of CUDA toolkit downloads,
# which are causing network timeouts ("Input/output error") during pip install.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir -r requirements.txt

# Pre-download sentence-transformers model to avoid timeout on first startup
# This takes ~2-3 minutes but caches the model in the layer
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

# Copy all the brain modules
COPY . .

# Expose the single port used by the monolith
EXPOSE 8000

# Start the unified backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
