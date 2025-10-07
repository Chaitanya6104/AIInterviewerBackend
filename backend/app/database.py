"""
Database configuration and models for AI Interviewer
"""

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import asyncio

# Database engine
print(f"DEBUG: Original DATABASE_URL = {settings.DATABASE_URL}")

# Convert postgresql:// to postgresql+psycopg:// to use psycopg driver
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    print(f"DEBUG: Converted DATABASE_URL = {database_url}")
else:
    print(f"DEBUG: DATABASE_URL already uses psycopg driver")

print(f"DEBUG: Using psycopg driver for PostgreSQL")

engine = create_engine(
    database_url,
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
