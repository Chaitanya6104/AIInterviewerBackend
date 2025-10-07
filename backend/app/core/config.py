"""
Configuration settings for the AI Interviewer application
"""

from pydantic_settings import BaseSettings
from typing import List, Union
import os
import json


class Settings(BaseSettings):
    """Application settings"""
    
    # App Configuration
    APP_NAME: str = "AI Interviewer"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql+psycopg://ai_interviewer_db_pli4_user:TCgNl6qoUeZqmoWNbjUlfdJUBGDjni0W@dpg-d3iff6pr0fns73cs4n6g-a/ai_interviewer_db_pli4"
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    WHISPER_MODEL: str = "whisper-1"
    
    # Pinecone Configuration
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = "us-west1-gcp"
    PINECONE_INDEX_NAME: str = "ai-interviewer"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://ai-interviewer-frontend.onrender.com",
        "https://your-frontend-url.onrender.com"
    ]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Handle ALLOWED_ORIGINS as comma-separated string
        if isinstance(self.ALLOWED_ORIGINS, str):
            self.ALLOWED_ORIGINS = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Interview Settings
    MAX_INTERVIEW_DURATION: int = 60  # minutes
    DEFAULT_QUESTION_COUNT: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
