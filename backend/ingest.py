import os
import requests
from dotenv import load_dotenv
from database import SessionLocal, engine, Base
import models

load_dotenv()
API_KEY = os.getenv("RAWG_API_KEY")

# Make sure tables exist
Base.metadata.create_all(bind=engine)

def fetch_and_save_games():
    db = SessionLocal()
    try:
        # Fetch top 20 games from RAWG
        url = f"https://api.rawg.io/api/games?key={API_KEY}&page_size=20"
        response = requests.get(url)
        data = response.json()

        for game_data in data.get("results", []):
            # Check if game already exists
            existing = db.query(models.Game).filter(models.Game.igdb_id == game_data["id"]).first()
            if existing:
                continue

            # Create new game record
            new_game = models.Game(
                title=game_data["name"],
                description="No description yet", # RAWG list endpoint doesn't return full description
                cover_url=game_data.get("background_image"),
                igdb_id=game_data["id"] # Using RAWG id for now
            )
            db.add(new_game)
        
        db.commit()
        print(f"Successfully added games to the database!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fetch_and_save_games()