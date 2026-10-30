import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing from .env")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=2,
    max_overflow=3,
    pool_timeout=10,
    connect_args={"connect_timeout": 10},
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def test_connection():
    with engine.connect() as connection:
        return connection.execute(
            text("SELECT 1")
        ).scalar_one()


def create_tables():
    from app.db.base import Base
    import app.models  # Register all models

    Base.metadata.create_all(bind=engine)

