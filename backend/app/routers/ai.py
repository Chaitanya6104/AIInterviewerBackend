"""
AI router for AI-powered interview features
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import json
import os
import tempfile
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.ai_service import AIService
from app.services.pinecone_service import PineconeService
from app.services.tts_service import tts_service

router = APIRouter()


class ResponseAnalyzeRequest(BaseModel):
    interview_id: int
    question_id: int
    response_text: str


class FeedbackGenerateRequest(BaseModel):
    interview_id: int


class ScoreInterviewRequest(BaseModel):
    interview_id: int


class StoreResponseRequest(BaseModel):
    interview_id: int
    question_id: int
    response_text: str
    response_duration_seconds: Optional[float] = None
    audio_url: Optional[str] = None


class StoreQuestionsRequest(BaseModel):
    interview_id: int
    questions: List[dict]


@router.post("/analyze-resume")
async def analyze_resume(
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze resume and extract candidate information using AI"""
    try:
        resume_text = request.get("resume_text", "")
        role_focus = request.get("role_focus", "General")
        
        if not resume_text:
            raise HTTPException(status_code=400, detail="Resume text is required")
        
        ai_service = AIService()
        
        # Create AI prompt for resume analysis
        prompt = f"""
        Analyze the following resume and extract candidate information. 
        Role focus: {role_focus}
        
        Resume text:
        {resume_text}
        
        Extract and return a JSON object with the following fields:
        - full_name: string
        - email: string  
        - phone: string
        - current_position: string
        - current_company: string
        - experience_years: number
        - skills: array of strings
        - bio: string (brief professional summary)
        - summary: string (detailed professional summary)
        - education: array of objects with degree, institution, year
        - work_experience: array of objects with company, position, duration, description
        - certifications: array of strings
        - languages: array of strings
        
        Return only valid JSON, no additional text.
        """
        
        # Use AI service to analyze resume
        analysis = await ai_service.analyze_resume_text(resume_text, role_focus)
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")


class QuestionGenerateRequest(BaseModel):
    candidate_id: int
    role_focus: str
    difficulty: str = "medium"
    question_count: int = 10


