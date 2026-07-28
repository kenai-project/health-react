import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# Database URL — supports PostgreSQL via DATABASE_URL, falls back to SQLite
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    engine = create_engine(DATABASE_URL, echo=False, future=True)
    DB_PATH = DATABASE_URL
else:
    DB_PATH = os.environ.get("HEALTH_DB_PATH", "health.db")
    engine = create_engine(f"sqlite:///{DB_PATH}", echo=False, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db_session():
    return SessionLocal()

