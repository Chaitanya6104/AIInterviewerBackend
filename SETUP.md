# AI Interviewer App - Setup Guide

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** 15+
- **Docker** (optional, for containerized setup)
- **OpenAI API Key**
- **Pinecone API Key** (for vector storage)

### 1. Environment Setup

#### Backend Environment
```bash
cd backend
cp env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL=postgresql://user:password@localhost/ai_interviewer
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
SECRET_KEY=your-secret-key-here
```

#### Frontend Environment
```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb ai_interviewer
```

#### Option B: Docker (Recommended)
```bash
# Start PostgreSQL with Docker
docker run --name ai-interviewer-db \
  -e POSTGRES_DB=ai_interviewer \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from app.database import init_db; import asyncio; asyncio.run(init_db())"

# Start backend server
uvicorn main:app --reload
```

Backend will be available at: http://localhost:8000

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:3000

### 5. Full Stack with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (OpenAI)      │
│                 │    │                 │    │                 │
│ • WebRTC        │    │ • REST API      │    │ • GPT-4o        │
│ • Voice/Text    │    │ • WebSocket     │    │ • Whisper       │
│ • Real-time UI  │    │ • Auth          │    │ • Embeddings    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Vector DB     │    │   File Storage  │
│   (PostgreSQL)  │    │   (Pinecone)    │    │   (Local/S3)    │
│                 │    │                 │    │                 │
│ • Users         │    │ • Resume Embed  │    │ • Resumes       │
│ • Interviews    │    │ • Q&A Context   │    │ • Audio Files   │
│ • Scores        │    │ • Memory        │    │ • Reports       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Key Features Implemented

### ✅ Completed
- **Backend API**: FastAPI with authentication, CRUD operations
- **Database Models**: User, Candidate, Interview, Question, Response, Score
- **AI Integration**: OpenAI GPT-4o and Whisper integration
- **Vector Storage**: Pinecone for resume embeddings and context
- **WebSocket**: Real-time interview communication
- **Frontend**: Next.js with modern UI components
- **Authentication**: JWT-based auth system

### 🚧 In Progress
- **Real-time Transcription**: WebRTC audio processing
- **AI Scoring**: Automated response evaluation
- **PDF Reports**: Interview report generation

### 📝 Next Steps
- **WebRTC Integration**: Real-time audio/video
- **Advanced AI Features**: Context-aware questioning
- **Testing**: Unit and integration tests
- **Deployment**: Production setup

## 🔧 Development Commands

### Backend
```bash
# Run with auto-reload
uvicorn main:app --reload

# Run tests
pytest

# Format code
black .
isort .

# Database migrations
alembic upgrade head
```

### Frontend
```bash
# Development
npm run dev

# Build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Candidates
- `GET /api/candidates` - List candidates
- `POST /api/candidates` - Create candidate
- `GET /api/candidates/{id}` - Get candidate
- `PUT /api/candidates/{id}` - Update candidate
- `POST /api/candidates/{id}/upload-resume` - Upload resume

### Interviews
- `GET /api/interviews` - List interviews
- `POST /api/interviews` - Create interview
- `GET /api/interviews/{id}` - Get interview
- `POST /api/interviews/{id}/start` - Start interview
- `POST /api/interviews/{id}/complete` - Complete interview
- `GET /api/interviews/{id}/report` - Get interview report

### AI Services
- `POST /api/ai/analyze-resume` - Analyze resume
- `POST /api/ai/generate-questions` - Generate questions
- `POST /api/ai/analyze-response` - Analyze response
- `POST /api/ai/transcribe-audio` - Transcribe audio
- `POST /api/ai/generate-feedback` - Generate feedback

### WebSocket
- `WS /ws/interview/{interview_id}` - Real-time interview communication

## 🚀 Production Deployment

### Environment Variables
```env
# Production settings
DEBUG=false
DATABASE_URL=postgresql://user:password@prod-db:5432/ai_interviewer
OPENAI_API_KEY=your_production_openai_key
PINECONE_API_KEY=your_production_pinecone_key
SECRET_KEY=your_production_secret_key
ALLOWED_ORIGINS=["https://your-domain.com"]
```

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring & Analytics

- **Database**: PostgreSQL performance monitoring
- **AI Usage**: OpenAI API usage tracking
- **Vector DB**: Pinecone query performance
- **WebSocket**: Real-time connection monitoring

## 🔒 Security Considerations

- **Authentication**: JWT tokens with expiration
- **CORS**: Configured for specific origins
- **File Uploads**: Size limits and type validation
- **API Rate Limiting**: Implement rate limiting
- **Data Encryption**: Sensitive data encryption

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_interviews.py
```

### Frontend Tests
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📈 Performance Optimization

- **Database**: Indexing and query optimization
- **Caching**: Redis for session management
- **CDN**: Static asset delivery
- **AI**: Response caching and optimization

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   # Check PostgreSQL status
   pg_isready -h localhost -p 5432
   ```

2. **OpenAI API**
   ```bash
   # Test API key
   curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
   ```

3. **Pinecone Connection**
   ```bash
   # Test Pinecone
   python -c "import pinecone; print('Pinecone connected')"
   ```

### Logs
```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# Database logs
docker-compose logs postgres
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [WebRTC Documentation](https://webrtc.org/getting-started/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
