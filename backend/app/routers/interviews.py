"""
Interviews router for interview management
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.interview import Interview, InterviewStatus, InterviewType
from app.models.candidate import Candidate
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


class InterviewCreate(BaseModel):
    title: str
    candidate_id: int
    description: Optional[str] = None
    interview_type: InterviewType = InterviewType.MIXED
    duration_minutes: int = 60
    difficulty_level: str = "medium"
    question_count: int = 10
    role_focus: Optional[str] = None


@router.post("/")
async def create_interview(
    interview_data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new interview"""
    # Check if candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == interview_data.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Create new interview
    interview = Interview(
        title=interview_data.title,
        description=interview_data.description,
        candidate_id=interview_data.candidate_id,
        interviewer_id=current_user.id,
        interview_type=interview_data.interview_type,
        duration_minutes=interview_data.duration_minutes,
        difficulty_level=interview_data.difficulty_level,
        question_count=interview_data.question_count,
        role_focus=interview_data.role_focus
    )
    
    db.add(interview)
    db.commit()
    db.refresh(interview)
    
    return {
        "message": "Interview created successfully",
        "data": {
            "id": interview.id,
            "title": interview.title,
            "description": interview.description,
            "candidate_id": interview.candidate_id,
            "interviewer_id": interview.interviewer_id,
            "interview_type": interview.interview_type,
            "status": interview.status,
            "duration_minutes": interview.duration_minutes,
            "difficulty_level": interview.difficulty_level,
            "question_count": interview.question_count,
            "role_focus": interview.role_focus,
            "created_at": interview.created_at
        }
    }


