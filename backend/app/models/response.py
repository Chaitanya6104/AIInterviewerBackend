"""
Response model for candidate responses to interview questions
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Response(Base):
    """Response model for candidate responses"""
    
    __tablename__ = "responses"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    # Response content
    text_response = Column(Text, nullable=True)  # Text response
    audio_url = Column(String(500), nullable=True)  # Audio response URL
    response_duration_seconds = Column(Float, nullable=True)  # Time taken to respond
    
    # AI Analysis
    ai_analysis = Column(JSON, nullable=True)  # AI analysis of the response
    sentiment_score = Column(Float, nullable=True)  # Sentiment analysis score
    confidence_score = Column(Float, nullable=True)  # Confidence in response
    relevance_score = Column(Float, nullable=True)  # Relevance to question
    
    # Scoring
    score = Column(Float, nullable=True)  # Overall score for this response
    score_breakdown = Column(JSON, nullable=True)  # Detailed scoring breakdown
    feedback = Column(Text, nullable=True)  # AI-generated feedback for this response
    
    # Key insights
    key_points_mentioned = Column(JSON, nullable=True)  # Key points candidate mentioned
    missing_points = Column(JSON, nullable=True)  # Important points not mentioned
    strengths_identified = Column(JSON, nullable=True)  # Strengths shown in response
    areas_for_improvement = Column(JSON, nullable=True)  # Areas to improve
    
    # Follow-up suggestions
    follow_up_questions = Column(JSON, nullable=True)  # Suggested follow-up questions
    difficulty_adjustment = Column(String(50), nullable=True)  # Suggested difficulty adjustment
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="responses")
    question = relationship("Question", back_populates="responses")
    
    def __repr__(self):
        return f"<Response(id={self.id}, question_id={self.question_id}, score={self.score})>"
