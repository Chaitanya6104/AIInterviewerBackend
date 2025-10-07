'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Mic, MicOff, MessageSquare, Brain, Clock, Play, Pause, Square, Send, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useInterview, useStartInterview, useAnalyzeResponse, useTranscribeAudio, useQuestionBank, useCompleteInterview, useStoreResponse, useStoreQuestions } from '@/lib/hooks'
import { safeRender, safeDateFormat } from '@/lib/utils'
import ProtectedRoute from '@/components/ProtectedRoute'
import Avatar from '@/components/Avatar'
import { AvatarConfig, preloadAudio, preloadMultipleAudio } from '@/lib/avatar'

export default function StartInterviewPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTextMode, setIsTextMode] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [response, setResponse] = useState('')
  const [interimResponse, setInterimResponse] = useState('')
  const [notes, setNotes] = useState('')
  const [isInterviewStarted, setIsInterviewStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false)
  const [submittingResponse, setSubmittingResponse] = useState(false)
  
  // Avatar state
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const [avatarText, setAvatarText] = useState('')
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>({
    voice: {
      lang: 'en',
      slow: false,
      tld: 'com',
    },
    size: 'lg'
  })
  
  // Store all responses for comprehensive scoring
  const [allResponses, setAllResponses] = useState<any[]>([])
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null)
  
  // Interview timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60) // 30 minutes in seconds
  const [interviewStartTime, setInterviewStartTime] = useState<number | null>(null)
  
  const router = useRouter()
  const params = useParams()
  const interviewId = params?.id as string
  
  const { data: interview, isLoading } = useInterview(parseInt(interviewId))
  const startInterview = useStartInterview()
  const analyzeResponse = useAnalyzeResponse()
  const transcribeAudio = useTranscribeAudio()
  const completeInterview = useCompleteInterview()
  const storeResponse = useStoreResponse()
  const storeQuestions = useStoreQuestions()
  
  // Fetch question bank based on interview role focus
  const { data: questionBankData, isLoading: questionsLoading } = useQuestionBank(
    interview?.role_focus || 'General',
    interview?.difficulty_level || 'medium',
    undefined,
    interview?.question_count || 10
  )

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isInterviewStarted && interviewStartTime && timeRemaining > 0) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - interviewStartTime) / 1000)
        const remaining = Math.max(0, (30 * 60) - elapsed) // 30 minutes total
        setTimeRemaining(remaining)
        
        // Auto-complete interview when time runs out
        if (remaining === 0) {
          handleCompleteInterview()
        }
      }, 1000)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isInterviewStarted, interviewStartTime, timeRemaining])

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Pre-load questions immediately when interview data is available
  useEffect(() => {
    if (interview && !questionsLoading && questionBankData?.data?.questions) {
      console.log('Pre-loading questions from question bank:', questionBankData.data.questions)
      setQuestions(questionBankData.data.questions)
      if (!currentQuestion && questionBankData.data.questions.length > 0) {
        console.log('Setting first question:', questionBankData.data.questions[0].question.substring(0, 50) + '...')
        setCurrentQuestion(questionBankData.data.questions[0])
        setCurrentQuestionIndex(0)
        
        // Preload audio for all questions immediately in parallel
        console.log('Preloading audio for all questions...')
        const allTexts = [
          ...questionBankData.data.questions.map((q: any) => q.question),
          "Congratulations! You've completed the interview. Thank you for your time and thoughtful responses."
        ]
        preloadMultipleAudio(allTexts, avatarConfig)
      }
    }
  }, [interview, questionBankData, questionsLoading, currentQuestion, avatarConfig])

  // Avatar speech effect - speak when question changes
  useEffect(() => {
    if (currentQuestion && currentQuestion.question && currentQuestion.question !== avatarText) {
      console.log('Setting avatar text for question:', currentQuestion.question.substring(0, 50) + '...')
      setAvatarText(currentQuestion.question)
      // Start speaking immediately - audio should be preloaded
      setIsAvatarSpeaking(true)
    }
  }, [currentQuestion, avatarText])

  // Handle avatar speech end
  const handleAvatarSpeechEnd = () => {
    setIsAvatarSpeaking(false)
  }

  // Load avatar configuration on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('avatarConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setAvatarConfig(parsed)
      } catch (error) {
        console.error('Failed to parse saved avatar config:', error)
      }
    }
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('Interview data:', interview)
    console.log('Question bank data:', questionBankData)
    console.log('Questions loading:', questionsLoading)
    console.log('Current question:', currentQuestion)
    console.log('Questions array:', questions)
  }, [interview, questionBankData, questionsLoading, currentQuestion, questions])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (interview && interview.status === 'scheduled') {
      handleStartInterview()
    }
  }, [interview])

  // Load questions when question bank data is available (optimized)
  useEffect(() => {
    if (questionBankData?.data?.questions && questionBankData.data.questions.length > 0 && questions.length === 0) {
      console.log('Loading questions from question bank (optimized):', questionBankData.data.questions)
      setQuestions(questionBankData.data.questions)
      if (!currentQuestion) {
        console.log('Setting first question (optimized):', questionBankData.data.questions[0].question.substring(0, 50) + '...')
        setCurrentQuestion(questionBankData.data.questions[0])
        setCurrentQuestionIndex(0)
      }
    }
  }, [questionBankData, questions.length, currentQuestion])

  // Fallback: Show default question if no questions are loaded after a shorter delay
  useEffect(() => {
    if (isInterviewStarted && !currentQuestion && !questionsLoading) {
      const timer = setTimeout(() => {
        console.log('No questions loaded, showing default question')
        const defaultQuestion = {
          id: 1,
          question: "Hello! I'm your AI interviewer. Let's start with a technical question. Can you explain the difference between synchronous and asynchronous programming?",
          type: "technical",
          difficulty: "medium"
        }
        setCurrentQuestion(defaultQuestion)
      }, 1000) // Reduced to 1 second for faster fallback

      return () => clearTimeout(timer)
    }
  }, [isInterviewStarted, currentQuestion, questionsLoading])

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const handleStartInterview = async () => {
    try {
      await startInterview.mutateAsync(parseInt(interviewId))
      setIsInterviewStarted(true)
      setInterviewStartTime(Date.now()) // Start the timer
      console.log('Interview started successfully')
      
      // Store questions in database if we have them
      if (questions.length > 0) {
        console.log('Storing questions in database:', questions)
        const storeResult = await storeQuestions.mutateAsync({
          interview_id: parseInt(interviewId),
          questions: questions
        })
        
        // Update questions with database IDs
        if (storeResult.data?.questions) {
          console.log('Questions stored with IDs:', storeResult.data.questions)
          setQuestions(storeResult.data.questions)
          setCurrentQuestion(storeResult.data.questions[0])
          
          // Preload audio for the first question immediately
          console.log('Preloading audio for first question immediately...')
          await preloadAudio(storeResult.data.questions[0].question, avatarConfig)
        }
      }
    } catch (error) {
      console.error('Failed to start interview:', error)
    }
  }

  const startRecording = async () => {
    try {
      // Check if browser supports speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
        return
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started')
        setIsRecording(true)
        setInterimResponse('') // Clear any previous interim response
        setResponseStartTime(Date.now()) // Track response start time
      }

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        console.log('Speech recognition result:', {
          finalTranscript,
          interimTranscript,
          isFinal: event.results[event.results.length - 1]?.isFinal
        })

        // Add final results to the main response
        if (finalTranscript) {
          setResponse(prev => {
            const newResponse = prev + finalTranscript
            console.log('Updated response:', newResponse)
            return newResponse
          })
        }
        
        // Show interim results in real-time (will be replaced by final results)
        setInterimResponse(interimTranscript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended')
        setIsRecording(false)
        setInterimResponse('') // Clear interim response when recognition ends
        
        // Check if we have any response (including interim that might not have been finalized)
        const currentResponse = response.trim()
        const hasInterimResponse = interimResponse.trim()
        
        console.log('Speech recognition ended - response check:', {
          currentResponse,
          hasInterimResponse,
          finalResponse: currentResponse || hasInterimResponse
        })
        
        // If we have interim response but no final response, use the interim
        if (!currentResponse && hasInterimResponse) {
          console.log('Using interim response as final response')
          setResponse(hasInterimResponse)
        }
        
        // Auto-submit response if there's content and we're not in text mode
        const finalResponse = currentResponse || hasInterimResponse
        if (finalResponse && !isTextMode) {
          console.log('Auto-submitting response after speech recognition')
          setIsAutoSubmitting(true)
          setTimeout(() => {
            handleSubmitResponse()
          }, 1000) // Small delay to ensure transcription is complete
          
          // Fallback timeout to reset auto-submission state
          setTimeout(() => {
            if (isAutoSubmitting) {
              console.log('Auto-submission timeout, resetting state')
              setIsAutoSubmitting(false)
            }
          }, 10000) // 10 second timeout
        } else if (!finalResponse && !isTextMode) {
          // If no response was captured, show a message
          console.log('No response captured during recording')
        }
      }

      recognitionRef.current.start()
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
      setInterimResponse('') // Clear interim response when stopping
    }
  }

  const handleSubmitResponse = async () => {
    if (!response.trim()) return

    setSubmittingResponse(true)
    try {
      // If this is the completion question, navigate to report
      if (currentQuestion?.type === 'completion') {
        router.push(`/interviews/${interviewId}/report`)
        return
      }

      // Calculate response duration
      const responseDuration = responseStartTime ? (Date.now() - responseStartTime) / 1000 : null

      // Store response data for final analysis (immediate)
      const responseData = {
        question: currentQuestion,
        response: response,
        timestamp: new Date().toISOString(),
        questionIndex: currentQuestionIndex,
        duration: responseDuration,
        analysis: null, // Will be updated when API call completes
        score: null
      }
      
      setAllResponses(prev => [...prev, responseData])
      console.log('Stored response data:', responseData)

      // Move to next question immediately (optimistic update)
      const nextIndex = currentQuestionIndex + 1
      if (nextIndex < questions.length) {
        // Preload audio for the next question BEFORE setting it as current
        console.log('Preloading audio for next question:', questions[nextIndex].question.substring(0, 50) + '...')
        await preloadAudio(questions[nextIndex].question, avatarConfig)
        
        setCurrentQuestion(questions[nextIndex])
        setCurrentQuestionIndex(nextIndex)
        
        // Preload audio for the next few questions
        for (let i = nextIndex + 1; i < Math.min(nextIndex + 3, questions.length); i++) {
          preloadAudio(questions[i].question, avatarConfig)
        }
      } else {
        // Interview completed - show completion message and complete the interview
        const congratulationsMessage = "🎉 Congratulations! You've completed the interview. Thank you for your time and thoughtful responses."
        
        // Preload congratulations message before setting it as current question
        console.log('Preloading congratulations message...')
        await preloadAudio(congratulationsMessage, avatarConfig)
        
        setCurrentQuestion({
          id: 'completed',
          question: congratulationsMessage,
          type: "completion",
          difficulty: "completed"
        })
        
        // Automatically complete the interview
        console.log('Interview completed, calling handleCompleteInterview')
        setTimeout(() => {
          handleCompleteInterview()
        }, 1000) // Reduced to 1 second for faster completion
      }
      
      setResponse('')
      setInterimResponse('')
      setNotes('')
      setResponseStartTime(null) // Reset response start time

      // Store the response with analysis (async, don't block UI)
      storeResponse.mutateAsync({
        interview_id: parseInt(interviewId),
        question_id: currentQuestion.id || 1, // Fallback to 1 if no id
        response_text: response,
        response_duration_seconds: responseDuration || undefined
      }).then((storeResult) => {
        // Update the response data with analysis results
        setAllResponses(prev => prev.map((resp, index) => 
          index === currentQuestionIndex 
            ? { ...resp, analysis: storeResult.data?.analysis, score: storeResult.data?.score }
            : resp
        ))
        console.log('Response analysis completed:', storeResult.data)
      }).catch((error) => {
        console.error('Error storing response:', error)
      })
    } catch (error) {
      console.error('Failed to analyze response:', error)
    } finally {
      setSubmittingResponse(false)
      setIsAutoSubmitting(false)
    }
  }

  const handleCompleteInterview = async () => {
    try {
      console.log('Completing interview...', {
        interviewId: parseInt(interviewId),
        questions: questions.length,
        currentResponse: response,
        notes: notes
      })
      
      // Build conversation transcript
      const conversationTranscript = []
      
      // Add questions and responses as conversation entries
      for (let i = 0; i < Math.max(questions.length, allResponses.length); i++) {
        // Add AI question
        if (i < questions.length) {
          conversationTranscript.push({
            speaker: 'ai',
            text: questions[i].question || questions[i].content,
            timestamp: new Date().toISOString(),
            type: 'question'
          })
        }
        
        // Add candidate response
        if (i < allResponses.length) {
          conversationTranscript.push({
            speaker: 'candidate',
            text: allResponses[i].response,
            timestamp: allResponses[i].timestamp,
            type: 'response',
            score: allResponses[i].score
          })
        }
      }
      
      await completeInterview.mutateAsync({
        id: parseInt(interviewId),
        data: {
          transcript: {
            transcript: conversationTranscript,
            notes: notes
          },
          notes: notes
        }
      })
      
      console.log('Interview completed successfully')
      router.push(`/interviews/${interviewId}/report`)
    } catch (error) {
      console.error('Failed to complete interview:', error)
      console.log('Error details:', (error as any).response?.data || (error as any).message)
      // Still navigate to report even if completion fails
    router.push(`/interviews/${interviewId}/report`)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading interview...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (questionsLoading && !currentQuestion) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!interview) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Not Found</h2>
              <p className="text-gray-600 mb-4">The interview you're looking for doesn't exist.</p>
              <Button asChild>
                <Link href="/interviews">Back to Interviews</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/interviews">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Interviews
                  </Link>
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">AI Interview</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/avatar-settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Avatar Settings
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge variant={isInterviewStarted ? "default" : "secondary"}>
                  {isInterviewStarted ? "In Progress" : "Starting..."}
                </Badge>
                <div className={`flex items-center text-sm ${isInterviewStarted && timeRemaining < 300 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                  <Clock className="h-4 w-4 mr-1" />
                  {isInterviewStarted ? formatTime(timeRemaining) : `${interview.duration_minutes} min`}
                  {isInterviewStarted && timeRemaining < 300 && timeRemaining > 0 && (
                    <span className="ml-2 text-xs text-red-500">⚠️ Time running low!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Interview Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{safeRender(interview.title)}</CardTitle>
                <CardDescription>
                  Interview with {safeRender(interview.candidate?.full_name)} • {safeRender(interview.role_focus)}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Interview Interface */}
            <Card className="interview-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Interview</CardTitle>
                    <CardDescription>
                      AI interviewer conducting the interview
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={isRecording ? "destructive" : "secondary"}>
                      {isRecording ? (
                        <>
                          <Mic className="h-3 w-3 mr-1" />
                          Recording
                        </>
                      ) : (
                        <>
                          <MicOff className="h-3 w-3 mr-1" />
                          Ready
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* AI Avatar and Question */}
                  <div className="flex items-center space-x-4">
                    <Avatar
                      text={avatarText}
                      isSpeaking={isAvatarSpeaking}
                      onSpeechEnd={handleAvatarSpeechEnd}
                      avatarImage={avatarConfig.image}
                      avatarVideo={avatarConfig.video}
                      size="lg"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-blue-100 rounded-lg p-4">
                        {questions.length > 0 && currentQuestionIndex < questions.length && (
                          <div className="text-sm text-blue-600 mb-2 font-medium">
                            Question {currentQuestionIndex + 1} of {questions.length}
                          </div>
                        )}
                        <p className="text-gray-800">
                          {currentQuestion ? currentQuestion.question : "Preparing your interview questions..."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Response Area */}
                  <div className="flex items-center space-x-4 justify-end">
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <p className="text-gray-800">
                          {response || "Your response will appear here..."}
                          {interimResponse && (
                            <span className="text-gray-500 italic">
                              {interimResponse}
                            </span>
                          )}
                        </p>
                        {isAutoSubmitting && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                              <span className="text-blue-700 text-xs">Auto-submitting your response...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {interview.candidate?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'JD'}
                      </span>
                    </div>
                  </div>

                  {/* Audio Visualizer */}
                  {isRecording && (
                    <div className="audio-visualizer">
                      <div className="flex items-center space-x-1">
                        {[...Array(20)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-blue-500 rounded-full animate-pulse"
                            style={{
                              height: `${Math.random() * 40 + 10}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex items-center justify-center space-x-4">
                    {!isTextMode ? (
                      <div className="flex items-center space-x-4">
                      <Button
                        variant={isRecording ? "destructive" : "default"}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={loading}
                        className="flex items-center space-x-2"
                      >
                        {isRecording ? (
                          <>
                            <Square className="h-4 w-4" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4" />
                            Start Recording
                          </>
                        )}
                      </Button>
                        {response.trim() && !isRecording && (
                          <Button
                            onClick={handleSubmitResponse}
                            disabled={submittingResponse || isAutoSubmitting}
                            className="flex items-center space-x-2"
                          >
                            <Send className="h-4 w-4" />
                            {submittingResponse ? 'Submitting...' : (currentQuestion?.type === 'completion' ? 'Complete Interview' : 'Submit Response')}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full space-y-4">
                        <Textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Type your response here..."
                          rows={4}
                          className="w-full"
                        />
                        <div className="flex justify-end">
                          <Button
                            onClick={handleSubmitResponse}
                            disabled={submittingResponse || !response.trim()}
                            className="flex items-center space-x-2"
                          >
                            <Send className="h-4 w-4" />
                            {submittingResponse ? 'Submitting...' : (currentQuestion?.type === 'completion' ? 'Complete Interview' : 'Submit Response')}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      variant={isTextMode ? "default" : "outline"}
                      onClick={() => setIsTextMode(!isTextMode)}
                      className="flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {isTextMode ? "Switch to Voice" : "Switch to Text"}
                    </Button>
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Interview Notes:
                    </label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about the candidate's responses..."
                      rows={3}
                    />
                  </div>

                  {/* Complete Interview Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleCompleteInterview}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Square className="h-4 w-4" />
                      Complete Interview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

