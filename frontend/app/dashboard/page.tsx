'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Calendar, TrendingUp, Brain, Mic, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth, useInterviews, useCandidates } from '@/lib/hooks'
import { safeRender, safeDateFormat, safeNumberFormat } from '@/lib/utils'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { data: interviews = [], isLoading: interviewsLoading } = useInterviews(0, 10)
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates(0, 100)

  // Calculate stats from real data
  const stats = {
    totalInterviews: interviews.length,
    completedInterviews: interviews.filter((i: any) => i.status === 'completed').length,
    activeCandidates: candidates.length,
    avgScore: interviews
      .filter((i: any) => i.overall_score)
      .reduce((acc: number, i: any) => acc + i.overall_score, 0) / 
      Math.max(interviews.filter((i: any) => i.overall_score).length, 1)
  }

  const recentInterviews = interviews.slice(0, 5)

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AI Interviewer</span>
            </div>
            <nav className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-blue-600 font-semibold">Dashboard</Link>
              <Link href="/interviews" className="text-gray-600 hover:text-gray-900">Interviews</Link>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {safeRender(user?.full_name || user?.username || 'User')}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interviewsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalInterviews}
              </div>
              <p className="text-xs text-muted-foreground">
                Total interviews conducted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedInterviews}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalInterviews > 0 ? Math.round((stats.completedInterviews / stats.totalInterviews) * 100) : 0}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {candidatesLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeCandidates}
              </div>
              <p className="text-xs text-muted-foreground">
                Total candidates in database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isNaN(stats.avgScore) ? 'N/A' : safeNumberFormat(stats.avgScore)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average interview score
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Start a new interview or manage candidates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link href="/interviews/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Interview
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/candidates/new">
                  <Users className="mr-2 h-4 w-4" />
                  Add Candidate
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/interviews">
                  <Mic className="mr-2 h-4 w-4" />
                  View All Interviews
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Interviews */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Interviews</CardTitle>
              <CardDescription>Latest interview sessions and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInterviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No interviews yet. Start your first interview!</p>
                  </div>
                ) : (
                  recentInterviews.map((interview: any) => (
                    <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {interview.candidate?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'JD'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{safeRender(interview.candidate?.full_name || 'Unknown Candidate')}</p>
                          <p className="text-sm text-gray-600">{safeRender(interview.role_focus || 'General Interview')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                          {interview.status === 'completed' ? 'Completed' : 
                           interview.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                        </Badge>
                        {interview.overall_score && (
                          <div className="text-right">
                            <p className="font-semibold text-lg">{safeNumberFormat(interview.overall_score)}%</p>
                            <p className="text-xs text-gray-600">
                              {safeDateFormat(interview.created_at)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
