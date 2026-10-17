import os
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"

import transformers
transformers.logging.disable_progress_bar()

print("Step 1: Importing SentenceTransformer...")
from sentence_transformers import SentenceTransformer
print("Step 2: Import successful.")

print("Step 3: Loading model...")
model = SentenceTransformer('all-MiniLM-L6-v2', local_files_only=True)
print("Step 4: Model loaded successfully.")
print("Model dimension:", model.get_sentence_embedding_dimension())