"""
AI Interviewer Backend - FastAPI Application
Main entry point for the interview platform API
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from app.database import init_db
from app.routers import auth, interviews, candidates, ai
from app.websocket import connection_manager
from app.core.config import settings

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    await init_db()
    yield
    # Shutdown
    pass


# Initialize FastAPI app
app = FastAPI(
    title="AI Interviewer API",
    description="Intelligent interview platform with AI-powered questioning and scoring",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["candidates"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["interviews"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])

# WebSocket endpoint for real-time interview
@app.websocket("/ws/interview/{interview_id}")
async def websocket_endpoint(websocket: WebSocket, interview_id: str):
    """WebSocket endpoint for real-time interview communication"""
    await connection_manager.connect(websocket, interview_id)
    try:
        while True:
            data = await websocket.receive_json()
            await connection_manager.handle_message(websocket, interview_id, data)
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, interview_id)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "AI Interviewer API is running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "ai_services": "available"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
