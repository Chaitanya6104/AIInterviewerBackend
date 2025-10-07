'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Download, FileText, Brain, Target, Clock, TrendingUp, Star, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useInterview, useInterviewReport, useGenerateFeedback, useScoreInterview, useExportPDF, useRegenerateAnalysis, useCreateScores } from '@/lib/hooks'
import { aiAPI } from '@/lib/api'
import { safeRender, safeDateFormat, safeNumberFormat } from '@/lib/utils'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function InterviewReportPage() {
  const [generatingReport, setGeneratingReport] = useState(false)
  
  const router = useRouter()
  const pathname = usePathname()
  
  // Extract interview ID from URL path
  const getInterviewId = () => {
    if (pathname) {
      const pathParts = pathname.split('/')
      const interviewsIndex = pathParts.indexOf('interviews')
      if (interviewsIndex !== -1 && pathParts[interviewsIndex + 1]) {
        return pathParts[interviewsIndex + 1]
      }
    }
    return null
  }
  
  const interviewId = getInterviewId()
  
  const { data: interview, isLoading } = useInterview(interviewId ? parseInt(interviewId) : 0)
  const { data: report, isLoading: reportLoading } = useInterviewReport(interviewId ? parseInt(interviewId) : 0)
  
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

    const responses = report.transcript
    let totalTechnical = 0
    let totalCommunication = 0
    let totalProblemSolving = 0
    let totalCulturalFit = 0
    let validResponses = 0

    responses.forEach((response: any) => {
      if (response.analysis && response.analysis.scores) {
        const scores = response.analysis.scores
        totalTechnical += scores.technical || 0
        totalCommunication += scores.communication || 0
        totalProblemSolving += scores.problem_solving || 0
        totalCulturalFit += scores.cultural_fit || 0
        validResponses++
      }
    })

    if (validResponses === 0) {
      return {
        technical_score: 0,
        communication_score: 0,
        problem_solving_score: 0,
        cultural_fit_score: 0
      }
    }

    return {
      technical_score: Math.round(totalTechnical / validResponses),
      communication_score: Math.round(totalCommunication / validResponses),
      problem_solving_score: Math.round(totalProblemSolving / validResponses),
      cultural_fit_score: Math.round(totalCulturalFit / validResponses)
    }
  }

  const detailedScores = report ? calculateDetailedScores(report) : null

  if (isLoading) {
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/interviews">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Interviews
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Interview Report
                </h1>
                <p className="text-gray-600">
                  {interview.candidate?.full_name} - {interview.position}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {safeDateFormat(interview.created_at)}
              </Badge>
            </div>
          </div>

          {/* Report Content */}
          {reportLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Generating report...</p>
              </div>
            </div>
          ) : report ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Scores Overview */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Overall Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {safeNumberFormat(report.overall_score || 0)}%
                        </div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {safeNumberFormat(report.technical_score || 0)}%
                        </div>
                        <div className="text-sm text-gray-600">Technical Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Scores */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Technical Skills</span>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={report.technical_score || 0} 
                            className="w-24"
                          />
                          <span className="text-sm text-gray-600">
                            {safeNumberFormat(report.technical_score || 0)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Communication</span>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={report.communication_score || 0} 
                            className="w-24"
                          />
                          <span className="text-sm text-gray-600">
                            {safeNumberFormat(report.communication_score || 0)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Problem Solving</span>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={report.problem_solving_score || 0} 
                            className="w-24"
                          />
                          <span className="text-sm text-gray-600">
                            {safeNumberFormat(report.problem_solving_score || 0)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Cultural Fit</span>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={report.cultural_fit_score || 0} 
                            className="w-24"
                          />
                          <span className="text-sm text-gray-600">
                            {safeNumberFormat(report.cultural_fit_score || 0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feedback */}
                {report.feedback && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="h-5 w-5" />
                        <span>Feedback</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        {safeRender(report.feedback)}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Transcript */}
                {report.transcript && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Interview Transcript</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {report.transcript.map((item: any, index: number) => (
                          <div key={index} className="border-l-4 border-blue-200 pl-4">
                            <div className="font-medium text-gray-900 mb-2">
                              Question {index + 1}
                            </div>
                            <div className="text-gray-700 mb-2">
                              {item.question}
                            </div>
                            <div className="text-gray-600">
                              {item.response}
                            </div>
                            {item.analysis && (
                              <div className="mt-2 text-sm text-gray-500">
                                <strong>Analysis:</strong> {item.analysis.summary}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Interview Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-600">Candidate</div>
                        <div className="text-sm text-gray-900">
                          {interview.candidate?.full_name}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Position</div>
                        <div className="text-sm text-gray-900">
                          {interview.position}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Date</div>
                        <div className="text-sm text-gray-900">
                          {safeDateFormat(interview.created_at)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Status</div>
                        <Badge variant="outline">
                          {interview.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.print()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Print Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Report Available</CardTitle>
                <CardDescription>
                  The interview report is not yet available. Please try again later.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Refresh
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