@router.post("/generate-questions")
async def generate_questions(
    request: QuestionGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate interview questions based on candidate profile"""
    try:
        ai_service = AIService()
        
        # Get candidate information
        from app.models.candidate import Candidate
        candidate = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Generate questions based on candidate profile
        questions = await ai_service.generate_questions_from_resume(
            resume_text=f"Name: {candidate.full_name}, Position: {candidate.current_position}, Skills: {candidate.skills}",
            role_focus=request.role_focus
        )
        
        return {
            "message": "Questions generated successfully",
            "data": {
                "questions": questions,
                "candidate_id": request.candidate_id,
                "role_focus": request.role_focus,
                "difficulty": request.difficulty,
                "question_count": len(questions)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")


@router.post("/analyze-response")
async def analyze_response(
    request: ResponseAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze candidate response to a question"""
    try:
        ai_service = AIService()
        
        # Analyze the response
        analysis = await ai_service.analyze_response(request.interview_id, request.response_text)
        
        return {
            "message": "Response analyzed successfully",
            "data": {
                "analysis": analysis,
                "interview_id": request.interview_id,
                "question_id": request.question_id
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Response analysis failed: {str(e)}")


@router.post("/transcribe-audio")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Transcribe audio file using Whisper"""
    try:
        ai_service = AIService()
        
        # Read audio file
        audio_content = await audio_file.read()
        
        # Convert to base64 for processing
        import base64
        audio_base64 = base64.b64encode(audio_content).decode('utf-8')
        
        # Transcribe using AI service
        transcription = await ai_service.transcribe_audio(audio_base64)
        
        return {
            "message": "Audio transcribed successfully",
            "transcription": transcription,
            "file_name": audio_file.filename,
            "file_size": len(audio_content)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio transcription failed: {str(e)}")


@router.post("/generate-feedback")
async def generate_feedback(
    request: FeedbackGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate comprehensive interview feedback"""
    try:
        ai_service = AIService()
        
        # Get interview data
        from app.models.interview import Interview
        interview = db.query(Interview).filter(Interview.id == request.interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Generate feedback using AI
        feedback = await ai_service.generate_final_analysis(request.interview_id)
        
        return {
            "message": "Feedback generated successfully",
            "data": {
                "feedback": feedback,
                "interview_id": request.interview_id
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback generation failed: {str(e)}")


@router.post("/score-interview")
async def score_interview(
    request: ScoreInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Score an interview using AI"""
    try:
        ai_service = AIService()
        
        # Get interview data
        from app.models.interview import Interview
        interview = db.query(Interview).filter(Interview.id == request.interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Generate scoring using AI
        scoring = await ai_service.generate_final_analysis(request.interview_id)
        
        return {
            "message": "Interview scored successfully",
            "data": {
                "scoring": scoring,
                "interview_id": request.interview_id
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interview scoring failed: {str(e)}")


@router.post("/store-response")
async def store_response(
    request: StoreResponseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Store individual candidate response with AI analysis"""
    try:
        ai_service = AIService()
        
        # Get question context for better analysis
        from app.models.question import Question
        question = db.query(Question).filter(Question.id == request.question_id).first()
        question_context = question.content if question else None
        
        # Get interview context for role focus
        from app.models.interview import Interview
        interview = db.query(Interview).filter(Interview.id == request.interview_id).first()
        role_focus = interview.role_focus if interview else None
        
        # Analyze the response with context
        analysis = await ai_service.analyze_response(
            request.interview_id, 
            request.response_text, 
            question_context, 
            role_focus
        )
        
        # Create response record
        from app.models.response import Response
        response_record = Response(
            interview_id=request.interview_id,
            question_id=request.question_id,
            text_response=request.response_text,
            response_duration_seconds=request.response_duration_seconds,
            audio_url=request.audio_url,
            ai_analysis=analysis,
            sentiment_score=analysis.get('sentiment_score', 0.5),
            confidence_score=analysis.get('confidence_score', 0.5),
            relevance_score=analysis.get('relevance_score', 0.5),
            score=analysis.get('overall_score', 5),
            score_breakdown=analysis,
            feedback=analysis.get('feedback', ''),
            key_points_mentioned=analysis.get('key_points_mentioned', []),
            missing_points=analysis.get('missing_points', []),
            strengths_identified=analysis.get('strengths_identified', []),
            areas_for_improvement=analysis.get('areas_for_improvement', [])
        )
        
        db.add(response_record)
        db.commit()
        db.refresh(response_record)
        
        return {
            "message": "Response stored successfully",
            "data": {
                "response_id": response_record.id,
                "analysis": analysis,
                "score": response_record.score
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Response storage failed: {str(e)}")


@router.post("/store-questions")
async def store_questions(
    request: StoreQuestionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Store questions for an interview in the database"""
    try:
        from app.models.question import Question, QuestionType, QuestionDifficulty
        
        # Verify interview exists
        from app.models.interview import Interview
        interview = db.query(Interview).filter(Interview.id == request.interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        stored_questions = []
        
        for i, question_data in enumerate(request.questions):
            # Create question record
            question = Question(
                interview_id=request.interview_id,
                content=question_data.get('question', ''),
                question_type=QuestionType(question_data.get('question_type', 'behavioral')),
                difficulty=QuestionDifficulty(question_data.get('difficulty', 'medium')),
                role_focus=interview.role_focus,
                skills_tested=question_data.get('skills_tested', []),
                expected_answer_points=question_data.get('expected_answer_points', []),
                ai_generated="true",
                order_in_interview=i + 1,
                time_limit_minutes=5
            )
            
            db.add(question)
            db.flush()  # Get the ID without committing
            
            stored_questions.append({
                "id": question.id,
                "question": question.content,
                "question_type": question.question_type.value,
                "difficulty": question.difficulty.value,
                "skills_tested": question.skills_tested,
                "expected_answer_points": question.expected_answer_points,
                "order_in_interview": question.order_in_interview
            })
        
        db.commit()
        
        return {
            "message": "Questions stored successfully",
            "data": {
                "questions": stored_questions,
                "interview_id": request.interview_id,
                "count": len(stored_questions)
            }
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Question storage failed: {str(e)}")


@router.get("/debug-interview/{interview_id}")
async def debug_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user)
):
    """Debug endpoint to inspect interview data"""
    try:
        from app.database import get_db
        from app.models.interview import Interview
        from app.models.response import Response
        from app.models.question import Question
        from app.models.candidate import Candidate
        
        db = next(get_db())
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        responses = db.query(Response).filter(Response.interview_id == interview_id).all()
        questions = db.query(Question).filter(Question.interview_id == interview_id).all()
        candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
        
        return {
            "interview": {
                "id": interview.id,
                "title": interview.title,
                "status": interview.status,
                "role_focus": interview.role_focus,
                "overall_score": interview.overall_score,
                "scores_breakdown": interview.scores_breakdown,
                "feedback": interview.feedback
            },
            "candidate": {
                "id": candidate.id if candidate else None,
                "name": candidate.full_name if candidate else None,
                "position": candidate.current_position if candidate else None
            },
            "responses": [
                {
                    "id": r.id,
                    "question_id": r.question_id,
                    "text_response": r.text_response,
                    "score": r.score,
                    "ai_analysis": r.ai_analysis,
                    "feedback": r.feedback
                } for r in responses
            ],
            "questions": [
                {
                    "id": q.id,
                    "content": q.content,
                    "question_type": q.question_type,
                    "difficulty": q.difficulty
                } for q in questions
            ],
            "counts": {
                "responses": len(responses),
                "questions": len(questions)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debug failed: {str(e)}")

@router.post("/create-scores/{interview_id}")
async def create_scores(
    interview_id: int,
    current_user: User = Depends(get_current_user)
):
    """Create Score records for existing interviews"""
    try:
        from app.database import get_db
        from app.models.interview import Interview
        from app.models.score import Score
        
        db = next(get_db())
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Check if score already exists
        existing_score = db.query(Score).filter(Score.interview_id == interview_id).first()
        if existing_score:
            return {
                "message": "Score record already exists",
                "data": {
                    "interview_id": interview_id,
                    "overall_score": existing_score.overall_score,
                    "technical_score": existing_score.technical_score,
                    "communication_score": existing_score.communication_score,
                    "problem_solving_score": existing_score.problem_solving_score,
                    "cultural_fit_score": existing_score.cultural_fit_score
                }
            }
        
        # Calculate detailed scores from individual responses if not available
        from app.models.response import Response
        responses = db.query(Response).filter(Response.interview_id == interview_id).all()
        
        # Initialize scores
        technical_score = 0
        communication_score = 0
        problem_solving_score = 0
        cultural_fit_score = 0
        relevance_score = 0
        experience_score = 0
        response_count = 0
        
        # Calculate scores from individual responses
        for response in responses:
            if response.text_response:
                content = response.text_response.lower()
                word_count = len(content.split())
                
                # Technical score based on technical keywords
                if any(word in content for word in ['data', 'analysis', 'python', 'sql', 'visualization', 'statistics', 'machine learning', 'algorithm']):
                    technical_score += 7.0
                else:
                    technical_score += 5.0
                
                # Communication score based on response length and clarity
                if word_count > 20:
                    communication_score += 7.0
                elif word_count > 10:
                    communication_score += 6.0
                else:
                    communication_score += 5.0
                
                # Problem solving based on structured responses
                if any(word in content for word in ['step', 'process', 'approach', 'solution', 'method']):
                    problem_solving_score += 7.0
                else:
                    problem_solving_score += 5.0
                
                # Cultural fit based on collaboration mentions
                if any(word in content for word in ['team', 'collaborate', 'work together', 'help', 'support']):
                    cultural_fit_score += 7.0
                elif any(word in content for word in ['project', 'work', 'experience', 'learn', 'develop']):
                    cultural_fit_score += 6.0  # Professional engagement
                else:
                    cultural_fit_score += 5.0
                
                # Relevance score based on how well response addresses the question
                if any(word in content for word in ['because', 'therefore', 'however', 'specifically', 'example', 'instance']):
                    relevance_score += 7.0  # Shows direct addressing of question
                elif word_count > 15:  # Substantial response
                    relevance_score += 6.0
                else:
                    relevance_score += 5.0
                
                # Experience score based on professional/academic experience mentions
                if any(word in content for word in ['internship', 'project', 'work', 'experience', 'previous', 'before', 'studied', 'learned']):
                    experience_score += 7.0
                elif any(word in content for word in ['course', 'class', 'training', 'certification']):
                    experience_score += 6.0
                else:
                    experience_score += 5.0
                
                response_count += 1
        
        # Calculate average scores (convert to 0-100 scale)
        if response_count > 0:
            technical_score = (technical_score / response_count) * 10  # Convert to 0-100 scale
            communication_score = (communication_score / response_count) * 10  # Convert to 0-100 scale
            problem_solving_score = (problem_solving_score / response_count) * 10  # Convert to 0-100 scale
            cultural_fit_score = (cultural_fit_score / response_count) * 10  # Convert to 0-100 scale
            relevance_score = (relevance_score / response_count) * 10  # Convert to 0-100 scale
            experience_score = (experience_score / response_count) * 10  # Convert to 0-100 scale
        else:
            # Use interview scores if available, otherwise default to 0
            technical_score = interview.scores_breakdown.get('technical', 0) if interview.scores_breakdown else 0
            communication_score = interview.scores_breakdown.get('communication', 0) if interview.scores_breakdown else 0
            problem_solving_score = interview.scores_breakdown.get('problem_solving', 0) if interview.scores_breakdown else 0
            cultural_fit_score = interview.scores_breakdown.get('cultural_fit', 0) if interview.scores_breakdown else 0
            relevance_score = 0
            experience_score = 0
        
        # Create score record
        new_score = Score(
            interview_id=interview_id,
            overall_score=interview.overall_score or 0,
            communication_score=communication_score,
            technical_score=technical_score,
            problem_solving_score=problem_solving_score,
            cultural_fit_score=cultural_fit_score,
            scores_breakdown={
                'technical': technical_score,
                'communication': communication_score,
                'problem_solving': problem_solving_score,
                'cultural_fit': cultural_fit_score,
                'detailed_breakdown': {
                    'technical_accuracy': technical_score,
                    'communication_clarity': communication_score,
                    'problem_solving_approach': problem_solving_score,
                    'relevance_to_questions': relevance_score,
                    'professional_experience': experience_score
                }
            },
            ai_confidence=0.8,
            analysis_summary={
                'strengths': interview.strengths or [],
                'areas_for_improvement': interview.areas_for_improvement or []
            },
            hire_recommendation='no_hire',
            next_steps=[],
            interview_feedback={
                'detailed_feedback': interview.feedback or 'No feedback available'
            }
        )
        
        db.add(new_score)
        db.commit()
        db.refresh(new_score)
        
        return {
            "message": "Score record created successfully",
            "data": {
                "interview_id": interview_id,
                "overall_score": new_score.overall_score,
                "technical_score": new_score.technical_score,
                "communication_score": new_score.communication_score,
                "problem_solving_score": new_score.problem_solving_score,
                "cultural_fit_score": new_score.cultural_fit_score
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Score creation failed: {str(e)}")

@router.post("/regenerate-analysis/{interview_id}")
async def regenerate_analysis(
    interview_id: int,
    current_user: User = Depends(get_current_user)
):
    """Regenerate analysis for an existing interview"""
    try:
        from app.database import get_db
        from app.models.interview import Interview
        
        db = next(get_db())
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        ai_service = AIService()
        
        # Generate comprehensive final analysis
        final_analysis = await ai_service.generate_final_analysis(str(interview_id))
        
        # Refresh interview data after analysis
        db.refresh(interview)
        
        return {
            "message": "Analysis regenerated successfully",
            "data": {
                "interview_id": interview_id,
                "overall_score": interview.overall_score,
                "scores_breakdown": interview.scores_breakdown,
                "feedback": interview.feedback,
                "analysis": final_analysis
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis regeneration failed: {str(e)}")

@router.post("/generate-adaptive-question")
async def generate_adaptive_question(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Generate adaptive follow-up question based on previous response"""
    try:
        ai_service = AIService()
        
        # Extract request parameters
        interview_id = request.get('interview_id')
        previous_response = request.get('previous_response')
        question_context = request.get('question_context')
        role_focus = request.get('role_focus', 'General')
        difficulty = request.get('difficulty', 'medium')
        
        if not all([interview_id, previous_response, question_context]):
            raise HTTPException(status_code=400, detail="Missing required parameters")
        
        # Generate adaptive question
        adaptive_question = await ai_service.generate_adaptive_question(
            interview_id, 
            previous_response, 
            question_context, 
            role_focus, 
            difficulty
        )
        
        return {
            "message": "Adaptive question generated successfully",
            "data": {
                "question": adaptive_question,
                "interview_id": interview_id
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Adaptive question generation failed: {str(e)}")

@router.get("/export-pdf/{interview_id}")
async def export_interview_pdf(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export interview report as PDF"""
    try:
        from app.models.interview import Interview
        from app.models.response import Response
        from app.models.candidate import Candidate
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        
        # Get interview data
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        responses = db.query(Response).filter(Response.interview_id == interview_id).all()
        candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
        
        # Create PDF
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        doc = SimpleDocTemplate(temp_file.name, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center
        )
        story.append(Paragraph("AI Interview Report", title_style))
        story.append(Spacer(1, 20))
        
        # Interview Details
        story.append(Paragraph("Interview Details", styles['Heading2']))
        details_data = [
            ['Interview ID:', str(interview.id)],
            ['Candidate:', candidate.full_name if candidate else 'Unknown'],
            ['Role Focus:', interview.role_focus or 'General'],
            ['Difficulty:', interview.difficulty_level or 'Medium'],
            ['Status:', interview.status.value if interview.status else 'Unknown'],
            ['Completed At:', interview.completed_at.strftime('%Y-%m-%d %H:%M:%S') if interview.completed_at else 'Not completed']
        ]
        
        details_table = Table(details_data, colWidths=[2*inch, 4*inch])
        details_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(details_table)
        story.append(Spacer(1, 20))
        
        # Scoring Summary
        if interview.overall_score is not None:
            story.append(Paragraph("Scoring Summary", styles['Heading2']))
            scores_data = [
                ['Overall Score:', f"{interview.overall_score:.1f}/100"],
                ['Communication:', f"{interview.scores_breakdown.get('communication', 0):.1f}/100" if interview.scores_breakdown else 'N/A'],
                ['Technical:', f"{interview.scores_breakdown.get('technical', 0):.1f}/100" if interview.scores_breakdown else 'N/A'],
                ['Problem Solving:', f"{interview.scores_breakdown.get('problem_solving', 0):.1f}/100" if interview.scores_breakdown else 'N/A'],
                ['Cultural Fit:', f"{interview.scores_breakdown.get('cultural_fit', 0):.1f}/100" if interview.scores_breakdown else 'N/A']
            ]
            
            scores_table = Table(scores_data, colWidths=[2*inch, 2*inch])
            scores_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(scores_table)
            story.append(Spacer(1, 20))
        
        # Individual Responses
        if responses:
            story.append(Paragraph("Interview Responses", styles['Heading2']))
            for i, response in enumerate(responses, 1):
                story.append(Paragraph(f"Question {i}", styles['Heading3']))
                story.append(Paragraph(f"Response: {response.text_response}", styles['Normal']))
                if response.score:
                    story.append(Paragraph(f"Score: {response.score}/10", styles['Normal']))
                if response.feedback:
                    story.append(Paragraph(f"Feedback: {response.feedback}", styles['Normal']))
                story.append(Spacer(1, 12))
        
        # Overall Feedback
        if interview.feedback:
            story.append(Paragraph("Overall Feedback", styles['Heading2']))
            story.append(Paragraph(interview.feedback, styles['Normal']))
            story.append(Spacer(1, 20))
        
        # Build PDF
        doc.build(story)
        
        return FileResponse(
            temp_file.name,
            media_type='application/pdf',
            filename=f'interview_report_{interview_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF export failed: {str(e)}")


@router.get("/question-bank")
async def get_question_bank(
    role_focus: str,
    difficulty: str = "medium",
    question_type: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get question bank for specific role and difficulty using AI"""
    try:
        ai_service = AIService()
        
        # Generate questions using AI
        questions = await ai_service.generate_questions_from_resume(
            resume_text=f"Role: {role_focus}, Difficulty: {difficulty}",
            role_focus=role_focus
        )
        
        # Filter by question type if specified
        if question_type:
            questions = [q for q in questions if q.get("question_type") == question_type]
        
        # Limit results
        questions = questions[:limit]
        
        return {
            "message": "Question bank retrieved successfully",
            "questions": questions,
            "role_focus": role_focus,
            "difficulty": difficulty,
            "question_type": question_type,
            "count": len(questions)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question bank retrieval failed: {str(e)}")


# TTS Models
class TTSRequest(BaseModel):
    text: str
    lang: str = 'en'
    slow: bool = False
    tld: str = 'com'


class TTSResponse(BaseModel):
    audio_data: str
    format: str
    cached: bool
    text: str
    lang: str
    slow: bool
    size_bytes: Optional[int] = None


@router.post("/text-to-speech", response_model=TTSResponse)
async def text_to_speech(
    request: TTSRequest,
    current_user: User = Depends(get_current_user)
):
    """Convert text to speech using gTTS"""
    try:
        result = await tts_service.text_to_speech(
            text=request.text,
            lang=request.lang,
            slow=request.slow,
            tld=request.tld
        )
        
        return TTSResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


@router.get("/tts/voices")
async def get_available_voices(
    current_user: User = Depends(get_current_user)
):
    """Get available TTS voices and languages"""
    try:
        voices = await TTSService.get_available_voices()
        return voices
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get voices: {str(e)}")


@router.get("/tts/cache/stats")
async def get_tts_cache_stats(
    current_user: User = Depends(get_current_user)
):
    """Get TTS cache statistics"""
    try:
        stats = tts_service.get_cache_stats()
        return stats
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cache stats: {str(e)}")


@router.delete("/tts/cache")
async def clear_tts_cache(
    current_user: User = Depends(get_current_user)
):
    """Clear TTS cache"""
    try:
        tts_service.clear_cache()
        return {"message": "TTS cache cleared successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")


@router.post("/extract-pdf-text")
async def extract_pdf_text(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Extract text from PDF file"""
    try:
        print(f"PDF extraction request received for file: {file.filename}")
        
        # Check file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            print(f"Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Read file content
        content = await file.read()
        print(f"File content read, size: {len(content)} bytes")
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file received")
        
        # Extract text using PyPDF2
        import PyPDF2
        import io
        
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            print(f"PDF reader created, pages: {len(pdf_reader.pages)}")
            
            text = ""
            for i, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    text += page_text + "\n"
                    print(f"Page {i+1} text extracted, length: {len(page_text)}")
                except Exception as page_error:
                    print(f"Error extracting text from page {i+1}: {page_error}")
                    continue
            
            text = text.strip()
            print(f"Total text extracted, length: {len(text)}")
            
            if not text:
                raise HTTPException(status_code=400, detail="No text could be extracted from the PDF file")
            
            return {
                "message": "PDF text extracted successfully",
                "text": text,
                "pages": len(pdf_reader.pages),
                "size": len(content)
            }
            
        except Exception as pdf_error:
            print(f"PyPDF2 error: {pdf_error}")
            raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(pdf_error)}")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in PDF extraction: {e}")
        raise HTTPException(status_code=500, detail=f"PDF text extraction failed: {str(e)}")
