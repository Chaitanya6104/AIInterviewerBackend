'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Users, Mail, Phone, MapPin, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useCandidates } from '@/lib/hooks'
import { safeRender, safeDateFormat } from '@/lib/utils'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function CandidatesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: candidates = [], isLoading } = useCandidates()

  const filteredCandidates = candidates.filter((candidate: any) =>
    candidate.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.current_position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'interviewing': return 'secondary'
      case 'pending': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'interviewing': return 'Interviewing'
      case 'pending': return 'Pending'
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
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AI Interviewer</span>
            </div>
            <nav className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/interviews" className="text-gray-600 hover:text-gray-900">Interviews</Link>
              <Link href="/candidates" className="text-blue-600 font-semibold">Candidates</Link>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Candidates</h1>
            <p className="text-gray-600">Manage your candidate database and profiles</p>
          </div>
          <Button asChild>
            <Link href="/candidates/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : candidates.length}
              </div>
              <p className="text-xs text-muted-foreground">
                In database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {candidates.filter((c: any) => c.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for interviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviewing</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {candidates.filter((c: any) => c.status === 'interviewing').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently in process
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {candidates.filter((c: any) => c.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting interviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search candidates by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate Profiles</CardTitle>
            <CardDescription>Manage and view all candidate information</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                {filteredCandidates.map((candidate: any) => (
                  <div key={candidate.id} className="flex items-center justify-between p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {candidate.full_name?.split(' ').map((n: string) => n[0]).join('') || 'JD'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <p className="font-semibold text-lg">{safeRender(candidate.full_name || 'Unknown')}</p>
                          <Badge variant="default">
                            Active
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{safeRender(candidate.email || '')}</span>
                          </div>
                          {candidate.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{safeRender(candidate.phone || '')}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{candidate.current_position || 'Position not specified'} • {candidate.experience_years || 0} years</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Added: {safeDateFormat(candidate.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex space-x-2">
                        <Button size="sm" asChild>
                          <Link href={`/interviews/new?candidate=${candidate.id}`}>
                            Schedule Interview
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              
              {filteredCandidates.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No candidates found matching your search.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ProtectedRoute>
  )
}
