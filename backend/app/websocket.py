"""
WebSocket connection manager for real-time interview communication
"""

from fastapi import WebSocket
from typing import Dict, List
import json
import asyncio
from app.services.ai_service import AIService


class ConnectionManager:
    """Manages WebSocket connections for real-time interviews"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.ai_service = AIService()
    
    async def connect(self, websocket: WebSocket, interview_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        if interview_id not in self.active_connections:
            self.active_connections[interview_id] = []
        
        self.active_connections[interview_id].append(websocket)
        print(f"✅ WebSocket connected for interview {interview_id}")
    
    def disconnect(self, websocket: WebSocket, interview_id: str):
        """Remove a WebSocket connection"""
        if interview_id in self.active_connections:
            if websocket in self.active_connections[interview_id]:
                self.active_connections[interview_id].remove(websocket)
            
            # Clean up empty interview connections
            if not self.active_connections[interview_id]:
                del self.active_connections[interview_id]
        
        print(f"❌ WebSocket disconnected for interview {interview_id}")
    
    async def handle_message(self, websocket: WebSocket, interview_id: str, data: dict):
        """Handle incoming WebSocket messages"""
        message_type = data.get("type")
        
        try:
            if message_type == "audio_data":
                await self._handle_audio_data(websocket, interview_id, data)
            elif message_type == "text_response":
                await self._handle_text_response(websocket, interview_id, data)
            elif message_type == "start_interview":
                await self._handle_start_interview(websocket, interview_id, data)
            elif message_type == "end_interview":
                await self._handle_end_interview(websocket, interview_id, data)
            else:
                await self._send_error(websocket, f"Unknown message type: {message_type}")
        
        except Exception as e:
            print(f"❌ Error handling message: {e}")
            await self._send_error(websocket, f"Error processing message: {str(e)}")
    
    async def _handle_audio_data(self, websocket: WebSocket, interview_id: str, data: dict):
        """Handle audio data from client"""
        audio_data = data.get("audio_data")
        if not audio_data:
            await self._send_error(websocket, "No audio data provided")
            return
        
        # Transcribe audio using Whisper
        try:
            transcription = await self.ai_service.transcribe_audio(audio_data)
            
            # Send transcription back to client
            await self._send_to_websocket(websocket, {
                "type": "transcription",
                "text": transcription,
                "timestamp": data.get("timestamp")
            })
            
            # Process the transcription for AI response
            await self._process_candidate_response(websocket, interview_id, transcription)
            
        except Exception as e:
            await self._send_error(websocket, f"Transcription failed: {str(e)}")
    
    async def _handle_text_response(self, websocket: WebSocket, interview_id: str, data: dict):
        """Handle text response from candidate"""
        text = data.get("text", "")
        if not text:
            await self._send_error(websocket, "No text provided")
            return
        
        await self._process_candidate_response(websocket, interview_id, text)
    
    async def _process_candidate_response(self, websocket: WebSocket, interview_id: str, response_text: str):
        """Process candidate response and generate AI follow-up"""
        try:
            # Analyze the response
            analysis = await self.ai_service.analyze_response(interview_id, response_text)
            
            # Send analysis to client
            await self._send_to_websocket(websocket, {
                "type": "response_analysis",
                "analysis": analysis,
                "timestamp": data.get("timestamp")
            })
            
            # Generate follow-up question or next step
            next_action = await self.ai_service.generate_next_action(interview_id, response_text, analysis)
            
            await self._send_to_websocket(websocket, {
                "type": "ai_response",
                "action": next_action,
                "timestamp": data.get("timestamp")
            })
            
        except Exception as e:
            await self._send_error(websocket, f"Response processing failed: {str(e)}")
    
    async def _handle_start_interview(self, websocket: WebSocket, interview_id: str, data: dict):
        """Handle interview start"""
        try:
            # Initialize interview session
            interview_data = await self.ai_service.initialize_interview(interview_id, data)
            
            await self._send_to_websocket(websocket, {
                "type": "interview_initialized",
                "data": interview_data
            })
            
        except Exception as e:
            await self._send_error(websocket, f"Interview initialization failed: {str(e)}")
    
    async def _handle_end_interview(self, websocket: WebSocket, interview_id: str, data: dict):
        """Handle interview end"""
        try:
            # Generate final analysis and scoring
            final_analysis = await self.ai_service.generate_final_analysis(interview_id)
            
            await self._send_to_websocket(websocket, {
                "type": "interview_completed",
                "analysis": final_analysis
            })
            
        except Exception as e:
            await self._send_error(websocket, f"Interview completion failed: {str(e)}")
    
    async def _send_to_websocket(self, websocket: WebSocket, message: dict):
        """Send message to specific WebSocket"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"❌ Error sending message: {e}")
    
    async def _send_error(self, websocket: WebSocket, error_message: str):
        """Send error message to WebSocket"""
        await self._send_to_websocket(websocket, {
            "type": "error",
            "message": error_message
        })
    
    async def broadcast_to_interview(self, interview_id: str, message: dict):
        """Broadcast message to all connections for an interview"""
        if interview_id in self.active_connections:
            for websocket in self.active_connections[interview_id]:
                await self._send_to_websocket(websocket, message)


# Global connection manager instance
connection_manager = ConnectionManager()
