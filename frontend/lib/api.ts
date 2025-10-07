import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) => {
    console.log('Sending registration data:', data)
    return api.post('/api/auth/register', data)
  },
  
  login: (data: { username: string; password: string }) => {
    const formData = new URLSearchParams()
    formData.append('username', data.username)
    formData.append('password', data.password)
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },
  
  getMe: () => api.get('/api/auth/me'),
}

// Candidates API
export const candidatesAPI = {
  getCandidates: (skip = 0, limit = 100) =>
    api.get(`/api/candidates?skip=${skip}&limit=${limit}`),
  
  getCandidate: (id: number) => api.get(`/api/candidates/${id}`),
  
  createCandidate: (data: {
    full_name: string;
    email: string;
    phone?: string;
    current_position?: string;
    current_company?: string;
    experience_years?: number;
    skills?: string[];
  }) => api.post('/api/candidates', data),
  
  updateCandidate: (id: number, data: any) => api.put(`/api/candidates/${id}`, data),
  
  deleteCandidate: (id: number) => api.delete(`/api/candidates/${id}`),
  
  uploadResume: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/api/candidates/${id}/upload-resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// Interviews API
export const interviewsAPI = {
  getInterviews: (skip = 0, limit = 100, status?: string) => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() })
    if (status) params.append('status', status)
    return api.get(`/api/interviews?${params}`)
  },
  
  getInterview: (id: number) => api.get(`/api/interviews/${id}`),
  
  createInterview: (data: {
    title: string;
    candidate_id: number;
    description?: string;
    interview_type?: 'voice' | 'text' | 'mixed';
    duration_minutes?: number;
    difficulty_level?: string;
    question_count?: number;
    role_focus?: string;
  }) => api.post('/api/interviews', data),
  
  startInterview: (id: number) => api.post(`/api/interviews/${id}/start`),
  
  completeInterview: (id: number, data?: { transcript?: any; notes?: string }) =>
    api.post(`/api/interviews/${id}/complete`, data),
  
  cancelInterview: (id: number) => api.post(`/api/interviews/${id}/cancel`),
  
  getInterviewReport: (id: number) => api.get(`/api/interviews/${id}/report`),
}

// AI API
export const aiAPI = {
  analyzeResume: (resume_text: string, role_focus: string) =>
    api.post('/api/ai/analyze-resume', { resume_text, role_focus }),
  
  generateQuestions: (candidate_id: number, role_focus: string, difficulty = 'medium', question_count = 10) =>
    api.post('/api/ai/generate-questions', { candidate_id, role_focus, difficulty, question_count }),
  
  analyzeResponse: (interview_id: number, question_id: number, response_text: string) =>
    api.post('/api/ai/analyze-response', { interview_id, question_id, response_text }),
  
  transcribeAudio: (audio_file: File) => {
    const formData = new FormData()
    formData.append('audio_file', audio_file)
    return api.post('/api/ai/transcribe-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  generateFeedback: (interview_id: number) =>
    api.post('/api/ai/generate-feedback', { interview_id }),
  
  scoreInterview: (interview_id: number) =>
    api.post('/api/ai/score-interview', { interview_id }),
  
  storeResponse: (interview_id: number, question_id: number, response_text: string, response_duration_seconds?: number, audio_url?: string) =>
    api.post('/api/ai/store-response', { 
      interview_id, 
      question_id, 
      response_text, 
      response_duration_seconds, 
      audio_url 
    }),
  
  storeQuestions: (interview_id: number, questions: any[]) =>
    api.post('/api/ai/store-questions', { interview_id, questions }),
  
  getQuestionBank: (role_focus: string, difficulty = 'medium', question_type?: string, limit = 20) => {
    const params = new URLSearchParams({ role_focus, difficulty, limit: limit.toString() })
    if (question_type) params.append('question_type', question_type)
    return api.get(`/api/ai/question-bank?${params}`)
  },
  
  exportPDF: (interview_id: number) =>
    api.get(`/api/ai/export-pdf/${interview_id}`, { responseType: 'blob' }),
  
  regenerateAnalysis: (interview_id: number) =>
    api.post(`/api/ai/regenerate-analysis/${interview_id}`),
  
  debugInterview: (interview_id: number) =>
    api.get(`/api/ai/debug-interview/${interview_id}`),
  
  createScores: (interview_id: number) =>
    api.post(`/api/ai/create-scores/${interview_id}`),
  
  // TTS API
  textToSpeech: (text: string, lang = 'en', slow = false, tld = 'com') =>
    api.post('/api/ai/text-to-speech', { text, lang, slow, tld }),
  
  getAvailableVoices: () =>
    api.get('/api/ai/tts/voices'),
  
  getTTSCacheStats: () =>
    api.get('/api/ai/tts/cache/stats'),
  
  clearTTSCache: () =>
    api.delete('/api/ai/tts/cache'),
}

// WebSocket connection for real-time interviews
export class InterviewWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(interviewId: string, onMessage: (data: any) => void, onError?: (error: Event) => void) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const wsUrl = apiUrl.replace('http', 'ws') + `/ws/interview/${interviewId}`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.reconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      if (onError) onError(error)
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        if (this.ws) {
          this.connect(this.ws.url.split('/').pop() || '', () => {}, () => {})
        }
      }, 1000 * this.reconnectAttempts)
    }
  }
}

export default api
