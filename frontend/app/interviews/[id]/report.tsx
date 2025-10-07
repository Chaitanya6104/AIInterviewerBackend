'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Download, FileText, Brain, Target, Clock, TrendingUp, Star, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useInterview, useInterviewReport, useGenerateFeedback, useScoreInterview, useExportPDF, useRegenerateAnalysis, useCreateScores } from '@/lib/hooks'
import { aiAPI } from '@/lib/api'
import { safeRender, safeDateFormat, safeNumberFormat } from '@/lib/utils'
import ProtectedRoute from '@/components/ProtectedRoute'

// Static export configuration
export const dynamicParams = true

export default function InterviewReportPage() {
  const [generatingReport, setGeneratingReport] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const interviewId = params?.id as string
  
  const { data: interview, isLoading } = useInterview(parseInt(interviewId))
  const { data: report, isLoading: reportLoading } = useInterviewReport(parseInt(interviewId))
  
  // Debug: Log report data
  useEffect(() => {
    if (report) {
      console.log('📊 Report Data:', report)
      console.log('📊 Scores Breakdown:', report.scores_breakdown)
      console.log('📊 Technical Score:', report.technical_score)
      console.log('📊 Communication Score:', report.communication_score)
    }
  }, [report])

  // Calculate detailed scores from individual responses if not available
  const calculateDetailedScores = (report: any) => {
    if (!report || !report.transcript || !Array.isArray(report.transcript)) {
      return {
        technical_score: 0,
        communication_score: 0,
        problem_solving_score: 0,
        cultural_fit_score: 0
      }
    }

    // Extract scores from transcript responses
    const responses = report.transcript.filter((item: any) => item.type === 'candidate')
    let totalTechnical = 0
    let totalCommunication = 0
    let totalProblemSolving = 0
    let totalCulturalFit = 0
    let responseCount = 0

    responses.forEach((response: any) => {
      if (response.score) {
        // Distribute the score across different categories based on response content
        const content = response.content?.toLowerCase() || ''
        
        // Technical score based on technical keywords
        if (content.includes('data') || content.includes('analysis') || content.includes('python') || 
            content.includes('sql') || content.includes('visualization') || content.includes('statistics')) {
          totalTechnical += response.score
        } else {
          totalTechnical += response.score * 0.3 // Default technical score
        }
        
        // Communication score based on response length and clarity
        const wordCount = content.split(' ').length
        if (wordCount > 20) {
          totalCommunication += response.score * 0.9
        } else {
          totalCommunication += response.score * 0.6
        }
        
        // Problem solving based on structured responses
        if (content.includes('step') || content.includes('process') || content.includes('approach')) {
          totalProblemSolving += response.score * 0.9
        } else {
          totalProblemSolving += response.score * 0.7
        }
        
        // Cultural fit based on collaboration mentions
        if (content.includes('team') || content.includes('collaborate') || content.includes('work together')) {
          totalCulturalFit += response.score * 0.9
        } else {
          totalCulturalFit += response.score * 0.6
        }
        
        responseCount++
      }
    })

    if (responseCount === 0) {
      return {
        technical_score: 0,
        communication_score: 0,
        problem_solving_score: 0,
        cultural_fit_score: 0
      }
    }

    return {
      technical_score: Math.round((totalTechnical / responseCount) * 10),
      communication_score: Math.round((totalCommunication / responseCount) * 10),
      problem_solving_score: Math.round((totalProblemSolving / responseCount) * 10),
      cultural_fit_score: Math.round((totalCulturalFit / responseCount) * 10)
    }
  }

  // Get calculated scores
  const calculatedScores = report ? calculateDetailedScores(report) : {
    technical_score: 0,
    communication_score: 0,
    problem_solving_score: 0,
    cultural_fit_score: 0
  }
  const generateFeedback = useGenerateFeedback()
  const scoreInterview = useScoreInterview()
  const exportPDF = useExportPDF()
  const regenerateAnalysis = useRegenerateAnalysis()
  const createScores = useCreateScores()

  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {
      // Generate AI feedback
      await generateFeedback.mutateAsync(parseInt(interviewId))
      
      // Score the interview
      await scoreInterview.mutateAsync(parseInt(interviewId))
      
      // Refresh the report data
      window.location.reload()
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleRegenerateAnalysis = async () => {
    setGeneratingReport(true)
    try {
      // Regenerate comprehensive analysis
      await regenerateAnalysis.mutateAsync(parseInt(interviewId))
      
      // Refresh the report data
      window.location.reload()
    } catch (error) {
      console.error('Failed to regenerate analysis:', error)
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleDebugInterview = async () => {
    try {
      const debugData = await aiAPI.debugInterview(parseInt(interviewId))
      console.log('🔍 Interview Debug Data:', debugData.data)
      alert(`Debug data logged to console. Found ${debugData.data.counts.responses} responses and ${debugData.data.counts.questions} questions.`)
    } catch (error) {
      console.error('Failed to debug interview:', error)
      alert('Failed to debug interview. Check console for details.')
    }
  }

  const handleCreateScores = async () => {
    setGeneratingReport(true)
    try {
      await createScores.mutateAsync(parseInt(interviewId))
      alert('Score records created successfully!')
      window.location.reload()
    } catch (error) {
      console.error('Failed to create scores:', error)
      alert('Failed to create scores. Check console for details.')
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleDownloadReport = async () => {
    try {
      console.log('Downloading report...')
      const response = await exportPDF.mutateAsync(parseInt(interviewId))
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = `interview_report_${interviewId}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log('PDF downloaded successfully')
    } catch (error) {
      console.error('Failed to download PDF:', error)
      alert('Failed to download PDF report. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading interview report...</p>
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
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Interview Report</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {(!report?.overall_score || report.overall_score === 0) && (
                  <Button 
                    onClick={handleGenerateReport} 
                    disabled={generatingReport}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    {generatingReport ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  onClick={handleRegenerateAnalysis} 
                  disabled={generatingReport}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  {generatingReport ? (
                    <>
                      <Brain className="h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Regenerate Analysis
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleCreateScores}
                  disabled={generatingReport}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  {generatingReport ? (
                    <>
                      <Brain className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Create Scores
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleDebugInterview}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Debug Data
                </Button>
                <Button onClick={handleDownloadReport} className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Interview Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Overview</CardTitle>
                <CardDescription>
                  Complete analysis of the interview session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Brain className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg">{safeRender(interview.candidate?.full_name)}</h3>
                    <p className="text-gray-600">{safeRender(interview.candidate?.current_position)}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg">{safeRender(interview.role_focus)}</h3>
                    <p className="text-gray-600">Position Applied For</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-lg">{interview.duration_minutes} min</h3>
                    <p className="text-gray-600">Interview Duration</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            {reportLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating AI analysis...</p>
                  </div>
                </CardContent>
              </Card>
            ) : report ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overall Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Overall Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-6xl font-bold text-blue-600 mb-2">
                        {safeNumberFormat(report.overall_score || 0)}%
                      </div>
                      <Progress value={report.overall_score || 0} className="w-full mb-4" />
                      <p className="text-gray-600">
                        {report.overall_score >= 80 ? 'Excellent' : 
                         report.overall_score >= 60 ? 'Good' : 
                         report.overall_score >= 40 ? 'Fair' : 'Needs Improvement'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Scores */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Detailed Scores</CardTitle>
                      {(!report.technical_score && !report.communication_score && !report.problem_solving_score && !report.cultural_fit_score) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleRegenerateAnalysis}
                          disabled={generatingReport}
                          className="text-xs"
                        >
                          {generatingReport ? 'Generating...' : 'Generate AI Scores'}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Technical Skills</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={report.technical_score || calculatedScores.technical_score || 0} className="w-24" />
                          <span className="text-sm font-semibold">{safeNumberFormat(report.technical_score || calculatedScores.technical_score || 0)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Communication</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={report.communication_score || calculatedScores.communication_score || 0} className="w-24" />
                          <span className="text-sm font-semibold">{safeNumberFormat(report.communication_score || calculatedScores.communication_score || 0)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Problem Solving</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={report.problem_solving_score || calculatedScores.problem_solving_score || 0} className="w-24" />
                          <span className="text-sm font-semibold">{safeNumberFormat(report.problem_solving_score || calculatedScores.problem_solving_score || 0)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Cultural Fit</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={report.cultural_fit_score || calculatedScores.cultural_fit_score || 0} className="w-24" />
                          <span className="text-sm font-semibold">{safeNumberFormat(report.cultural_fit_score || calculatedScores.cultural_fit_score || 0)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Generate AI Analysis</h3>
                    <p className="text-gray-600 mb-6">
                      Get detailed AI-powered insights and scoring for this interview
                    </p>
                    <Button 
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                      className="flex items-center space-x-2"
                    >
                      <Brain className="h-4 w-4" />
                      {generatingReport ? 'Generating...' : 'Generate Report'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Feedback */}
            {report?.ai_feedback && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    AI Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {safeRender(report.ai_feedback)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interview Transcript */}
            {report?.transcript && (
              <Card>
                <CardHeader>
                  <CardTitle>Interview Transcript</CardTitle>
                  <CardDescription>
                    Complete conversation between AI interviewer and candidate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {(() => {
                        console.log('Report transcript:', report.transcript)
                        console.log('Transcript type:', typeof report.transcript)
                        console.log('Is array:', Array.isArray(report.transcript))
                        
                        // Handle different transcript formats
                        let transcriptArray = []
                        if (Array.isArray(report.transcript)) {
                          transcriptArray = report.transcript
                        } else if (report.transcript && typeof report.transcript === 'object') {
                          // If it's an object, check for different structures
                          if (report.transcript.transcript && Array.isArray(report.transcript.transcript)) {
                            // Structure: {transcript: [...], notes: ''}
                            transcriptArray = report.transcript.transcript
                          } else if (report.transcript.responses && Array.isArray(report.transcript.responses)) {
                            // Build conversation from responses
                            transcriptArray = []
                            report.transcript.responses.forEach((response: any, index: number) => {
                              if (response.question) {
                                transcriptArray.push({
                                  speaker: 'ai',
                                  text: response.question.question || response.question.content,
                                  timestamp: new Date().toISOString(),
                                  type: 'question'
                                })
                              }
                              if (response.response) {
                                transcriptArray.push({
                                  speaker: 'candidate',
                                  text: response.response,
                                  timestamp: response.timestamp,
                                  type: 'response',
                                  score: response.score
                                })
                              }
                            })
                          }
                        }
                        
                        return transcriptArray.map((entry: any, index: number) => (
                        <div key={index} className={`flex ${entry.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            entry.speaker === 'ai' 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className="font-semibold text-sm mb-1">
                              {entry.speaker === 'ai' ? 'AI Interviewer' : 'Candidate'}
                            </div>
                            <p className="text-sm">{safeRender(entry.text)}</p>
                          </div>
                        </div>
                        ))
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {report?.recommendations && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <p className="text-gray-800">{safeRender(rec)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/interviews">Back to Interviews</Link>
              </Button>
              <Button onClick={handleDownloadReport} className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                Download Full Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
