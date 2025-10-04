# AI Interviewer Platform

> **An intelligent interview platform that conducts human-like interviews using AI, featuring real-time voice interaction, adaptive questioning, and comprehensive scoring.**

## 🎯 What This Application Does

### For Non-Technical Users
This is an **AI-powered interview system** that:
- **Conducts interviews** like a human interviewer would
- **Speaks to candidates** using a realistic AI avatar with voice
- **Asks personalized questions** based on the candidate's resume
- **Evaluates responses** and provides detailed feedback
- **Generates reports** with scores and recommendations

### For Technical Users
A full-stack web application featuring:
- **AI Avatar** with text-to-speech and lip-sync animation
- **Real-time voice/text interaction** using WebSocket
- **Resume analysis** and question generation using OpenAI GPT-4o
- **Adaptive difficulty** based on candidate responses
- **Comprehensive scoring** with detailed feedback
- **PDF report generation** for interview results

## 🚀 Key Features

### 🤖 AI-Powered Interview Experience
- **Smart Avatar**: AI interviewer with realistic voice and facial animation
- **Natural Conversation**: Real-time voice interaction with speech recognition
- **Adaptive Questions**: AI adjusts question difficulty based on responses
- **Context Awareness**: Remembers previous answers for follow-up questions

### 📄 Resume-Based Customization
- **PDF Upload**: Upload resumes for automatic text extraction
- **Smart Analysis**: AI analyzes skills, experience, and background
- **Personalized Questions**: Generates role-specific questions
- **Multi-Role Support**: Specialized for AI, DevOps, PM, and other roles

### 📊 Comprehensive Evaluation
- **Real-time Scoring**: Instant evaluation of responses
- **Detailed Feedback**: Specific strengths and improvement areas
- **Performance Metrics**: Overall scores with breakdowns
- **PDF Reports**: Professional interview reports

### 🔧 Technical Capabilities
- **Real-time Communication**: WebSocket for live interaction
- **Voice Processing**: Speech-to-text and text-to-speech
- **Secure Authentication**: JWT-based user management
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (OpenAI)      │
│                 │    │                 │    │                 │
│ • AI Avatar     │    │ • REST API      │    │ • GPT-4o        │
│ • Voice/Text    │    │ • WebSocket     │    │ • Whisper       │
│ • Real-time UI  │    │ • Authentication│    │ • Text-to-Speech│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Vector DB     │    │   File Storage  │
│   (PostgreSQL)  │    │   (Pinecone)    │    │   (Local)       │
│                 │    │                 │    │                 │
│ • Users         │    │ • Resume Embed  │    │ • Resumes       │
│ • Interviews    │    │ • Q&A Context   │    │ • Audio Files   │
│ • Scores        │    │ • Memory        │    │ • Reports       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend (User Interface)
- **Next.js 14**: Modern React framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **WebRTC**: Real-time audio/video

### Backend (Server & API)
- **FastAPI**: High-performance Python web framework
- **WebSocket**: Real-time communication
- **SQLAlchemy**: Database ORM
- **JWT**: Secure authentication

### AI & Machine Learning
- **OpenAI GPT-4o**: Question generation and analysis
- **Whisper**: Speech-to-text transcription
- **gTTS**: Text-to-speech synthesis
- **Pinecone**: Vector database for context

### Database & Storage
- **PostgreSQL**: Primary database
- **Pinecone**: Vector storage for AI context
- **Local Storage**: File storage for resumes and reports

## 📁 Project Structure

```
AI-Interviewer/
├── frontend/                 # User Interface (Next.js)
│   ├── app/                 # Application pages
│   │   ├── candidates/      # Candidate management
│   │   ├── interviews/      # Interview sessions
│   │   ├── dashboard/       # Main dashboard
│   │   └── avatar-settings/ # AI avatar configuration
│   ├── components/          # Reusable UI components
│   │   ├── Avatar.tsx       # AI avatar component
│   │   └── ui/              # UI component library
│   └── lib/                 # Utility functions
├── backend/                 # Server & API (FastAPI)
│   ├── app/                 # Application code
│   │   ├── models/          # Database models
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   └── core/            # Configuration
│   └── main.py              # Application entry point
└── README.md                # This file
```

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 18+ (for frontend)
- **Python** 3.11+ (for backend)
- **PostgreSQL** 15+ (database)
- **OpenAI API Key** (for AI features)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd AI-Interviewer

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
```bash
# Backend environment
cd backend
cp env.example .env
# Edit .env with your API keys and database URL

# Frontend environment
cd ../frontend
cp .env.example .env.local
# Edit .env.local with backend URL
```

### 3. Database Setup
```bash
# Start PostgreSQL (using Docker)
docker run --name ai-interviewer-db \
  -e POSTGRES_DB=ai_interviewer \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Start the Application
```bash
# Terminal 1: Start backend
cd backend
uvicorn main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🎮 How to Use

### For Interviewers
1. **Register/Login** to the platform
2. **Create Candidate** profile with resume upload
3. **Configure Interview** settings (role, difficulty, duration)
4. **Start Interview** and let AI conduct the session
5. **Review Results** with detailed scores and feedback
6. **Export Reports** as PDF for sharing

### For Candidates
1. **Receive Interview Link** from interviewer
2. **Join Interview Session** (no registration required)
3. **Interact with AI Avatar** using voice or text
4. **Answer Questions** naturally as in a real interview
5. **Receive Feedback** on performance and areas for improvement

## 🔧 Development

### Backend Development
```bash
cd backend

# Run with auto-reload
uvicorn main:app --reload

# Run tests
pytest

# Format code
black .
isort .
```

### Frontend Development
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Candidates
- `GET /api/candidates` - List candidates
- `POST /api/candidates` - Create candidate
- `POST /api/candidates/{id}/upload-resume` - Upload resume

### Interviews
- `GET /api/interviews` - List interviews
- `POST /api/interviews` - Create interview
- `POST /api/interviews/{id}/start` - Start interview
- `GET /api/interviews/{id}/report` - Get interview report

### AI Services
- `POST /api/ai/analyze-resume` - Analyze resume
- `POST /api/ai/generate-questions` - Generate questions
- `POST /api/ai/analyze-response` - Analyze response
- `POST /api/ai/text-to-speech` - Convert text to speech
- `POST /api/ai/extract-pdf-text` - Extract text from PDF

## 🔒 Security Features

- **JWT Authentication**: Secure user sessions
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Sanitized user inputs
- **File Upload Security**: Type and size validation
- **API Rate Limiting**: Prevents abuse

## 🚀 Deployment

### Production Environment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
```env
# Production settings
DEBUG=false
DATABASE_URL=postgresql://user:password@prod-db:5432/ai_interviewer
OPENAI_API_KEY=your_production_openai_key
PINECONE_API_KEY=your_production_pinecone_key
SECRET_KEY=your_production_secret_key
```

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

3. **Frontend Build Issues**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📈 Performance Optimization

- **Database Indexing**: Optimized queries
- **Caching**: Redis for session management
- **CDN**: Static asset delivery
- **AI Response Caching**: Reduced API calls
- **Audio Preloading**: Faster avatar responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation at `/docs`

---

**Built with ❤️ using Next.js, FastAPI, and OpenAI**