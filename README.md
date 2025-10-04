# AI Interviewer App

An intelligent interview platform that simulates human-style interviews using AI, with real-time voice/text interaction, adaptive questioning, and comprehensive scoring.

## 🚀 Features

- **Resume-based Customization**: Upload resume/LinkedIn profile for personalized questions
- **Real-time Interview**: Voice or text-based interviews with AI avatar
- **Adaptive Difficulty**: AI adjusts question complexity based on responses
- **Live Transcription**: Real-time speech-to-text using Whisper
- **AI Scoring**: Automated evaluation with detailed feedback
- **PDF Reports**: Export comprehensive interview reports

## 🏗️ Architecture

```
Frontend (Next.js) ↔ Backend (FastAPI) ↔ AI Services (OpenAI)
       ↓                    ↓                    ↓
   WebRTC/UI         PostgreSQL + Pinecone    GPT-4o + Whisper
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, WebRTC
- **Backend**: FastAPI, WebSocket, SQLAlchemy
- **AI**: OpenAI GPT-4o, Whisper, LangChain
- **Database**: PostgreSQL, Pinecone
- **Storage**: Local/S3 for files

## 📁 Project Structure

```
ai-interviewer/
├── frontend/          # Next.js application
├── backend/           # FastAPI application
├── shared/           # Shared types and utilities
├── docs/             # Documentation
└── docker/          # Docker configurations
```

## 🚀 Quick Start

1. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Environment Variables**:
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key and database credentials

## 📋 Development Roadmap

- [x] Project setup and architecture
- [ ] Backend API development
- [ ] Frontend UI implementation
- [ ] AI integration
- [ ] Real-time features
- [ ] Testing and deployment
