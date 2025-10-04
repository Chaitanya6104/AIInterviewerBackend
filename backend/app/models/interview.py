"""
Interview model for interview sessions
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class InterviewStatus(str, enum.Enum):
    """Interview status enumeration"""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class InterviewType(str, enum.Enum):
    """Interview type enumeration"""
    VOICE = "voice"
    TEXT = "text"
    MIXED = "mixed"


class Interview(Base):
    """Interview model for interview sessions"""
    
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Foreign keys
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    interviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Interview configuration
    interview_type = Column(Enum(InterviewType), default=InterviewType.MIXED)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.SCHEDULED)
    duration_minutes = Column(Integer, default=60)
    
    # Interview settings
    difficulty_level = Column(String(50), default="medium")  # easy, medium, hard
    question_count = Column(Integer, default=10)
    role_focus = Column(String(100), nullable=True)  # AI, DevOps, PM, etc.
    
    # Interview data
    transcript = Column(JSON, nullable=True)  # Full conversation transcript
    audio_url = Column(String(500), nullable=True)  # Recording URL
    notes = Column(Text, nullable=True)  # AI-generated notes
    
    # Scoring and feedback
    overall_score = Column(Float, nullable=True)
    scores_breakdown = Column(JSON, nullable=True)  # Detailed scoring
    feedback = Column(Text, nullable=True)  # AI-generated feedback
    strengths = Column(JSON, nullable=True)  # Identified strengths
    areas_for_improvement = Column(JSON, nullable=True)  # Areas to improve
    
    # Metadata
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    candidate = relationship("Candidate", back_populates="interviews")
    questions = relationship("Question", back_populates="interview")
    responses = relationship("Response", back_populates="interview")
    
    def __repr__(self):
        return f"<Interview(id={self.id}, title='{self.title}', status='{self.status}')>"
