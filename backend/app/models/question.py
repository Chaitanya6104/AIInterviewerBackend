"""
Question model for interview questions
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class QuestionType(str, enum.Enum):
    """Question type enumeration"""
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    SITUATIONAL = "situational"
    CULTURAL_FIT = "cultural_fit"
    PROBLEM_SOLVING = "problem_solving"


class QuestionDifficulty(str, enum.Enum):
    """Question difficulty enumeration"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Question(Base):
    """Question model for interview questions"""
    
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    difficulty = Column(Enum(QuestionDifficulty), nullable=False)
    
    # Foreign keys
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    
    # Question metadata
    role_focus = Column(String(100), nullable=True)  # AI, DevOps, PM, etc.
    skills_tested = Column(JSON, nullable=True)  # List of skills being tested
    expected_answer_points = Column(JSON, nullable=True)  # Key points to look for
    
    # AI-generated content
    ai_generated = Column(String(50), default="true")  # Whether AI generated this question
    generation_prompt = Column(Text, nullable=True)  # Prompt used to generate
    context_used = Column(JSON, nullable=True)  # Resume context used for generation
    
    # Question ordering and timing
    order_in_interview = Column(Integer, nullable=True)
    time_limit_minutes = Column(Integer, default=5)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="questions")
    responses = relationship("Response", back_populates="question")
    
    def __repr__(self):
        return f"<Question(id={self.id}, type='{self.question_type}', difficulty='{self.difficulty}')>"
