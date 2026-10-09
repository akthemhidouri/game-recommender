from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models
from database import engine, get_db

# Create the tables in the database
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Game recommender API is running!"}

@app.get("/games")
def get_games(db: Session = Depends(get_db)):
    games = db.query(models.Game).all()
    return games