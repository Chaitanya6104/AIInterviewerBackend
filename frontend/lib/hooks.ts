import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authAPI, candidatesAPI, interviewsAPI, aiAPI } from './api'

// Auth hooks
export const useAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        authAPI.getMe()
          .then(response => {
            setUser(response.data)
          })
          .catch(() => {
            localStorage.removeItem('auth_token')
          })
          .finally(() => {
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await authAPI.login(credentials)
      const { access_token, user: userData } = response.data
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', access_token)
      }
      setUser(userData)
      return userData
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
    setUser(null)
  }

  return { user, loading, login, logout }
}

// Candidates hooks
export const useCandidates = (skip = 0, limit = 100) => {
  return useQuery({
    queryKey: ['candidates', skip, limit],
    queryFn: () => candidatesAPI.getCandidates(skip, limit),
    select: (data) => data.data.candidates,
  })
}

export const useCandidate = (id: number) => {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidatesAPI.getCandidate(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

export const useCreateCandidate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: candidatesAPI.createCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

export const useUpdateCandidate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => candidatesAPI.updateCandidate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate', id] })
    },
  })
}

export const useDeleteCandidate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: candidatesAPI.deleteCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

export const useUploadResume = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => candidatesAPI.uploadResume(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['candidate', id] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

// Interviews hooks
export const useInterviews = (skip = 0, limit = 100, status?: string) => {
  return useQuery({
    queryKey: ['interviews', skip, limit, status],
    queryFn: () => interviewsAPI.getInterviews(skip, limit, status),
    select: (data) => data.data.interviews,
  })
}

export const useInterview = (id: number) => {
  return useQuery({
    queryKey: ['interview', id],
    queryFn: () => interviewsAPI.getInterview(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

export const useCreateInterview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: interviewsAPI.createInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
    },
  })
}

export const useStartInterview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: interviewsAPI.startInterview,
    onSuccess: (_, interviewId) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['interview', interviewId] })
    },
  })
}

export const useCompleteInterview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: any }) => interviewsAPI.completeInterview(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['interview', id] })
    },
  })
}

export const useCancelInterview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: interviewsAPI.cancelInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
    },
  })
}

export const useInterviewReport = (id: number) => {
  return useQuery({
    queryKey: ['interview-report', id],
    queryFn: () => interviewsAPI.getInterviewReport(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

// AI hooks
export const useAnalyzeResume = () => {
  return useMutation({
    mutationFn: ({ resume_text, role_focus }: {
      resume_text: string;
      role_focus: string;
    }) => aiAPI.analyzeResume(resume_text, role_focus),
  })
}

export const useGenerateQuestions = () => {
  return useMutation({
    mutationFn: ({ candidate_id, role_focus, difficulty, question_count }: {
      candidate_id: number;
      role_focus: string;
      difficulty?: string;
      question_count?: number;
    }) => aiAPI.generateQuestions(candidate_id, role_focus, difficulty, question_count),
  })
}

export const useAnalyzeResponse = () => {
  return useMutation({
    mutationFn: ({ interview_id, question_id, response_text }: {
      interview_id: number;
      question_id: number;
      response_text: string;
    }) => aiAPI.analyzeResponse(interview_id, question_id, response_text),
  })
}

export const useTranscribeAudio = () => {
  return useMutation({
    mutationFn: aiAPI.transcribeAudio,
  })
}

export const useStoreResponse = () => {
  return useMutation({
    mutationFn: ({ interview_id, question_id, response_text, response_duration_seconds, audio_url }: {
      interview_id: number;
      question_id: number;
      response_text: string;
      response_duration_seconds?: number;
      audio_url?: string;
    }) => aiAPI.storeResponse(interview_id, question_id, response_text, response_duration_seconds, audio_url),
  })
}

export const useStoreQuestions = () => {
  return useMutation({
    mutationFn: ({ interview_id, questions }: {
      interview_id: number;
      questions: any[];
    }) => aiAPI.storeQuestions(interview_id, questions),
  })
}

export const useQuestionBank = (role_focus: string, difficulty = 'medium', question_type?: string, limit = 20) => {
  return useQuery({
    queryKey: ['question-bank', role_focus, difficulty, question_type, limit],
    queryFn: () => aiAPI.getQuestionBank(role_focus, difficulty, question_type, limit),
    enabled: !!role_focus,
  })
}

export const useExportPDF = () => {
  return useMutation({
    mutationFn: (interview_id: number) => aiAPI.exportPDF(interview_id),
  })
}

export const useGenerateFeedback = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiAPI.generateFeedback,
    onSuccess: (_, interviewId) => {
      queryClient.invalidateQueries({ queryKey: ['interview', interviewId] })
      queryClient.invalidateQueries({ queryKey: ['interview-report', interviewId] })
    },
  })
}

export const useScoreInterview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiAPI.scoreInterview,
    onSuccess: (_, interviewId) => {
      queryClient.invalidateQueries({ queryKey: ['interview', interviewId] })
      queryClient.invalidateQueries({ queryKey: ['interview-report', interviewId] })
    },
  })
}

export const useRegenerateAnalysis = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (interviewId: number) => aiAPI.regenerateAnalysis(interviewId),
    onSuccess: (_, interviewId) => {
      queryClient.invalidateQueries({ queryKey: ['interview', interviewId] })
      queryClient.invalidateQueries({ queryKey: ['interview-report', interviewId] })
    },
  })
}

export const useCreateScores = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (interviewId: number) => aiAPI.createScores(interviewId),
    onSuccess: (_, interviewId) => {
      queryClient.invalidateQueries({ queryKey: ['interview', interviewId] })
      queryClient.invalidateQueries({ queryKey: ['interview-report', interviewId] })
    },
  })
}

