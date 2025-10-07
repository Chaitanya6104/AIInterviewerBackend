'use client'

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Calendar, User, Brain, Mic, MessageSquare, Clock, Target } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { useCandidates, useCreateInterview, useGenerateQuestions } from '@/lib/hooks'
import { safeRender } from '@/lib/utils'
import ProtectedRoute from '@/components/ProtectedRoute'

function NewInterviewContent() {
  const [formData, setFormData] = useState({
    title: '',
    candidate_id: '',
    description: '',
    interview_type: 'mixed' as 'voice' | 'text' | 'mixed',
    duration_minutes: '30',
    difficulty_level: 'medium',
    question_count: '10',
    role_focus: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates()
  const createInterview = useCreateInterview()
  const generateQuestions = useGenerateQuestions()

  // Pre-fill candidate if coming from candidates page
  useEffect(() => {
    const candidateId = searchParams?.get('candidate')
    if (candidateId && candidates.length > 0) {
      const candidate = candidates.find((c: any) => c.id === parseInt(candidateId))
      if (candidate) {
        setFormData(prev => ({
          ...prev,
          candidate_id: candidateId,
          title: `Interview with ${candidate.full_name}`,
          role_focus: candidate.current_position || 'General'
        }))
        setSelectedCandidate(candidate)
      }
    }
  }, [searchParams, candidates])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCandidateSelect = (candidateId: string) => {
    // Ignore placeholder values
    if (candidateId === 'loading' || candidateId === 'no-candidates') {
      return
    }
    
    const candidate = candidates.find((c: any) => c.id === parseInt(candidateId))
    setSelectedCandidate(candidate)
    setFormData(prev => ({
      ...prev,
      candidate_id: candidateId,
      title: candidate ? `Interview with ${candidate.full_name}` : '',
      role_focus: candidate?.current_position || ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Create interview
      const interviewData = {
        title: formData.title,
        candidate_id: parseInt(formData.candidate_id),
        description: formData.description || undefined,
        interview_type: formData.interview_type,
        duration_minutes: parseInt(formData.duration_minutes),
        difficulty_level: formData.difficulty_level,
        question_count: parseInt(formData.question_count),
        role_focus: formData.role_focus
      }

      const response = await createInterview.mutateAsync(interviewData)
      console.log('Interview created:', response.data)

      // Generate questions for the interview (async, don't wait)
      if (response.data.data.id) {
        generateQuestions.mutateAsync({
          candidate_id: parseInt(formData.candidate_id),
          role_focus: formData.role_focus,
          difficulty: formData.difficulty_level,
          question_count: parseInt(formData.question_count)
        }).then(() => {
          console.log('Questions generated successfully')
        }).catch((questionError) => {
          console.warn('Failed to generate questions:', questionError)
          // Continue anyway - questions can be generated later
        })
      }

      setSuccess(true)
      // Immediate redirect without delay
      router.push(`/interviews/${response.data.data.id}/start`)

    } catch (error: any) {
      console.error('Error creating interview:', error)
      let errorMessage = 'Failed to create interview. Please try again.'
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => err.msg || err).join(', ')
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Created!</h2>
              <p className="text-gray-600 mb-4">
                Your interview with {safeRender(selectedCandidate?.full_name)} has been scheduled.
              </p>
              <p className="text-sm text-gray-500">Redirecting to interview...</p>
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
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Schedule New Interview</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Interview Configuration</CardTitle>
                <CardDescription>
                  Set up a new AI-powered interview with your candidate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Candidate Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Select Candidate
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="candidate_id">Candidate *</Label>
                      <Select value={formData.candidate_id} onValueChange={handleCandidateSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a candidate" />
                        </SelectTrigger>
                        <SelectContent>
                          {candidatesLoading ? (
                            <SelectItem value="loading" disabled>Loading candidates...</SelectItem>
                          ) : candidates.length === 0 ? (
                            <SelectItem value="no-candidates" disabled>No candidates available</SelectItem>
                          ) : (
                            candidates.map((candidate: any) => (
                              <SelectItem key={candidate.id} value={candidate.id.toString()}>
                                {safeRender(candidate.full_name)} - {safeRender(candidate.current_position || 'No position')}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCandidate && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900">Selected Candidate</h4>
                        <p className="text-blue-700">
                          {safeRender(selectedCandidate.full_name)} - {safeRender(selectedCandidate.current_position || 'No position')}
                        </p>
                        <p className="text-sm text-blue-600">
                          {safeRender(selectedCandidate.email)} • {selectedCandidate.experience_years || 0} years experience
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Interview Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      Interview Details
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Interview Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Frontend Developer Interview"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role_focus">Role Focus *</Label>
                      <Input
                        id="role_focus"
                        name="role_focus"
                        value={formData.role_focus}
                        onChange={handleInputChange}
                        placeholder="e.g., Frontend Developer, DevOps Engineer, Product Manager"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Additional notes about this interview..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Interview Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Interview Settings
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="interview_type">Interview Type</Label>
                        <Select value={formData.interview_type} onValueChange={(value) => handleSelectChange('interview_type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="voice">
                              <div className="flex items-center">
                                <Mic className="h-4 w-4 mr-2" />
                                Voice Only
                              </div>
                            </SelectItem>
                            <SelectItem value="text">
                              <div className="flex items-center">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Text Only
                              </div>
                            </SelectItem>
                            <SelectItem value="mixed">
                              <div className="flex items-center">
                                <Brain className="h-4 w-4 mr-2" />
                                Mixed (Voice + Text)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                        <Select value={formData.duration_minutes} onValueChange={(value) => handleSelectChange('duration_minutes', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="difficulty_level">Difficulty Level</Label>
                        <Select value={formData.difficulty_level} onValueChange={(value) => handleSelectChange('difficulty_level', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="question_count">Number of Questions</Label>
                        <Select value={formData.question_count} onValueChange={(value) => handleSelectChange('question_count', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 questions</SelectItem>
                            <SelectItem value="10">10 questions</SelectItem>
                            <SelectItem value="15">15 questions</SelectItem>
                            <SelectItem value="20">20 questions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/interviews')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading || !formData.candidate_id}>
                      {loading ? 'Creating Interview...' : 'Create Interview'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function NewInterviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewInterviewContent />
    </Suspense>
  )
}
