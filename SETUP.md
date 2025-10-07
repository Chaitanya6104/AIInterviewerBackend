# AI Interviewer Platform - Setup Guide

> **Complete setup guide for both technical and non-technical users**

## 🎯 What You'll Get

After completing this setup, you'll have:
- **AI Interviewer Platform** running on your computer
- **AI Avatar** that can conduct interviews with voice
- **Resume Analysis** that generates personalized questions
- **Real-time Scoring** with detailed feedback
- **PDF Reports** for interview results

## 📋 Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://python.org/))
- **PostgreSQL** 15+ ([Download](https://postgresql.org/))
- **Git** ([Download](https://git-scm.com/))

### Required Accounts
- **OpenAI Account** ([Sign up](https://platform.openai.com/))
- **Pinecone Account** ([Sign up](https://pinecone.io/))

### System Requirements
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space
- **Internet**: Stable connection for AI services

## 🚀 Quick Setup (Recommended)

### Step 1: Get the Code
```bash
# Download the project
git clone <repository-url>
cd AI-Interviewer
```

### Step 2: Install Dependencies
```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 3: Setup Database
```bash
# Start PostgreSQL using Docker (easiest method)
docker run --name ai-interviewer-db \
  -e POSTGRES_DB=ai_interviewer \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### Step 4: Configure Environment
```bash
# Backend configuration
cd backend
cp env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_interviewer
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
SECRET_KEY=your-secret-key-here
```

```bash
# Frontend configuration
cd ../frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 5: Start the Application
```bash
# Terminal 1: Start backend
cd backend
python main.py

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Step 6: Access the Application
- **Main Application**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Detailed Setup Guide

### 1. Environment Setup

#### Backend Environment
```bash
cd backend
cp env.example .env
```

**Required Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_interviewer

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key
PINECONE_API_KEY=your-pinecone-api-key

# Security
SECRET_KEY=your-random-secret-key-here

# Optional
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000"]
```

#### Frontend Environment
```bash
cd frontend
cp .env.example .env.local
```

**Required Environment Variables:**
```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Database Setup

#### Option A: Docker (Recommended)
```bash
# Start PostgreSQL container
docker run --name ai-interviewer-db \
  -e POSTGRES_DB=ai_interviewer \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Verify database is running
docker ps
```

#### Option B: Local Installation
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
createdb ai_interviewer
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from app.database import init_db; import asyncio; asyncio.run(init_db())"

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** http://localhost:8000

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend will be available at:** http://localhost:3000

### 5. Verify Installation

#### Check Backend
```bash
# Test API health
curl http://localhost:8000/health

# Check API documentation
open http://localhost:8000/docs
```

#### Check Frontend
```bash
# Open application
open http://localhost:3000
```

## 🎮 First-Time Usage

### 1. Create Account
1. Go to http://localhost:3000/register
2. Fill in your details
3. Click "Register"

### 2. Create Your First Candidate
1. Go to "Candidates" → "Add New Candidate"
2. Upload a resume (PDF format)
3. Fill in candidate details
4. Click "Create Candidate"

### 3. Start Your First Interview
1. Go to "Interviews" → "Create New Interview"
2. Select the candidate
3. Choose interview settings
4. Click "Start Interview"
5. Watch the AI avatar conduct the interview!

## 🔧 Development Commands

### Backend Development
```bash
cd backend

# Run with auto-reload
uvicorn main:app --reload
or
python main.py 
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

# Linting
npm run lint
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Error
**Error:** `Connection refused to database`
**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker start ai-interviewer-db

# Check connection
pg_isready -h localhost -p 5432
```

#### 2. OpenAI API Error
**Error:** `Invalid API key`
**Solution:**
```bash
# Check API key in .env file
cat backend/.env | grep OPENAI_API_KEY

# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

#### 3. Frontend Build Error
**Error:** `Module not found`
**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 4. Port Already in Use
**Error:** `Port 3000/8000 already in use`
**Solution:**
```bash
# Find process using port
lsof -i :3000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different ports
npm run dev -- -p 3001
uvicorn main:app --reload --port 8001
```

#### 5. Python Virtual Environment Issues
**Error:** `Module not found`
**Solution:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Logs and Debugging

#### Backend Logs
```bash
# View backend logs
cd backend
uvicorn main:app --reload --log-level debug
```

#### Frontend Logs
```bash
# View frontend logs
cd frontend
npm run dev
# Check browser console for errors
```

#### Database Logs
```bash
# View PostgreSQL logs
docker logs ai-interviewer-db
```

## 🚀 Production Deployment

### Environment Variables for Production
```env
# Production settings
DEBUG=false
DATABASE_URL=postgresql://user:password@prod-db:5432/ai_interviewer
OPENAI_API_KEY=your_production_openai_key
PINECONE_API_KEY=your_production_pinecone_key
SECRET_KEY=your_production_secret_key
ALLOWED_ORIGINS=["https://your-domain.com"]
```

### Docker Production Setup
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Performance Optimization

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX idx_responses_interview_id ON responses(interview_id);
```

## 🤝 Getting Help

### Documentation
- **API Documentation**: http://localhost:8000/docs
- **Frontend Components**: Check `/components` directory
- **Backend Services**: Check `/services` directory

## 📚 Additional Resources

### Learning Resources
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Tools and Extensions
- **VS Code Extensions**: Python, TypeScript, Tailwind CSS
- **Browser Extensions**: React Developer Tools
- **Database Tools**: pgAdmin, DBeaver

##  Congratulations!

You've successfully set up the AI Interviewer Platform! 

**Next Steps:**
1. Create your first candidate
2. Start your first interview
3. Explore the AI avatar features
4. Generate your first report

<<<<<<< HEAD
**Happy Interviewing! 🎤🤖**
=======
**Happy Interviewing! 🎤🤖**
>>>>>>> 08a467ea071996fe4118a64fd8daebf19435db1e
