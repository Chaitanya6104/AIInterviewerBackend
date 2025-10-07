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
import { AvatarConfig, preloadAudio, preloadMultipleAudio, speakWithAvatar } from '@/lib/avatar'

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
  
  const router = useRouter()
  const params = useParams()
  const interviewId = params?.id as string
  
  const { data: interview, isLoading: interviewLoading } = useInterview(parseInt(interviewId))
  
  const startInterviewMutation = useStartInterview()
  const analyzeResponseMutation = useAnalyzeResponse()
  const transcribeAudioMutation = useTranscribeAudio()
  const completeInterviewMutation = useCompleteInterview()
  const storeResponseMutation = useStoreResponse()
  const storeQuestionsMutation = useStoreQuestions()
  
  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        setResponse(prev => prev + finalTranscript)
        setInterimResponse(interimTranscript)
      }
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
      }
    }
  }, [])
  
  // Load interview data
  useEffect(() => {
    if (interview) {
      console.log('Interview loaded:', interview)
      if (interview.questions && interview.questions.length > 0) {
        setQuestions(interview.questions)
        setCurrentQuestion(interview.questions[0])
        setCurrentQuestionIndex(0)
      }
    }
  }, [interview])
  
  // Start interview
  const handleStartInterview = async () => {
    if (!interview) return
    
    try {
      setLoading(true)
      const result = await startInterviewMutation.mutateAsync(interview.id)
      
      if (result.data.questions && result.data.questions.length > 0) {
        setQuestions(result.data.questions)
        setCurrentQuestion(result.data.questions[0])
        setCurrentQuestionIndex(0)
        setIsInterviewStarted(true)
        
        // Store questions in the database
        await storeQuestionsMutation.mutateAsync({
          interview_id: interview.id,
          questions: result.data.questions
        })
        
        // Speak the first question
        if (result.data.questions[0]) {
          await speakQuestion(result.data.questions[0])
        }
      }
    } catch (error) {
      console.error('Error starting interview:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Speak question with avatar
  const speakQuestion = async (question: any) => {
    if (!question) return
    
    try {
      setIsAvatarSpeaking(true)
      setAvatarText(question.question)
      
      // Preload audio for better performance
      await preloadAudio(question.question, avatarConfig)
      
      // Speak the question
      await speakWithAvatar(question.question, avatarConfig, () => {
        setIsAvatarSpeaking(false)
      })
    } catch (error) {
      console.error('Error speaking question:', error)
      setIsAvatarSpeaking(false)
    }
  }
  
  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await handleAudioSubmission(audioBlob)
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setResponseStartTime(Date.now())
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }
  
  // Handle audio submission
  const handleAudioSubmission = async (audioBlob: Blob) => {
    if (!currentQuestion || !interview) return
    
    try {
      setSubmittingResponse(true)
      
      // Transcribe audio
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' })
      const transcriptionResult = await transcribeAudioMutation.mutateAsync(audioFile)
      const transcribedText = transcriptionResult.data.transcript
      
      // Update response with transcribed text
      setResponse(transcribedText)
      
      // Analyze response
      const analysisResult = await analyzeResponseMutation.mutateAsync({
        interview_id: interview.id,
        question_id: currentQuestion.id,
        response_text: transcribedText
      })
      
      // Store response
      const responseData = {
        interview_id: interview.id,
        question_id: currentQuestion.id,
        response_text: transcribedText,
        response_duration_seconds: responseStartTime ? Math.round((Date.now() - responseStartTime) / 1000) : 0
      }
      
      await storeResponseMutation.mutateAsync(responseData)
      
      // Add to all responses
      setAllResponses(prev => [...prev, responseData])
      
      // Move to next question
      handleNextQuestion()
      
    } catch (error) {
      console.error('Error processing audio:', error)
    } finally {
      setSubmittingResponse(false)
    }
  }
  
  // Handle text submission
  const handleTextSubmission = async () => {
    if (!currentQuestion || !interview || !response.trim()) return
    
    try {
      setSubmittingResponse(true)
      
      // Analyze response
      const analysisResult = await analyzeResponseMutation.mutateAsync({
        interview_id: interview.id,
        question_id: currentQuestion.id,
        response_text: response
      })
      
      // Store response
      const responseData = {
        interview_id: interview.id,
        question_id: currentQuestion.id,
        response_text: response,
        response_duration_seconds: responseStartTime ? Math.round((Date.now() - responseStartTime) / 1000) : 0
      }
      
      await storeResponseMutation.mutateAsync(responseData)
      
      // Add to all responses
      setAllResponses(prev => [...prev, responseData])
      
      // Move to next question
      handleNextQuestion()
      
    } catch (error) {
      console.error('Error processing text response:', error)
    } finally {
      setSubmittingResponse(false)
    }
  }
  
  // Move to next question
  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex)
      setCurrentQuestion(questions[nextIndex])
      setResponse('')
      setInterimResponse('')
      setResponseStartTime(Date.now())
      
      // Speak the next question
      speakQuestion(questions[nextIndex])
    } else {
      // Interview completed
      handleCompleteInterview()
    }
  }
  
  // Complete interview
  const handleCompleteInterview = async () => {
    if (!interview) return
    
    try {
      setLoading(true)
      await completeInterviewMutation.mutateAsync(interview.id)
      
      // Redirect to report
      router.push(`/interviews/${interview.id}?action=report`)
    } catch (error) {
      console.error('Error completing interview:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (interviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interview...</p>
        </div>
      </div>
    )
  }
  
  if (!interview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Interview not found</h1>
          <Link href="/interviews">
            <Button variant="outline">Back to Interviews</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/interviews">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {interview.candidate?.full_name || 'Interview'}
                </h1>
                <p className="text-gray-600">
                  {interview.position} - {safeDateFormat(interview.created_at)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTextMode(!isTextMode)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isTextMode ? 'Voice Mode' : 'Text Mode'}
              </Button>
            </div>
          </div>
          
          {/* Interview Content */}
          {!isInterviewStarted ? (
            <Card>
              <CardHeader>
                <CardTitle>Ready to Start?</CardTitle>
                <CardDescription>
                  This interview will test your technical and communication skills.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-600">
                      Estimated time: 30-45 minutes
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">
                      AI-powered analysis
                    </span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button
                    onClick={handleStartInterview}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Starting...' : 'Start Interview'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Question Section */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Question {currentQuestionIndex + 1}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-lg text-gray-800">
                        {currentQuestion?.question}
                      </p>
                      
                      {/* Avatar */}
                      <div className="flex justify-center">
                        <Avatar
                          isSpeaking={isAvatarSpeaking}
                          text={avatarText}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => speakQuestion(currentQuestion)}
                          disabled={isAvatarSpeaking}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Replay Question
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Response Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isTextMode ? (
                      <div className="space-y-4">
                        <Textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Type your response here..."
                          rows={6}
                          className="w-full"
                        />
                        <div className="flex justify-end">
                          <Button
                            onClick={handleTextSubmission}
                            disabled={!response.trim() || submittingResponse}
                          >
                            {submittingResponse ? 'Submitting...' : 'Submit Response'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <Button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={submittingResponse}
                            className={`w-32 h-32 rounded-full ${
                              isRecording 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {isRecording ? (
                              <Square className="h-8 w-8" />
                            ) : (
                              <Mic className="h-8 w-8" />
                            )}
                          </Button>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-600">
                            {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                          </p>
                        </div>
                        
                        {response && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Your response:</p>
                            <div className="bg-gray-100 p-3 rounded-lg">
                              <p className="text-gray-800">{response}</p>
                              {interimResponse && (
                                <p className="text-gray-500 italic">{interimResponse}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Progress Section */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Questions completed</span>
                        <span>{currentQuestionIndex} / {questions.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Notes Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes here..."
                      rows={4}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