@router.get("/")
async def get_interviews(
    skip: int = 0,
    limit: int = 100,
    status: Optional[InterviewStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all interviews"""
    query = db.query(Interview)
    
    if status:
        query = query.filter(Interview.status == status)
    
    interviews = query.offset(skip).limit(limit).all()
    
    return {
        "interviews": [
            {
                "id": interview.id,
                "title": interview.title,
                "description": interview.description,
                "candidate_id": interview.candidate_id,
                "candidate": {
                    "id": interview.candidate.id,
                    "full_name": interview.candidate.full_name,
                    "email": interview.candidate.email,
                    "current_position": interview.candidate.current_position,
                    "current_company": interview.candidate.current_company
                } if interview.candidate else None,
                "interviewer_id": interview.interviewer_id,
                "interview_type": interview.interview_type,
                "status": interview.status,
                "duration_minutes": interview.duration_minutes,
                "difficulty_level": interview.difficulty_level,
                "question_count": interview.question_count,
                "role_focus": interview.role_focus,
                "overall_score": interview.overall_score,
                "created_at": interview.created_at,
                "started_at": interview.started_at,
                "completed_at": interview.completed_at
            }
            for interview in interviews
        ]
    }


@router.get("/{interview_id}")
async def get_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific interview"""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    return {
        "id": interview.id,
        "title": interview.title,
        "description": interview.description,
        "candidate_id": interview.candidate_id,
        "candidate": {
            "id": interview.candidate.id,
            "full_name": interview.candidate.full_name,
            "email": interview.candidate.email,
            "current_position": interview.candidate.current_position,
            "current_company": interview.candidate.current_company
        } if interview.candidate else None,
        "interviewer_id": interview.interviewer_id,
        "interview_type": interview.interview_type,
        "status": interview.status,
        "duration_minutes": interview.duration_minutes,
        "difficulty_level": interview.difficulty_level,
        "question_count": interview.question_count,
        "role_focus": interview.role_focus,
        "transcript": interview.transcript,
        "audio_url": interview.audio_url,
        "notes": interview.notes,
        "overall_score": interview.overall_score,
        "scores_breakdown": interview.scores_breakdown,
        "feedback": interview.feedback,
        "strengths": interview.strengths,
        "areas_for_improvement": interview.areas_for_improvement,
        "created_at": interview.created_at,
        "started_at": interview.started_at,
        "completed_at": interview.completed_at
    }


@router.post("/{interview_id}/start")
async def start_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start an interview"""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview.status != InterviewStatus.SCHEDULED:
        raise HTTPException(status_code=400, detail="Interview is not in scheduled status")
    
    # Update interview status
    interview.status = InterviewStatus.IN_PROGRESS
    interview.started_at = datetime.utcnow()
    
    db.commit()
    db.refresh(interview)
    
    return {
        "message": "Interview started successfully",
        "interview_id": interview.id,
        "status": interview.status,
        "started_at": interview.started_at
    }


class CompleteInterviewRequest(BaseModel):
    transcript: Optional[dict] = None
    notes: Optional[str] = None

@router.post("/{interview_id}/complete")
async def complete_interview(
    interview_id: int,
    request: CompleteInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Complete an interview and generate final analysis"""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Allow completion from any status except already completed
    if interview.status == InterviewStatus.COMPLETED:
        return {
            "message": "Interview already completed",
            "interview_id": interview.id,
            "status": interview.status,
            "completed_at": interview.completed_at
        }
    
    # Update interview status and data
    interview.status = InterviewStatus.COMPLETED
    interview.completed_at = datetime.utcnow()
    
    if request.transcript:
        interview.transcript = request.transcript
    if request.notes:
        interview.notes = request.notes
    
    db.commit()
    db.refresh(interview)
    
    # Generate final analysis and scoring
    try:
        from app.services.ai_service import AIService
        ai_service = AIService()
        
        print(f"🔄 Starting final analysis for interview {interview_id}")
        
        # Generate comprehensive final analysis
        final_analysis = await ai_service.generate_final_analysis(str(interview_id))
        
        print(f"✅ Final analysis completed for interview {interview_id}")
        print(f"📊 Analysis result: {final_analysis}")
        
        # Refresh interview to get updated scores
        db.refresh(interview)
        print(f"📊 Interview overall_score after analysis: {interview.overall_score}")
        
    except Exception as e:
        print(f"❌ Final analysis failed for interview {interview_id}: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        # Don't fail the completion if analysis fails
    
    return {
        "message": "Interview completed successfully",
        "interview_id": interview.id,
        "status": interview.status,
        "completed_at": interview.completed_at
    }


@router.post("/{interview_id}/cancel")
async def cancel_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel an interview"""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview.status == InterviewStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot cancel completed interview")
    
    # Update interview status
    interview.status = InterviewStatus.CANCELLED
    
    db.commit()
    db.refresh(interview)
    
    return {
        "message": "Interview cancelled successfully",
        "interview_id": interview.id,
        "status": interview.status
    }


@router.get("/{interview_id}/report")
async def get_interview_report(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get interview report with scoring and feedback"""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Generate analysis if interview is completed but has no scores
    if interview.status == InterviewStatus.COMPLETED and (not interview.overall_score or interview.overall_score == 0):
        try:
            from app.services.ai_service import AIService
            ai_service = AIService()
            
            # Generate comprehensive final analysis
            final_analysis = await ai_service.generate_final_analysis(str(interview_id))
            
            # Refresh interview data after analysis
            db.refresh(interview)
            
            print(f"✅ Generated missing analysis for interview {interview_id}")
            
        except Exception as e:
            print(f"❌ Failed to generate analysis for interview {interview_id}: {e}")
    
    # Get scores from Score table
    from app.models.score import Score
    score_record = db.query(Score).filter(Score.interview_id == interview_id).first()
    
    print(f"🔍 Debug report for interview {interview_id}:")
    print(f"   - Interview status: {interview.status}")
    print(f"   - Interview overall_score: {interview.overall_score}")
    print(f"   - Interview scores_breakdown: {interview.scores_breakdown}")
    print(f"   - Score record found: {score_record is not None}")
    
    if score_record:
        print(f"   - Score record overall_score: {score_record.overall_score}")
        print(f"   - Score record technical_score: {score_record.technical_score}")
        print(f"   - Score record communication_score: {score_record.communication_score}")
        print(f"   - Score record scores_breakdown: {score_record.scores_breakdown}")
    
    # Extract individual scores from Score table or fallback to interview scores_breakdown
    if score_record:
        scores_breakdown = score_record.scores_breakdown or {}
        overall_score = score_record.overall_score or 0
        technical_score = score_record.technical_score or 0
        communication_score = score_record.communication_score or 0
        problem_solving_score = score_record.problem_solving_score or 0
        cultural_fit_score = score_record.cultural_fit_score or 0
        feedback = score_record.interview_feedback.get('detailed_feedback', '') if score_record.interview_feedback else "No feedback available"
        strengths = score_record.analysis_summary.get('strengths', []) if score_record.analysis_summary else []
        areas_for_improvement = score_record.analysis_summary.get('areas_for_improvement', []) if score_record.analysis_summary else []
        print(f"   - Using Score record data")
        
        # If Score record has individual scores as 0, try to get from interview scores_breakdown
        if technical_score == 0 and communication_score == 0 and interview.scores_breakdown:
            print(f"   - Score record has 0 scores, falling back to interview.scores_breakdown")
            interview_breakdown = interview.scores_breakdown or {}
            technical_score = interview_breakdown.get('technical', 0)
            communication_score = interview_breakdown.get('communication', 0)
            problem_solving_score = interview_breakdown.get('problem_solving', 0)
            cultural_fit_score = interview_breakdown.get('cultural_fit', 0)
            # Also use the detailed_breakdown if available
            if 'detailed_breakdown' in interview_breakdown:
                scores_breakdown = interview_breakdown.get('detailed_breakdown', {})
            else:
                scores_breakdown = interview_breakdown
            print(f"   - Retrieved scores from interview: tech={technical_score}, comm={communication_score}")
    else:
        # Fallback to interview scores_breakdown
        scores_breakdown = interview.scores_breakdown or {}
        overall_score = interview.overall_score or 0
        technical_score = scores_breakdown.get('technical', 0)
        communication_score = scores_breakdown.get('communication', 0)
        problem_solving_score = scores_breakdown.get('problem_solving', 0)
        cultural_fit_score = scores_breakdown.get('cultural_fit', 0)
        feedback = interview.feedback or "No feedback available"
        strengths = interview.strengths or []
        areas_for_improvement = interview.areas_for_improvement or []
        print(f"   - Using Interview fallback data")
    
    print(f"   - Final scores: overall={overall_score}, technical={technical_score}, communication={communication_score}")
    print(f"   - Final scores_breakdown: {scores_breakdown}")
    
    # Calculate scores from individual responses if no scores exist
    if overall_score == 0 and not score_record:
        from app.models.response import Response
        responses = db.query(Response).filter(Response.interview_id == interview_id).all()
        
        if responses:
            total_score = 0
            response_count = 0
            
            for response in responses:
                if response.score and response.score > 0:
                    total_score += response.score
                    response_count += 1
            
            if response_count > 0:
                overall_score = (total_score / response_count) * 10  # Convert to 0-100 scale
                # Update interview with calculated score
                interview.overall_score = overall_score
                db.commit()
                db.refresh(interview)
    
    return {
        "interview_id": interview.id,
        "title": interview.title,
        "candidate_id": interview.candidate_id,
        "overall_score": overall_score,
        "scores_breakdown": scores_breakdown,
        "technical_score": technical_score,
        "communication_score": communication_score,
        "problem_solving_score": problem_solving_score,
        "cultural_fit_score": cultural_fit_score,
        "feedback": feedback,
        "strengths": strengths,
        "areas_for_improvement": areas_for_improvement,
        "transcript": interview.transcript,
        "notes": interview.notes,
        "completed_at": interview.completed_at
    }
