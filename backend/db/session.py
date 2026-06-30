import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DB_PATH = os.environ.get("HEALTH_DB_PATH", "health.db")
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db_session():
    return SessionLocal()

