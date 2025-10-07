"""
AI Interviewer Backend - FastAPI Application
Main entry point for the interview platform API
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
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

# CORS middleware - Use specific origins with credentials
print(f"DEBUG: ALLOWED_ORIGINS = {settings.ALLOWED_ORIGINS}")
print(f"DEBUG: ALLOWED_ORIGINS type = {type(settings.ALLOWED_ORIGINS)}")
print(f"DEBUG: Environment ALLOWED_ORIGINS = {os.getenv('ALLOWED_ORIGINS')}")
print(f"DEBUG: Starting CORS middleware setup")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # Use configured origins
    allow_credentials=True,  # Allow credentials for authenticated requests
    allow_methods=["*"],
    allow_headers=["*"],
)
print(f"DEBUG: CORS middleware added successfully")

# Manual CORS handler for preflight requests
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    origin = request.headers.get("origin")
    print(f"DEBUG: Request origin = {origin}")
    print(f"DEBUG: Allowed origins = {settings.ALLOWED_ORIGINS}")
    
    response = await call_next(request)
    
    # Add CORS headers - use specific origins
    print(f"DEBUG: Checking origin {origin} against allowed origins: {settings.ALLOWED_ORIGINS}")
    if origin and origin in settings.ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        print(f"DEBUG: Origin {origin} is allowed")
    else:
        # Use the first allowed origin as fallback
        fallback_origin = settings.ALLOWED_ORIGINS[0] if settings.ALLOWED_ORIGINS else "*"
        response.headers["Access-Control-Allow-Origin"] = fallback_origin
        print(f"DEBUG: Origin {origin} not allowed, using fallback: {fallback_origin}")
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend is running"}

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


@app.options("/{path:path}")
async def options_handler(path: str, request: Request):
    """Handle preflight OPTIONS requests"""
    origin = request.headers.get("origin", "*")
    if origin in settings.ALLOWED_ORIGINS:
        allowed_origin = origin
    else:
        allowed_origin = settings.ALLOWED_ORIGINS[0] if settings.ALLOWED_ORIGINS else "*"
    
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
        }
    )

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
