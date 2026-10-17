from sqlalchemy import Column, Integer, String, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from pgvector.sqlalchemy import Vector

# 1. Association table for Many-to-Many: Games <-> Genres
game_genres = Table(
    'game_genres', Base.metadata,
    Column('game_id', Integer, ForeignKey('games.id'), primary_key=True),
    Column('genre_id', Integer, ForeignKey('genres.id'), primary_key=True)
)

# 2. Association table for Many-to-Many: Games <-> Tags
game_tags = Table(
    'game_tags', Base.metadata,
    Column('game_id', Integer, ForeignKey('games.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

# 3. The Game Model
class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    cover_url = Column(String)
    igdb_id = Column(Integer, unique=True, index=True)
    rating = Column(Integer, default=0)
    embedding = Column(Vector(384)) 
    genres = relationship("Genre", secondary=game_genres, back_populates="games")
    tags = relationship("Tag", secondary=game_tags, back_populates="games")

# 4. The Genre Model
class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    games = relationship("Game", secondary=game_genres, back_populates="genres")

# 5. The Tag Model
class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    games = relationship("Game", secondary=game_tags, back_populates="tags")