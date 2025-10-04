"""
Score model for detailed interview scoring
"""

from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Score(Base):
    """Score model for detailed interview scoring"""
    
    __tablename__ = "scores"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    
    # Overall scoring
    overall_score = Column(Float, nullable=False)  # 0-100 scale
    communication_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    problem_solving_score = Column(Float, nullable=True)
    cultural_fit_score = Column(Float, nullable=True)
    
    # Detailed scoring breakdown
    scores_breakdown = Column(JSON, nullable=True)  # Detailed category scores
    
    # AI Analysis
    ai_confidence = Column(Float, nullable=True)  # AI confidence in scoring
    analysis_summary = Column(JSON, nullable=True)  # Summary of AI analysis
    
    # Recommendations
    hire_recommendation = Column(String(50), nullable=True)  # strong_hire, hire, no_hire
    next_steps = Column(JSON, nullable=True)  # Recommended next steps
    interview_feedback = Column(JSON, nullable=True)  # Feedback for interviewer
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview")
    
    def __repr__(self):
        return f"<Score(id={self.id}, interview_id={self.interview_id}, overall_score={self.overall_score})>"
