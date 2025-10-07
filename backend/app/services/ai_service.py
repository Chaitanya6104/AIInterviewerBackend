"""
AI Service for handling OpenAI interactions and interview logic
"""

import openai
from typing import Dict, List, Any, Optional
import json
import base64
from app.core.config import settings
from app.services.pinecone_service import PineconeService


class AIService:
    """Service for AI-powered interview functionality"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.pinecone_service = PineconeService()
    
    async def transcribe_audio(self, audio_data: str) -> str:
        """Transcribe audio data using OpenAI Whisper"""
        try:
            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)
            
            # Create temporary file for transcription
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(audio_bytes)
                temp_file.flush()
                
                # Transcribe using Whisper
                with open(temp_file.name, "rb") as audio_file:
                    transcription = self.client.audio.transcriptions.create(
                        model=settings.WHISPER_MODEL,
                        file=audio_file,
                        response_format="text"
                    )
                
                return transcription.strip()
        
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            raise Exception(f"Transcription failed: {str(e)}")
    
    async def analyze_response(self, interview_id: str, response_text: str, question_context: str = None, role_focus: str = None) -> Dict[str, Any]:
        """Analyze candidate response using GPT-4o with comprehensive scoring"""
        try:
            # Get interview context for better analysis
            from app.database import get_db
            from app.models.interview import Interview
            from app.models.question import Question
            
            db = next(get_db())
            interview = db.query(Interview).filter(Interview.id == interview_id).first()
            
            if not question_context and interview:
                # Get the current question context
                questions = db.query(Question).filter(Question.interview_id == interview_id).all()
                if questions:
                    question_context = questions[-1].content if questions else "General interview question"
            
            role_focus = role_focus or (interview.role_focus if interview else "General")
            
            prompt = f"""
            You are an expert interview analyst. Analyze this candidate response comprehensively.
            
            Interview Context:
            - Role Focus: {role_focus}
            - Question: {question_context or "General interview question"}
            - Response: "{response_text}"
            
            Evaluate the response on multiple dimensions and provide detailed scoring:
            
            1. Technical Accuracy (0-10): How technically correct and accurate is the response?
            2. Communication Clarity (0-10): How clear and well-structured is the communication?
            3. Depth of Knowledge (0-10): How deep and comprehensive is the knowledge demonstrated?
            4. Problem-Solving Approach (0-10): How logical and effective is the problem-solving approach?
            5. Relevance to Question (0-10): How well does the response address the specific question?
            6. Professional Experience (0-10): How well does the response demonstrate relevant experience?
            
            Provide analysis in valid JSON format only:
            {{
                "technical_accuracy": 8.5,
                "communication_clarity": 7.0,
                "depth_of_knowledge": 6.5,
                "problem_solving_approach": 8.0,
                "relevance_to_question": 9.0,
                "professional_experience": 7.5,
                "overall_score": 7.6,
                "sentiment_score": 0.8,
                "confidence_score": 0.7,
                "relevance_score": 0.9,
                "key_points_mentioned": ["specific technical concepts", "relevant experience", "problem-solving approach"],
                "missing_points": ["specific examples", "quantifiable results"],
                "strengths_identified": ["strong technical knowledge", "clear communication"],
                "areas_for_improvement": ["provide more examples", "quantify achievements"],
                "feedback": "Detailed feedback about the response quality and suggestions for improvement",
                "difficulty_recommendation": "same",
                "follow_up_suggestions": ["Ask for specific examples", "Dive deeper into technical details"]
            }}
            
            Scoring Guidelines:
            - 9-10: Exceptional response, exceeds expectations
            - 7-8: Good response, meets expectations
            - 5-6: Average response, partially meets expectations
            - 3-4: Below average response, needs improvement
            - 1-2: Poor response, significantly below expectations
            - 0: No response or completely irrelevant
            
            Do not include any text before or after the JSON. Only return the JSON object.
            """
            
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert interview analyst. Provide detailed, objective analysis of candidate responses. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Lower temperature for more consistent results
                max_tokens=1000  # Limit response length for faster processing
            )
            
            analysis_text = response.choices[0].message.content.strip()
            print(f"🔍 AI Response: {analysis_text}")
            
            # Try to parse JSON, with fallback if it fails
            try:
                analysis = json.loads(analysis_text)
                
                # Validate and normalize the response
                if 'overall_score' not in analysis:
                    # Calculate overall score from individual scores
                    scores = [
                        analysis.get('technical_accuracy', 0),
                        analysis.get('communication_clarity', 0),
                        analysis.get('depth_of_knowledge', 0),
                        analysis.get('problem_solving_approach', 0),
                        analysis.get('relevance_to_question', 0),
                        analysis.get('professional_experience', 0)
                    ]
                    analysis['overall_score'] = sum(scores) / len(scores) if scores else 0
                
                return analysis
                
            except json.JSONDecodeError as json_error:
                print(f"❌ JSON parsing failed: {json_error}")
                print(f"❌ Raw response: {analysis_text}")
                
                # Try to extract JSON from the response if it's wrapped in text
                import re
                json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
                if json_match:
                    try:
                        analysis = json.loads(json_match.group())
                        # Validate and normalize
                        if 'overall_score' not in analysis:
                            scores = [
                                analysis.get('technical_accuracy', 0),
                                analysis.get('communication_clarity', 0),
                                analysis.get('depth_of_knowledge', 0),
                                analysis.get('problem_solving_approach', 0),
                                analysis.get('relevance_to_question', 0),
                                analysis.get('professional_experience', 0)
                            ]
                            analysis['overall_score'] = sum(scores) / len(scores) if scores else 0
                        return analysis
                    except json.JSONDecodeError:
                        pass
                
                # Return default structure if all parsing fails
                raise json_error
        
        except Exception as e:
            print(f"❌ Response analysis error: {e}")
            return {
                "technical_accuracy": 5.0,
                "communication_clarity": 5.0,
                "depth_of_knowledge": 5.0,
                "problem_solving_approach": 5.0,
                "relevance_to_question": 5.0,
                "professional_experience": 5.0,
                "overall_score": 5.0,
                "sentiment_score": 0.5,
                "confidence_score": 0.5,
                "relevance_score": 0.5,
                "key_points_mentioned": [],
                "missing_points": [],
                "strengths_identified": [],
                "areas_for_improvement": [],
                "feedback": "Unable to analyze response due to technical error",
                "difficulty_recommendation": "same",
                "follow_up_suggestions": []
            }
    
    async def generate_next_action(self, interview_id: str, response_text: str, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate next action based on response analysis"""
        try:
            prompt = f"""
            Based on this candidate response and analysis, determine the next action:
            
            Response: "{response_text}"
            Analysis: {json.dumps(analysis, indent=2)}
            
            Provide next action in JSON format with:
            - action_type ("next_question", "follow_up", "clarification", "move_on")
            - content (question or instruction)
            - difficulty_adjustment ("easier", "same", "harder")
            - reasoning (why this action was chosen)
            """
            
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert interviewer. Generate appropriate follow-up actions based on candidate responses."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4
            )
            
            action_text = response.choices[0].message.content
            return json.loads(action_text)
        
        except Exception as e:
            print(f"❌ Next action generation error: {e}")
            return {
                "action_type": "next_question",
                "content": "Thank you for that response. Let's move on to the next question.",
                "difficulty_adjustment": "same",
                "reasoning": "Default action due to processing error"
            }
    
    async def initialize_interview(self, interview_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize interview session with AI"""
        try:
            candidate_info = data.get("candidate_info", {})
            role_focus = data.get("role_focus", "general")
            difficulty = data.get("difficulty", "medium")
            
            # Generate opening question
            prompt = f"""
            Generate an opening interview question for a {role_focus} role at {difficulty} difficulty level.
            
            Candidate info: {json.dumps(candidate_info, indent=2)}
            
            Provide in JSON format:
            - question (the opening question)
            - question_type ("behavioral", "technical", "situational")
            - difficulty ("easy", "medium", "hard")
            - skills_tested (list of skills)
            - expected_answer_points (list of key points to look for)
            """
            
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert interviewer. Generate engaging, relevant opening questions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5
            )
            
            question_data = json.loads(response.choices[0].message.content)
            
            return {
                "interview_id": interview_id,
                "status": "initialized",
                "opening_question": question_data,
                "interview_settings": {
                    "role_focus": role_focus,
                    "difficulty": difficulty,
                    "estimated_duration": "45-60 minutes"
                }
            }
        
        except Exception as e:
            print(f"❌ Interview initialization error: {e}")
            raise Exception(f"Interview initialization failed: {str(e)}")
    
    async def generate_final_analysis(self, interview_id: str) -> Dict[str, Any]:
        """Generate comprehensive final interview analysis and scoring using OpenAI"""
        try:
            # Get interview data and responses from database
            from app.database import get_db
            from app.models.interview import Interview
            from app.models.response import Response
            from app.models.question import Question
            from app.models.candidate import Candidate
            
            db = next(get_db())
            interview = db.query(Interview).filter(Interview.id == int(interview_id)).first()
            if not interview:
                raise Exception(f"Interview {interview_id} not found")
            
            responses = db.query(Response).filter(Response.interview_id == int(interview_id)).all()
            questions = db.query(Question).filter(Question.interview_id == int(interview_id)).all()
            candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
            
            print(f"🔍 Final analysis for interview {interview_id}:")
            print(f"   - Found {len(responses)} responses")
            print(f"   - Found {len(questions)} questions")
            print(f"   - Candidate: {candidate.full_name if candidate else 'Unknown'}")
            
            # Debug: Print response details
            for i, response in enumerate(responses):
                print(f"   - Response {i+1}: ID={response.id}, Question ID={response.question_id}")
                print(f"     Text: {response.text_response[:100]}...")
                print(f"     AI Analysis: {bool(response.ai_analysis)}")
                print(f"     Score: {response.score}")
            
            # Build comprehensive conversation context with detailed scoring
            conversation_context = ""
            total_technical_score = 0
            total_communication_score = 0
            total_problem_solving_score = 0
            total_relevance_score = 0
            total_experience_score = 0
            response_count = 0
            
            detailed_scores = []
            
            for i, response in enumerate(responses):
                question = next((q for q in questions if q.id == response.question_id), None)
                if question:
                    # Get AI analysis from response, or generate it if missing
                    ai_analysis = response.ai_analysis or {}
                    
                    # If no AI analysis exists, generate it now (but only if we have substantial content)
                    if not ai_analysis or not ai_analysis.get('overall_score'):
                        if response.text_response and len(response.text_response.strip()) > 10:
                            print(f"🔄 Generating missing analysis for response {response.id}")
                            try:
                                ai_analysis = await self.analyze_response(
                                    interview_id, 
                                    response.text_response, 
                                    question.content, 
                                    interview.role_focus
                                )
                                
                                # Update the response with the new analysis
                                response.ai_analysis = ai_analysis
                                response.score = ai_analysis.get('overall_score', 5)
                                response.feedback = ai_analysis.get('feedback', '')
                                db.commit()
                                print(f"✅ Generated and stored analysis for response {response.id}")
                                
                            except Exception as e:
                                print(f"❌ Failed to generate analysis for response {response.id}: {e}")
                                # Use default analysis if generation fails
                                ai_analysis = {
                                    'technical_accuracy': 5.0,
                                    'communication_clarity': 5.0,
                                    'depth_of_knowledge': 5.0,
                                    'problem_solving_approach': 5.0,
                                    'relevance_to_question': 5.0,
                                    'professional_experience': 5.0,
                                    'overall_score': 5.0,
                                    'feedback': 'Analysis pending'
                                }
                        else:
                            print(f"⚠️ Skipping analysis for response {response.id} - insufficient content")
                            # Use default analysis for short responses
                            ai_analysis = {
                                'technical_accuracy': 4.0,
                                'communication_clarity': 4.0,
                                'depth_of_knowledge': 4.0,
                                'problem_solving_approach': 4.0,
                                'relevance_to_question': 4.0,
                                'professional_experience': 4.0,
                                'overall_score': 4.0,
                                'feedback': 'Short response - limited analysis possible'
                            }
                    
                    conversation_context += f"Question {i+1}: {question.content}\n"
                    conversation_context += f"Answer: {response.text_response}\n"
                    conversation_context += f"Technical Accuracy: {ai_analysis.get('technical_accuracy', 0)}/10\n"
                    conversation_context += f"Communication Clarity: {ai_analysis.get('communication_clarity', 0)}/10\n"
                    conversation_context += f"Problem Solving: {ai_analysis.get('problem_solving_approach', 0)}/10\n"
                    conversation_context += f"Relevance: {ai_analysis.get('relevance_to_question', 0)}/10\n"
                    conversation_context += f"Experience: {ai_analysis.get('professional_experience', 0)}/10\n"
                    conversation_context += f"Overall Score: {ai_analysis.get('overall_score', 0)}/10\n"
                    conversation_context += f"Feedback: {ai_analysis.get('feedback', 'No feedback')}\n\n"
                    
                    # Accumulate scores for averaging - include all responses with analysis
                    if ai_analysis:
                        technical_score = ai_analysis.get('technical_accuracy', 0)
                        communication_score = ai_analysis.get('communication_clarity', 0)
                        problem_solving_score = ai_analysis.get('problem_solving_approach', 0)
                        relevance_score = ai_analysis.get('relevance_to_question', 0)
                        experience_score = ai_analysis.get('professional_experience', 0)
                        overall_score = ai_analysis.get('overall_score', 0)
                        
                        print(f"   📊 Response {i+1} scores: Technical={technical_score}, Communication={communication_score}, Problem Solving={problem_solving_score}, Relevance={relevance_score}, Experience={experience_score}, Overall={overall_score}")
                        
                        # Always accumulate scores, even if they are 0 (they might be legitimate 0 scores)
                        total_technical_score += technical_score
                        total_communication_score += communication_score
                        total_problem_solving_score += problem_solving_score
                        total_relevance_score += relevance_score
                        total_experience_score += experience_score
                        response_count += 1
                        
                        detailed_scores.append({
                            'question': question.content,
                            'response': response.text_response,
                            'scores': ai_analysis
                        })
            
            # Calculate average scores (convert from 0-10 to 0-100 scale)
            print(f"📊 Score calculation: response_count={response_count}")
            print(f"📊 Total scores: technical={total_technical_score}, communication={total_communication_score}, problem_solving={total_problem_solving_score}, relevance={total_relevance_score}, experience={total_experience_score}")
            
            avg_technical = ((total_technical_score / response_count) * 10) if response_count > 0 else 0
            avg_communication = ((total_communication_score / response_count) * 10) if response_count > 0 else 0
            avg_problem_solving = ((total_problem_solving_score / response_count) * 10) if response_count > 0 else 0
            avg_relevance = ((total_relevance_score / response_count) * 10) if response_count > 0 else 0
            avg_experience = ((total_experience_score / response_count) * 10) if response_count > 0 else 0
            overall_average = (avg_technical + avg_communication + avg_problem_solving + avg_relevance + avg_experience) / 5
            
            print(f"📊 Calculated averages: technical={avg_technical:.1f}, communication={avg_communication:.1f}, problem_solving={avg_problem_solving:.1f}, relevance={avg_relevance:.1f}, experience={avg_experience:.1f}, overall={overall_average:.1f}")
            
            # If no responses were analyzed, try to generate scores from existing responses
            if response_count == 0 and len(responses) > 0:
                print(f"⚠️ No analyzed responses found, generating scores from {len(responses)} responses")
                
                # Generate basic scores from response content
                total_technical = 0
                total_communication = 0
                total_problem_solving = 0
                total_cultural_fit = 0
                total_relevance = 0
                total_experience = 0
                fallback_response_count = 0
                
                for response in responses:
                    if response.text_response:
                        content = response.text_response.lower()
                        word_count = len(content.split())
                        
                        # Basic scoring based on content analysis
                        technical_score = 5.0  # Base score
                        if any(word in content for word in ['data', 'analysis', 'python', 'sql', 'visualization', 'statistics', 'machine learning', 'algorithm']):
                            technical_score = 7.0
                        
                        communication_score = 5.0  # Base score
                        if word_count > 20:
                            communication_score = 7.0
                        elif word_count > 10:
                            communication_score = 6.0
                        
                        problem_solving_score = 5.0  # Base score
                        if any(word in content for word in ['step', 'process', 'approach', 'solution', 'method']):
                            problem_solving_score = 7.0
                        
                        cultural_fit_score = 5.0  # Base score
                        if any(word in content for word in ['team', 'collaborate', 'work together', 'help', 'support']):
                            cultural_fit_score = 7.0
                        elif any(word in content for word in ['project', 'work', 'experience', 'learn', 'develop']):
                            cultural_fit_score = 6.0  # Professional engagement
                        
                        # Relevance score based on how well response addresses the question
                        relevance_score = 5.0  # Base score
                        if any(word in content for word in ['because', 'therefore', 'however', 'specifically', 'example', 'instance']):
                            relevance_score = 7.0  # Shows direct addressing of question
                        elif word_count > 15:  # Substantial response
                            relevance_score = 6.0
                        
                        # Experience score based on professional/academic experience mentions
                        experience_score = 5.0  # Base score
                        if any(word in content for word in ['internship', 'project', 'work', 'experience', 'previous', 'before', 'studied', 'learned']):
                            experience_score = 7.0
                        elif any(word in content for word in ['course', 'class', 'training', 'certification']):
                            experience_score = 6.0
                        
                        total_technical += technical_score
                        total_communication += communication_score
                        total_problem_solving += problem_solving_score
                        total_cultural_fit += cultural_fit_score
                        total_relevance += relevance_score
                        total_experience += experience_score
                        fallback_response_count += 1
                
                if fallback_response_count > 0:
                    avg_technical = (total_technical / fallback_response_count) * 10  # Convert to 0-100 scale
                    avg_communication = (total_communication / fallback_response_count) * 10  # Convert to 0-100 scale
                    avg_problem_solving = (total_problem_solving / fallback_response_count) * 10  # Convert to 0-100 scale
                    avg_cultural_fit = (total_cultural_fit / fallback_response_count) * 10  # Convert to 0-100 scale
                    avg_relevance = (total_relevance / fallback_response_count) * 10  # Convert to 0-100 scale
                    avg_experience = (total_experience / fallback_response_count) * 10  # Convert to 0-100 scale
                    overall_average = (avg_technical + avg_communication + avg_problem_solving + avg_cultural_fit + avg_relevance + avg_experience) / 6
                    
                    # Update the analysis variables
                    total_technical_score = total_technical
                    total_communication_score = total_communication
                    total_problem_solving_score = total_problem_solving
                    total_relevance_score = total_relevance
                    total_experience_score = total_experience
                    response_count = fallback_response_count
                    
                    print(f"✅ Generated basic scores: Technical={avg_technical:.1f}, Communication={avg_communication:.1f}, Problem Solving={avg_problem_solving:.1f}, Cultural Fit={avg_cultural_fit:.1f}, Relevance={avg_relevance:.1f}, Experience={avg_experience:.1f}")
            
            # If still no responses, return default analysis
            if response_count == 0:
                print(f"⚠️ No responses found for interview {interview_id}")
                return {
                    "interview_id": interview_id,
                    "status": "completed",
                    "analysis": {
                        "overall_score": 0,
                        "communication_score": 0,
                        "technical_score": 0,
                        "problem_solving_score": 0,
                        "cultural_fit_score": 0,
                        "professional_experience_score": 0,
                        "strengths": [],
                        "areas_for_improvement": ["No responses provided"],
                        "hire_recommendation": "no_hire",
                        "confidence_level": 0.0,
                        "detailed_feedback": "The candidate did not provide any responses during the interview, resulting in a complete lack of assessment across all evaluation criteria.",
                        "next_steps": ["Request candidate to retake the interview"],
                        "interview_insights": {
                            "best_response": "No responses provided",
                            "weakest_response": "No responses provided",
                            "consistency": "Unable to assess",
                            "growth_potential": "Unable to assess"
                        },
                        "role_specific_assessment": "Unable to assess candidate fit due to lack of responses"
                    },
                    "generated_at": "2024-01-01T00:00:00Z"
                }
            
            # Ensure we have minimum scores even if they are very low
            if avg_technical == 0 and avg_communication == 0 and avg_problem_solving == 0:
                print(f"⚠️ All scores are 0, applying minimum baseline scores")
                avg_technical = max(avg_technical, 30.0)  # Minimum 30% for any response
                avg_communication = max(avg_communication, 30.0)
                avg_problem_solving = max(avg_problem_solving, 30.0)
                avg_relevance = max(avg_relevance, 30.0)
                avg_experience = max(avg_experience, 30.0)
                overall_average = (avg_technical + avg_communication + avg_problem_solving + avg_relevance + avg_experience) / 5
                print(f"📊 Applied baseline scores: technical={avg_technical:.1f}, communication={avg_communication:.1f}, problem_solving={avg_problem_solving:.1f}, relevance={avg_relevance:.1f}, experience={avg_experience:.1f}, overall={overall_average:.1f}")
            
            # Get candidate background for context
            candidate_background = ""
            if candidate:
                candidate_background = f"""
                Candidate Background:
                - Name: {candidate.full_name}
                - Current Position: {candidate.current_position or 'Not specified'}
                - Current Company: {candidate.current_company or 'Not specified'}
                - Experience: {candidate.experience_years or 0} years
                - Skills: {', '.join(candidate.skills) if candidate.skills else 'Not specified'}
                """
            
            prompt = f"""
            You are an expert interview analyst. Analyze this complete interview and provide comprehensive scoring and feedback.
            
            Interview Details:
            - Role Focus: {interview.role_focus or 'General'}
            - Difficulty Level: {interview.difficulty_level or 'Medium'}
            - Interview Type: {interview.interview_type or 'Mixed'}
            - Duration: {interview.duration_minutes or 30} minutes
            - Total Questions: {len(questions)}
            - Total Responses: {len(responses)}
            
            {candidate_background}
            
            Detailed Conversation Analysis:
            {conversation_context}
            
            Calculated Average Scores:
            - Technical Accuracy: {avg_technical:.1f}/100
            - Communication Clarity: {avg_communication:.1f}/100
            - Problem Solving: {avg_problem_solving:.1f}/100
            - Relevance: {avg_relevance:.1f}/100
            - Professional Experience: {avg_experience:.1f}/100
            - Overall Average: {overall_average:.1f}/100
            
            Based on this comprehensive analysis, provide detailed evaluation in valid JSON format. 
            IMPORTANT: You MUST return ONLY valid JSON with the exact field names specified below. 
            Do not include any text before or after the JSON. All scores must be numbers (0-100).
            {{
                "overall_score": {overall_average:.1f},
                "communication_score": {avg_communication:.1f},
                "technical_score": {avg_technical:.1f},
                "problem_solving_score": {avg_problem_solving:.1f},
                "cultural_fit_score": {avg_relevance:.1f},
                "professional_experience_score": {avg_experience:.1f},
                "detailed_scores_breakdown": {{
                    "technical_accuracy": {avg_technical:.1f},
                    "communication_clarity": {avg_communication:.1f},
                    "problem_solving_approach": {avg_problem_solving:.1f},
                    "relevance_to_questions": {avg_relevance:.1f},
                    "professional_experience": {avg_experience:.1f}
                }},
                "strengths": ["List 3-5 key strengths demonstrated"],
                "areas_for_improvement": ["List 3-5 areas needing improvement"],
                "hire_recommendation": "strong_hire|hire|no_hire",
                "confidence_level": 0.85,
                "detailed_feedback": "Comprehensive 2-3 paragraph feedback about the candidate's overall performance, highlighting key strengths and areas for improvement",
                "next_steps": ["Specific recommended next steps for the hiring process"],
                "interview_insights": {{
                    "best_response": "Which response was the strongest and why",
                    "weakest_response": "Which response was the weakest and why",
                    "consistency": "How consistent was the candidate's performance",
                    "growth_potential": "Assessment of the candidate's growth potential"
                }},
                "role_specific_assessment": "How well the candidate fits the specific role requirements"
            }}
            
            Scoring Guidelines (0-100 scale):
            - 90-100: Exceptional, exceeds expectations
            - 70-89: Good, meets expectations
            - 50-69: Average, partially meets expectations
            - 30-49: Below average, needs improvement
            - 10-29: Poor, significantly below expectations
            - 0-9: No response or completely irrelevant
            
            Do not include any text before or after the JSON. Only return the JSON object.
            """
            
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert interview analyst. Provide comprehensive, objective analysis and scoring."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Lower temperature for more consistent results
                max_tokens=1500  # Limit response length for faster processing
            )
            
            analysis_text = response.choices[0].message.content.strip()
            
            # Try to extract JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
                if json_match:
                    analysis = json.loads(json_match.group())
                else:
                    analysis = json.loads(analysis_text)
                
                print(f"✅ Parsed analysis response: {analysis}")
                print(f"📊 Analysis keys: {list(analysis.keys())}")
                print(f"📊 Overall score: {analysis.get('overall_score', 'NOT_FOUND')}")
                print(f"📊 Technical score: {analysis.get('technical_score', 'NOT_FOUND')}")
                print(f"📊 Communication score: {analysis.get('communication_score', 'NOT_FOUND')}")
                
            except json.JSONDecodeError as json_error:
                print(f"❌ JSON parsing error: {json_error}")
                print(f"Raw response: {analysis_text}")
                raise Exception(f"Failed to parse AI response as JSON: {json_error}")
            
            # Update interview with comprehensive analysis results
            interview.overall_score = analysis.get('overall_score', 0)
            interview.scores_breakdown = {
                'communication': analysis.get('communication_score', 0),
                'technical': analysis.get('technical_score', 0),
                'problem_solving': analysis.get('problem_solving_score', 0),
                'cultural_fit': analysis.get('cultural_fit_score', 0),
                'professional_experience': analysis.get('professional_experience_score', 0),
                'detailed_breakdown': analysis.get('detailed_scores_breakdown', {})
            }
            interview.feedback = analysis.get('detailed_feedback', '')
            interview.strengths = analysis.get('strengths', [])
            interview.areas_for_improvement = analysis.get('areas_for_improvement', [])
            
            # Create or update Score record
            from app.models.score import Score
            existing_score = db.query(Score).filter(Score.interview_id == interview_id).first()
            
            if existing_score:
                # Update existing score
                existing_score.overall_score = analysis.get('overall_score', 0)
                existing_score.communication_score = analysis.get('communication_score', 0)
                existing_score.technical_score = analysis.get('technical_score', 0)
                existing_score.problem_solving_score = analysis.get('problem_solving_score', 0)
                existing_score.cultural_fit_score = analysis.get('cultural_fit_score', 0)
                existing_score.scores_breakdown = analysis.get('detailed_scores_breakdown', {})
                existing_score.ai_confidence = analysis.get('confidence_level', 0.8)
                existing_score.analysis_summary = {
                    'strengths': analysis.get('strengths', []),
                    'areas_for_improvement': analysis.get('areas_for_improvement', []),
                    'interview_insights': analysis.get('interview_insights', {}),
                    'role_specific_assessment': analysis.get('role_specific_assessment', '')
                }
                existing_score.hire_recommendation = analysis.get('hire_recommendation', 'no_hire')
                existing_score.next_steps = analysis.get('next_steps', [])
                existing_score.interview_feedback = {
                    'detailed_feedback': analysis.get('detailed_feedback', ''),
                    'overall_assessment': analysis.get('overall_assessment', '')
                }
            else:
                # Create new score record
                print(f"📊 Creating new Score record with values:")
                print(f"   - overall_score: {analysis.get('overall_score', 0)}")
                print(f"   - communication_score: {analysis.get('communication_score', 0)}")
                print(f"   - technical_score: {analysis.get('technical_score', 0)}")
                print(f"   - problem_solving_score: {analysis.get('problem_solving_score', 0)}")
                print(f"   - cultural_fit_score: {analysis.get('cultural_fit_score', 0)}")
                print(f"   - scores_breakdown: {analysis.get('detailed_scores_breakdown', {})}")
                
                new_score = Score(
                    interview_id=int(interview_id),
                    overall_score=analysis.get('overall_score', 0),
                    communication_score=analysis.get('communication_score', 0),
                    technical_score=analysis.get('technical_score', 0),
                    problem_solving_score=analysis.get('problem_solving_score', 0),
                    cultural_fit_score=analysis.get('cultural_fit_score', 0),
                    scores_breakdown=analysis.get('detailed_scores_breakdown', {}),
                    ai_confidence=analysis.get('confidence_level', 0.8),
                    analysis_summary={
                        'strengths': analysis.get('strengths', []),
                        'areas_for_improvement': analysis.get('areas_for_improvement', []),
                        'interview_insights': analysis.get('interview_insights', {}),
                        'role_specific_assessment': analysis.get('role_specific_assessment', '')
                    },
                    hire_recommendation=analysis.get('hire_recommendation', 'no_hire'),
                    next_steps=analysis.get('next_steps', []),
                    interview_feedback={
                        'detailed_feedback': analysis.get('detailed_feedback', ''),
                        'overall_assessment': analysis.get('overall_assessment', '')
                    }
                )
                db.add(new_score)
                print(f"✅ New Score record created and added to database")
            
            # Store additional analysis data
            interview.notes = json.dumps({
                'hire_recommendation': analysis.get('hire_recommendation', 'no_hire'),
                'confidence_level': analysis.get('confidence_level', 0.5),
                'next_steps': analysis.get('next_steps', []),
                'interview_insights': analysis.get('interview_insights', {}),
                'role_specific_assessment': analysis.get('role_specific_assessment', ''),
                'detailed_scores': detailed_scores
            })
            
            db.commit()
            db.refresh(interview)
            
            return {
                "interview_id": interview_id,
                "status": "completed",
                "analysis": analysis,
                "generated_at": "2024-01-01T00:00:00Z"
            }
        
        except Exception as e:
            print(f"❌ Final analysis error: {e}")
            raise Exception(f"Final analysis failed: {str(e)}")
    
    async def analyze_resume_text(self, resume_text: str, role_focus: str) -> Dict[str, Any]:
        """Analyze resume text and extract candidate information using OpenAI"""
        try:
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
            - education: array of objects with degree, institution, year, major, gpa
            - work_experience: array of objects with company, position, duration, location, description
            - projects: array of objects with name, description, technologies
            - certifications: array of strings
            - languages: array of strings
            - linkedin_url: string
            - github_url: string
            - portfolio_url: string
            
            Return only valid JSON, no additional text.
            """
            
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert resume analyzer. Extract candidate information accurately and return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1
            )
            
            analysis_text = response.choices[0].message.content.strip()
            
            # Try to extract JSON from response
            try:
                # Find JSON in response (in case there's extra text)
                import re
                json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
                if json_match:
                    analysis_json = json.loads(json_match.group())
                else:
                    analysis_json = json.loads(analysis_text)
            except json.JSONDecodeError as json_error:
                print(f"❌ JSON parsing error: {json_error}")
                print(f"Raw response: {analysis_text}")
                raise Exception(f"Failed to parse AI response as JSON: {json_error}")
            
            return analysis_json
        
        except Exception as e:
            print(f"❌ Resume analysis error: {e}")
            raise Exception(f"Resume analysis failed: {str(e)}")
    

    async def generate_adaptive_question(self, interview_id: str, previous_response: str, question_context: str, role_focus: str, difficulty: str = "medium") -> Dict[str, Any]:
        """Generate adaptive follow-up question based on previous response quality"""
        try:
            # Analyze the previous response to determine next question difficulty and type
            response_analysis = await self.analyze_response(interview_id, previous_response, question_context, role_focus)
            
            # Determine adaptive difficulty based on response quality
            overall_score = response_analysis.get('overall_score', 5)
            if overall_score >= 8:
                next_difficulty = "hard"
                question_type = "technical"
            elif overall_score >= 6:
                next_difficulty = "medium"
                question_type = "behavioral"
            else:
                next_difficulty = "easy"
                question_type = "situational"
            
            prompt = f"""
            Generate an adaptive follow-up question based on the candidate's previous response.
            
            Context:
            - Role Focus: {role_focus}
            - Previous Question: {question_context}
            - Previous Response: {previous_response}
            - Response Score: {overall_score}/10
            - Recommended Difficulty: {next_difficulty}
            - Recommended Type: {question_type}
            
            Analysis of Previous Response:
            - Technical Accuracy: {response_analysis.get('technical_accuracy', 0)}/10
            - Communication: {response_analysis.get('communication_clarity', 0)}/10
            - Problem Solving: {response_analysis.get('problem_solving_approach', 0)}/10
            - Strengths: {response_analysis.get('strengths_identified', [])}
            - Areas for Improvement: {response_analysis.get('areas_for_improvement', [])}
            
            Generate a follow-up question that:
            1. Builds on the previous response
            2. Tests the identified areas for improvement
            3. Maintains appropriate difficulty level
            4. Is relevant to the role focus
            
            Return in JSON format:
            {{
                "question": "Adaptive follow-up question text",
                "question_type": "{question_type}",
                "difficulty": "{next_difficulty}",
                "skills_tested": ["skill1", "skill2"],
                "expected_answer_points": ["point1", "point2"],
                "adaptive_reasoning": "Why this question was chosen based on previous response",
                "follow_up_type": "clarification|deeper_dive|alternative_approach|practical_application"
            }}
            
            Do not include any text before or after the JSON. Only return the JSON object.
            """
            
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert interview coach. Generate adaptive questions that help assess candidates more effectively."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            question_text = response.choices[0].message.content.strip()
            
            try:
                return json.loads(question_text)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "question": "Can you provide more details about your experience with this technology?",
                    "question_type": question_type,
                    "difficulty": next_difficulty,
                    "skills_tested": ["technical_knowledge"],
                    "expected_answer_points": ["specific_examples", "technical_depth"],
                    "adaptive_reasoning": "Follow-up question to get more details",
                    "follow_up_type": "deeper_dive"
                }
        
        except Exception as e:
            print(f"❌ Adaptive question generation error: {e}")
            return {
                "question": "Can you tell me more about your experience in this area?",
                "question_type": "behavioral",
                "difficulty": "medium",
                "skills_tested": ["experience"],
                "expected_answer_points": ["specific_examples"],
                "adaptive_reasoning": "Default follow-up question",
                "follow_up_type": "clarification"
            }

    async def generate_questions_from_resume(self, resume_text: str, role_focus: str) -> List[Dict[str, Any]]:
        """Generate interview questions based on resume content using OpenAI"""
        try:
            prompt = f"""
            Generate 10 interview questions based on this resume for a {role_focus} role:
            
            Resume: {resume_text[:2000]}  # Limit resume text
            
            Provide questions in JSON format as an array:
            [
                {{
                    "question": "Question text",
                    "question_type": "behavioral|technical|situational",
                    "difficulty": "easy|medium|hard",
                    "skills_tested": l2"],
                    "expected_answer_points": ["point1", "p["skill1", "skiloint2"]
                }}
            ]
            """
            
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert interviewer. Generate relevant, challenging questions based on candidate background."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6
            )
            
            questions_text = response.choices[0].message.content.strip()
            
            # Try to extract JSON from response
            try:
                import re
                json_match = re.search(r'\[.*\]', questions_text, re.DOTALL)
                if json_match:
                    questions = json.loads(json_match.group())
                else:
                    questions = json.loads(questions_text)
            except json.JSONDecodeError as json_error:
                print(f"❌ JSON parsing error: {json_error}")
                print(f"Raw response: {questions_text}")
                raise Exception(f"Failed to parse AI response as JSON: {json_error}")
            
            return questions
        
        except Exception as e:
            print(f"❌ Question generation error: {e}")
            raise Exception(f"Question generation failed: {str(e)}")
