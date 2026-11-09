#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHROMA_DIR="$SCRIPT_DIR/backend/chroma_db"

echo "Clearing ChromaDB records..."

# Attempt clean deletion via ChromaDB Python API first if available
if command -v zsh &>/dev/null; then
    zsh -c "source ~/.zshrc && cd '$SCRIPT_DIR/backend' && uv run python -c '
import chromadb, os
DB_PATH = os.path.join(os.getcwd(), \"chroma_db\")
if os.path.exists(DB_PATH):
    try:
        client = chromadb.PersistentClient(path=DB_PATH)
        client.delete_collection(name=\"stock_news\")
        print(\"Successfully deleted stock_news collection from ChromaDB.\")
    except Exception as e:
        print(f\"Collection deletion note: {e}\")
' 2>/dev/null" || true
fi

# Remove persistent directory to guarantee clean slate
if [ -d "$CHROMA_DIR" ]; then
    rm -rf "$CHROMA_DIR"
    echo "Removed ChromaDB storage directory at $CHROMA_DIR."
fi

echo "ChromaDB has been completely cleared!"
