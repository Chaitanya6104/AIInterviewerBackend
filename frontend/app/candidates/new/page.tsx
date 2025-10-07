'use client'

import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { ArrowLeft, Upload, FileText, User, Mail, Phone, Briefcase, Calendar, Brain } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCreateCandidate, useUploadResume, useAnalyzeResume } from '../../../lib/hooks'
import { safeRender } from '../../../lib/utils'
import ProtectedRoute from '../../../components/ProtectedRoute'

export default function NewCandidatePage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    current_position: '',
    current_company: '',
    experience_years: '',
    skills: '',
    bio: ''
  })
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  
  const router = useRouter()
  const createCandidate = useCreateCandidate()
  const uploadResume = useUploadResume()
  const analyzeResume = useAnalyzeResume()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setResumeFile(file)
      setIsAnalyzing(true)
      setError('')
      
      try {
        // Read file content
        let text = ''
        
        if (file.type === 'application/pdf') {
          console.log('PDF file detected, sending to backend for processing...')
          
          try {
            // Send PDF to backend for text extraction
            const formData = new FormData()
            formData.append('file', file)
            
            // Get auth token
            const token = localStorage.getItem('auth_token')
            const headers: HeadersInit = {}
            if (token) {
              headers['Authorization'] = `Bearer ${token}`
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/extract-pdf-text`, {
              method: 'POST',
              headers,
              body: formData,
            })
            
            if (!response.ok) {
              throw new Error('Failed to extract text from PDF')
            }
            
            const result = await response.json()
            text = result.text
            
            console.log('PDF text extracted successfully, length:', text.length)
            
            if (!text || text.length === 0) {
              throw new Error('No text could be extracted from the PDF file')
            }
          } catch (pdfError) {
            console.error('PDF parsing failed:', pdfError)
            // Fallback: ask user to provide text manually
            throw new Error('PDF text extraction failed. Please try uploading a different PDF file or fill in the form manually.')
          }
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          // For plain text files
          text = await file.text()
        } else {
          // For DOC/DOCX files, we'll need a different approach
          console.log('Unsupported file type for text extraction:', file.type)
          throw new Error('Please upload a PDF file for automatic text extraction')
        }
        
        console.log('File content length:', text.length)
        console.log('File content preview:', text.substring(0, 200))
        
        // Analyze resume with AI
        const analysis = await analyzeResume.mutateAsync({
          resume_text: text,
          role_focus: 'General' // Can be customized later
        })
        
        console.log('Full API response:', analysis)
        const extracted = analysis.data || analysis
        console.log('Extracted data:', extracted)
        setExtractedData(extracted)
        
        // Auto-populate form with extracted data
        setFormData({
          full_name: extracted.full_name || '',
          email: extracted.email || '',
          phone: extracted.phone || '',
          current_position: extracted.current_position || '',
          current_company: extracted.current_company || '',
          experience_years: extracted.experience_years?.toString() || '',
          skills: Array.isArray(extracted.skills) ? extracted.skills.join(', ') : (extracted.skills || ''),
          bio: extracted.bio || extracted.summary || ''
        })
        
        console.log('Form data updated:', {
          full_name: extracted.full_name || '',
          email: extracted.email || '',
          phone: extracted.phone || '',
          current_position: extracted.current_position || '',
          current_company: extracted.current_company || '',
          experience_years: extracted.experience_years?.toString() || '',
          skills: Array.isArray(extracted.skills) ? extracted.skills.join(', ') : (extracted.skills || ''),
          bio: extracted.bio || extracted.summary || ''
        })
        
        // Show success message
        setError('')
        console.log('✅ Resume analysis completed successfully!')
        
      } catch (error: any) {
        console.error('Resume analysis failed:', error)
        setError('Failed to analyze resume. Please try again or fill in the form manually.')
      } finally {
        setIsAnalyzing(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Create candidate
      const candidateData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || undefined,
        current_position: formData.current_position || undefined,
        current_company: formData.current_company || undefined,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : undefined,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0) : undefined
      }

      const response = await createCandidate.mutateAsync(candidateData)
      console.log('Candidate created:', response.data)

      // Upload resume if provided
      if (resumeFile && response.data.candidate_id) {
        await uploadResume.mutateAsync({
          id: response.data.candidate_id,
          file: resumeFile
        })
        console.log('Resume uploaded successfully')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/candidates')
      }, 2000)

    } catch (error: any) {
      console.error('Error creating candidate:', error)
      let errorMessage = 'Failed to create candidate. Please try again.'
      
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
                <User className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Candidate Created!</h2>
              <p className="text-gray-600 mb-4">
                {safeRender(formData.full_name)} has been added to your candidate database.
              </p>
              <p className="text-sm text-gray-500">Redirecting to candidates page...</p>
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
                  <Link href="/candidates">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Candidates
                  </Link>
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Add New Candidate</span>
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
                <CardTitle>Add New Candidate</CardTitle>
                <CardDescription>
                  Upload a resume and AI will automatically extract all candidate information. You can review and edit the extracted data before saving.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Resume Upload - Primary Step */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Step 1: Upload Resume
                    </h3>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                      {isAnalyzing ? (
                        <div className="space-y-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">AI is analyzing your resume...</p>
                            <p className="text-sm text-gray-600">Extracting candidate information</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              {resumeFile ? resumeFile.name : 'Upload Resume'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {resumeFile ? 'Resume uploaded successfully!' : 'Drop your resume here or click to browse'}
                            </p>
                            <p className="text-xs text-gray-500">Supports PDF files</p>
                          </div>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="resume-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('resume-upload')?.click()}
                          >
                            {resumeFile ? 'Change File' : 'Choose Resume'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extracted Information - Review Step */}
                  {extractedData && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Step 2: Review Extracted Information
                        </h3>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800">
                          AI has successfully extracted candidate information from the resume. 
                          Please review and edit the fields below if needed.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Basic Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          placeholder="Enter candidate's full name"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="candidate@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="experience_years">Years of Experience</Label>
                        <Input
                          id="experience_years"
                          name="experience_years"
                          type="number"
                          value={formData.experience_years}
                          onChange={handleInputChange}
                          placeholder="5"
                          min="0"
                          max="50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Briefcase className="h-5 w-5 mr-2" />
                      Professional Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="current_position">Current Position</Label>
                        <Input
                          id="current_position"
                          name="current_position"
                          value={formData.current_position}
                          onChange={handleInputChange}
                          placeholder="Software Engineer"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="current_company">Current Company</Label>
                        <Input
                          id="current_company"
                          name="current_company"
                          value={formData.current_company}
                          onChange={handleInputChange}
                          placeholder="Tech Corp"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills (comma-separated)</Label>
                      <Textarea
                        id="skills"
                        name="skills"
                        value={formData.skills}
                        onChange={handleInputChange}
                        placeholder="JavaScript, React, Node.js, Python"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Brief description of the candidate's background and experience..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Extracted Education */}
                  {extractedData?.education && Array.isArray(extractedData.education) && extractedData.education.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Education (AI Extracted)
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 mb-3">
                          AI has extracted the following education information:
                        </p>
                        {extractedData.education.map((edu: any, index: number) => (
                          <div key={index} className="mb-3 p-3 bg-white rounded border">
                            <div className="font-semibold text-gray-900">{edu.degree}</div>
                            <div className="text-sm text-gray-600">{edu.institution}</div>
                            <div className="text-sm text-gray-500">{edu.year} • GPA: {edu.gpa}</div>
                            {edu.major && <div className="text-sm text-gray-500">Major: {edu.major}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Work Experience */}
                  {extractedData?.work_experience && Array.isArray(extractedData.work_experience) && extractedData.work_experience.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Briefcase className="h-5 w-5 mr-2" />
                        Work Experience (AI Extracted)
                      </h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800 mb-3">
                          AI has extracted the following work experience:
                        </p>
                        {extractedData.work_experience.map((exp: any, index: number) => (
                          <div key={index} className="mb-3 p-3 bg-white rounded border">
                            <div className="font-semibold text-gray-900">{exp.position}</div>
                            <div className="text-sm text-gray-600">{exp.company}</div>
                            <div className="text-sm text-gray-500">{exp.duration} • {exp.location}</div>
                            <div className="text-sm text-gray-700 mt-2">{exp.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Projects */}
                  {extractedData?.projects && Array.isArray(extractedData.projects) && extractedData.projects.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Brain className="h-5 w-5 mr-2" />
                        Projects (AI Extracted)
                      </h3>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-sm text-purple-800 mb-3">
                          AI has extracted the following projects:
                        </p>
                        {extractedData.projects.map((project: any, index: number) => (
                          <div key={index} className="mb-3 p-3 bg-white rounded border">
                            <div className="font-semibold text-gray-900">{project.name}</div>
                            <div className="text-sm text-gray-700 mt-2">{project.description}</div>
                            {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-500 mb-1">Technologies:</div>
                                <div className="flex flex-wrap gap-1">
                                  {project.technologies.map((tech: string, techIndex: number) => (
                                    <span key={techIndex} className="px-2 py-1 bg-gray-100 text-xs rounded">
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Certifications */}
                  {extractedData?.certifications && Array.isArray(extractedData.certifications) && extractedData.certifications.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Certifications (AI Extracted)
                      </h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 mb-3">
                          AI has extracted the following certifications:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {extractedData.certifications.map((cert: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

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
                      onClick={() => router.push('/candidates')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating Candidate...' : 'Create Candidate'}
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
