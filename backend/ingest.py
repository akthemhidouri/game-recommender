import os
import requests
from dotenv import load_dotenv
from database import SessionLocal, engine, Base
import models

load_dotenv()
API_KEY = os.getenv("RAWG_API_KEY")

Base.metadata.create_all(bind=engine)

def fetch_and_save_games():
    db = SessionLocal()
    try:
        # Fetch 4 pages (40 games each = 160 games total)
        for page in range(1, 5):
            print(f"Fetching page {page}...")
            url = f"https://api.rawg.io/api/games?key={API_KEY}&page_size=40&page={page}"
            response = requests.get(url)
            data = response.json()

            for game_data in data.get("results", []):
                # Check if game already exists
                existing = db.query(models.Game).filter(models.Game.igdb_id == game_data["id"]).first()
                if existing:
                    continue

                metacritic = game_data.get("metacritic")
                if not metacritic:
                    # Fallback: RAWG user rating (0-5) converted to a 100 scale
                    metacritic = int((game_data.get("rating") or 0) * 20)

                # Create new game
                new_game = models.Game(
                    title=game_data["name"],
                    description="Fetching details...", 
                    cover_url=game_data.get("background_image"),
                    igdb_id=game_data["id"],
                    rating=metacritic,
                )
                db.add(new_game)
                db.commit() 

                # Fetch detailed info (including genres) for this specific game
                detail_url = f"https://api.rawg.io/api/games/{game_data['id']}?key={API_KEY}"
                detail_res = requests.get(detail_url).json()
                
                # Process Genres
                for genre_data in detail_res.get("genres", []):
                    genre_name = genre_data["name"]
                    
                    genre = db.query(models.Genre).filter(models.Genre.name == genre_name).first()
                    if not genre:
                        genre = models.Genre(name=genre_name)
                        db.add(genre)
                        db.commit()
                    
                    new_game.genres.append(genre)
                
                db.commit()
                print(f"Added: {new_game.title}")

        print("Successfully finished fetching games!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fetch_and_save_games()