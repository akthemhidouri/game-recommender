from sqlalchemy import Column, Integer, String, Text
from database import Base

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    cover_url = Column(String)
    igdb_id = Column(Integer, unique=True, index=True)