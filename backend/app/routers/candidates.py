"""
Candidates router for candidate management
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import json

from app.database import get_db
from app.models.candidate import Candidate
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.ai_service import AIService

router = APIRouter()


class CandidateCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None


@router.post("/")
async def create_candidate(
    candidate_data: CandidateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new candidate"""
    # Check if candidate already exists
    if db.query(Candidate).filter(Candidate.email == candidate_data.email).first():
        raise HTTPException(
            status_code=400,
            detail="Candidate with this email already exists"
        )
    
    # Create new candidate
    candidate = Candidate(
        full_name=candidate_data.full_name,
        email=candidate_data.email,
        phone=candidate_data.phone,
        current_position=candidate_data.current_position,
        current_company=candidate_data.current_company,
        experience_years=candidate_data.experience_years,
        skills=candidate_data.skills or []
    )
    
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    return {
        "message": "Candidate created successfully",
        "data": {
            "candidate_id": candidate.id,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "current_position": candidate.current_position,
            "current_company": candidate.current_company,
            "experience_years": candidate.experience_years,
            "skills": candidate.skills
        }
    }


@router.get("/")
async def get_candidates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all candidates"""
    candidates = db.query(Candidate).offset(skip).limit(limit).all()
    
    return {
        "candidates": [
            {
                "id": candidate.id,
                "full_name": candidate.full_name,
                "email": candidate.email,
                "phone": candidate.phone,
                "current_position": candidate.current_position,
                "current_company": candidate.current_company,
                "experience_years": candidate.experience_years,
                "skills": candidate.skills,
                "created_at": candidate.created_at
            }
            for candidate in candidates
        ]
    }


@router.get("/{candidate_id}")
async def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific candidate"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return {
        "id": candidate.id,
        "full_name": candidate.full_name,
        "email": candidate.email,
        "phone": candidate.phone,
        "current_position": candidate.current_position,
        "current_company": candidate.current_company,
        "experience_years": candidate.experience_years,
        "skills": candidate.skills,
        "education": candidate.education,
        "work_experience": candidate.work_experience,
        "resume_analysis": candidate.resume_analysis,
        "extracted_skills": candidate.extracted_skills,
        "experience_level": candidate.experience_level,
        "target_roles": candidate.target_roles,
        "created_at": candidate.created_at
    }


@router.post("/{candidate_id}/upload-resume")
async def upload_resume(
    candidate_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and analyze resume for a candidate"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Check file type
    if not file.filename.endswith(('.pdf', '.doc', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF, DOC, and DOCX files are allowed")
    
    try:
        # Read file content
        content = await file.read()
        
        # Save file (in production, use cloud storage)
        import os
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/resume_{candidate_id}_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Update candidate with resume URL
        candidate.resume_url = file_path
        db.commit()
        
        # Analyze resume using AI (simplified for now)
        ai_service = AIService()
        # In a real implementation, you would extract text from the resume file
        # and then analyze it using the AI service
        
        return {
            "message": "Resume uploaded successfully",
            "file_path": file_path
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume upload failed: {str(e)}")


class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None


@router.put("/{candidate_id}")
async def update_candidate(
    candidate_id: int,
    candidate_data: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update candidate information"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Update fields if provided
    if candidate_data.full_name is not None:
        candidate.full_name = candidate_data.full_name
    if candidate_data.phone is not None:
        candidate.phone = candidate_data.phone
    if candidate_data.current_position is not None:
        candidate.current_position = candidate_data.current_position
    if candidate_data.current_company is not None:
        candidate.current_company = candidate_data.current_company
    if candidate_data.experience_years is not None:
        candidate.experience_years = candidate_data.experience_years
    if candidate_data.skills is not None:
        candidate.skills = candidate_data.skills
    
    db.commit()
    db.refresh(candidate)
    
    return {
        "message": "Candidate updated successfully",
        "candidate": {
            "id": candidate.id,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "current_position": candidate.current_position,
            "current_company": candidate.current_company,
            "experience_years": candidate.experience_years,
            "skills": candidate.skills
        }
    }


@router.delete("/{candidate_id}")
async def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a candidate"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    db.delete(candidate)
    db.commit()
    
    return {"message": "Candidate deleted successfully"}
