'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Clock, Users, Play, Eye, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useInterviews } from '@/lib/hooks'
import { safeRender, safeDateFormat, safeNumberFormat } from '@/lib/utils'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function InterviewsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const { data: interviews = [], isLoading } = useInterviews(0, 100, statusFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'in_progress': return 'secondary'
      case 'scheduled': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'in_progress': return 'In Progress'
      case 'scheduled': return 'Scheduled'
      default: return status
    }
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AI Interviewer</span>
            </div>
            <nav className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/interviews" className="text-blue-600 font-semibold">Interviews</Link>
              <Link href="/candidates" className="text-gray-600 hover:text-gray-900">Candidates</Link>
              <Button asChild>
                <Link href="/login">Logout</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Interviews</h1>
            <p className="text-gray-600">Manage and track all your interview sessions</p>
          </div>
          <Button asChild>
            <Link href="/interviews/new">
              <Plus className="mr-2 h-4 w-4" />
              New Interview
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : interviews.length}
              </div>
              <p className="text-xs text-muted-foreground">
                All time interviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interviews.filter((i: any) => i.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully finished
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interviews.filter((i: any) => i.status === 'in_progress').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interviews List */}
        <Card>
          <CardHeader>
            <CardTitle>Interview Sessions</CardTitle>
            <CardDescription>All your interview sessions and their status</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                {interviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No interviews found. Start your first interview!</p>
                  </div>
                ) : (
                  interviews.map((interview: any) => (
                    <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {interview.candidate?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'JD'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{safeRender(interview.candidate?.full_name || 'Unknown Candidate')}</p>
                          <p className="text-gray-600">{safeRender(interview.role_focus || 'General Interview')}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {safeDateFormat(interview.created_at)}
                            </span>
                            {interview.started_at && (
                              <span className="text-sm text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {Math.round((new Date(interview.completed_at || new Date()).getTime() - new Date(interview.started_at).getTime()) / 60000)} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {interview.overall_score && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">{safeNumberFormat(interview.overall_score)}%</p>
                            <p className="text-xs text-gray-500">Score</p>
                          </div>
                        )}
                        
                        <Badge variant={getStatusColor(interview.status)}>
                          {getStatusText(interview.status)}
                        </Badge>
                        
                        <div className="flex space-x-2">
                          {interview.status === 'scheduled' && (
                            <Button size="sm" asChild>
                              <Link href={`/interviews/${interview.id}/start`}>
                                <Play className="h-4 w-4 mr-1" />
                                Start
                              </Link>
                            </Button>
                          )}
                          
                          {interview.status === 'in_progress' && (
                            <Button size="sm" asChild>
                              <Link href={`/interviews/${interview.id}`}>
                                <Play className="h-4 w-4 mr-1" />
                                Continue
                              </Link>
                            </Button>
                          )}
                          
                          {interview.status === 'completed' && (
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/interviews/${interview.id}/report`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View Report
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ProtectedRoute>
  )
}
