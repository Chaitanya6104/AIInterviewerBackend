"""
Database configuration and models for AI Interviewer
"""

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import asyncio

# Database engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Metadata
metadata = MetaData()


async def init_db():
    """Initialize database tables"""
    try:
        # Import all models here to ensure they're registered
        from app.models import user, candidate, interview, question, response, score
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
