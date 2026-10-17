from sentence_transformers import SentenceTransformer
from database import get_db
import models

# Load the model (it will download automatically the first time)
print("Loading embedding model...")
model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_all_embeddings():
    db = get_db()
    try:
        games = db.query(models.Game).filter(models.Game.embedding.is_(None)).all()
        
        if not games:
            print("All games already have embeddings. Nothing to do.")
            return

        print(f"Generating embeddings for {len(games)} games...")
        
        for i, game in enumerate(games):
            # Combine title, description, genres, and tags into one rich text block
            genre_names = ", ".join([g.name for g in game.genres])
            tag_names = ", ".join([t.name for t in game.tags])
            
            text_to_embed = f"{game.title}. {game.description}. Genres: {genre_names}. Tags: {tag_names}"
            
            # Generate the vector
            vector = model.encode(text_to_embed).tolist()
            
            # Save it to the game record
            game.embedding = vector
            
            if (i + 1) % 20 == 0:
                print(f"  Processed {i + 1}/{len(games)}...")
                db.commit()

        db.commit()
        print("Successfully generated all embeddings!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_all_embeddings()