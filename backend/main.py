from dotenv import load_dotenv
load_dotenv()

from typing import List, Optional
from typing import Annotated
import numpy as np
from fastapi import Depends, FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
from database import engine, get_db


app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

# The Astro dev server uses a proxy, so CORS is only needed if you call the API
# directly from the browser (e.g. PUBLIC_API_URL in production).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4321",
        "http://127.0.0.1:4321",
        "https://game-recommender.pages.dev",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# ---------- Response Models ----------
class GenreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class GameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    rating: Optional[int] = 0
    genres: List[GenreOut] = []
    tags: List[TagOut] = []


class RecommendationOut(GameOut):
    because_of: Optional[str] = None
    similarity: Optional[float] = None


class GameInput(BaseModel):
    title: str = Field(strip_whitespace=True, min_length=1, max_length=200)


# ---------- Helper ----------
def cosine_similarity(a, b) -> float:
    a = np.asarray(a, dtype=np.float32)
    b = np.asarray(b, dtype=np.float32)
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


# ---------- Endpoints ----------
@app.get("/")
def read_root():
    return {"message": "Game recommender API is running!"}


@app.get("/games", response_model=List[GameOut])
def get_games(db: Session = Depends(get_db)):
    return db.query(models.Game).limit(100).all()


@app.get("/games/search", response_model=List[GameOut])
def search_games(q: str, db: Session = Depends(get_db)):
    if not q or len(q) < 2:
        return []
    return db.query(models.Game).filter(
        models.Game.title.ilike(f"%{q}%")
    ).limit(8).all()


@app.post("/recommendations", response_model=List[RecommendationOut])
def get_recommendations(input_games: Annotated[List[GameInput], Body(min_length=1, max_length=20)], db: Session = Depends(get_db)):
    input_titles_lower = [g.title.lower() for g in input_games]
    played_games = db.query(models.Game).filter(
        func.lower(models.Game.title).in_(input_titles_lower)
    ).all()

    if not played_games:
        return []

    valid_embeddings = [g.embedding for g in played_games if g.embedding is not None]
    if not valid_embeddings:
        return []

    user_profile_vector = np.mean(valid_embeddings, axis=0).tolist()
    played_ids = [g.id for g in played_games]

    # Candidate generation via pgvector
    candidates = db.query(models.Game).filter(
        models.Game.id.notin_(played_ids),
        models.Game.embedding.isnot(None)
    ).order_by(
        models.Game.embedding.cosine_distance(user_profile_vector)
    ).limit(50).all()

    # User's tag profile
    user_tags = set()
    for pg in played_games:
        for t in pg.tags:
            user_tags.add(t.id)

    # Hybrid re-ranking
    scored_games = []
    for game in candidates:
        distance = np.linalg.norm(np.array(game.embedding) - np.array(user_profile_vector))
        embedding_score = 1 / (1 + distance)
        game_tags = {t.id for t in game.tags}
        shared_tags = len(user_tags.intersection(game_tags))
        tag_score = min(shared_tags / 5.0, 1.0)
        base_score = (0.7 * embedding_score) + (0.3 * tag_score)
        quality_multiplier = (game.rating / 100.0) if game.rating and game.rating > 0 else 0.7
        final_score = base_score * (0.5 + (0.5 * quality_multiplier))
        if final_score > 0:
            scored_games.append((final_score, game))

    scored_games.sort(key=lambda x: x[0], reverse=True)
    top_games = scored_games[:12]

    # Explainability: which played game triggered each recommendation
    recommendations = []
    for _score, game in top_games:
        best_match_title = None
        best_similarity = -1.0

        for played in played_games:
            if played.embedding is None:
                continue
            sim = cosine_similarity(game.embedding, played.embedding)
            if sim > best_similarity:
                best_similarity = sim
                best_match_title = played.title

        recommendations.append({
            "id": game.id,
            "title": game.title,
            "description": game.description,
            "cover_url": game.cover_url,
            "rating": game.rating,
            "genres": [{"id": g.id, "name": g.name} for g in game.genres],
            "tags": [{"id": t.id, "name": t.name} for t in game.tags],
            "because_of": best_match_title,
            "similarity": round(best_similarity, 3),
        })

    return recommendations