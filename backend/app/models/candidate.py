"""
Candidate model for interview candidates
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Candidate(Base):
    """Candidate model for interview candidates"""
    
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Resume and profile information
    resume_url = Column(String(500), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    
    # Professional information
    current_position = Column(String(255), nullable=True)
    current_company = Column(String(255), nullable=True)
    experience_years = Column(Integer, nullable=True)
    skills = Column(JSON, nullable=True)  # List of skills
    education = Column(JSON, nullable=True)  # Education history
    work_experience = Column(JSON, nullable=True)  # Work experience
    
    # Resume analysis results
    resume_analysis = Column(JSON, nullable=True)
    extracted_skills = Column(JSON, nullable=True)
    experience_level = Column(String(50), nullable=True)  # junior, mid, senior
    target_roles = Column(JSON, nullable=True)  # List of target roles
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    interviews = relationship("Interview", back_populates="candidate")
    
    def __repr__(self):
        return f"<Candidate(id={self.id}, name='{self.full_name}', email='{self.email}')>"
