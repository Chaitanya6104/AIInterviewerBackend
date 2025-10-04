'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Mic, MicOff, Video, VideoOff, MessageSquare, FileText, Users, Brain, Zap, Target, Send } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTextMode, setIsTextMode] = useState(false)
  const [demoResponse, setDemoResponse] = useState('')
  const [isClient, setIsClient] = useState(false)

  // Fix hydration mismatch by only rendering random heights on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Questions",
      description: "Generate personalized questions based on candidate's resume and role"
    },
    {
      icon: <Mic className="h-6 w-6" />,
      title: "Real-time Voice",
      description: "Natural voice interaction with real-time transcription"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Adaptive Difficulty",
      description: "AI adjusts question complexity based on responses"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Scoring",
      description: "Automated evaluation with detailed feedback"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "PDF Reports",
      description: "Comprehensive interview reports with insights"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Multi-role Support",
      description: "Specialized questions for AI, DevOps, PM, and more"
    }
  ]

  return (
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
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/interviews" className="text-gray-600 hover:text-gray-900">Interviews</Link>
              <Link href="/candidates" className="text-gray-600 hover:text-gray-900">Candidates</Link>
              <Button asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              🚀 AI-Powered Interview Platform
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Conduct Intelligent
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {" "}Interviews
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your hiring process with AI that adapts, learns, and provides 
              comprehensive insights for every candidate interaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Start Interview
                  <Zap className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">
                  Watch Demo
                  <Video className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to conduct professional, AI-enhanced interviews
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                See It In Action
              </h2>
              <p className="text-xl text-gray-600">
                Experience the future of interviewing
              </p>
            </div>
            
            <Card className="interview-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Interview Demo</CardTitle>
                    <CardDescription>
                      AI interviewer conducting a technical interview
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
                  {/* AI Avatar */}
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-blue-100 rounded-lg p-4">
                        <p className="text-gray-800">
                          "Hello! I'm your AI interviewer. Let's start with a technical question. 
                          Can you explain the difference between synchronous and asynchronous programming?"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Candidate Response */}
                  <div className="flex items-center space-x-4 justify-end">
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <p className="text-gray-800">
                          "Synchronous programming executes code sequentially, one line at a time, 
                          while asynchronous programming allows multiple operations to run concurrently..."
                        </p>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>

                  {/* Audio Visualizer */}
                  <div className="audio-visualizer">
                    <div className="flex items-center space-x-1">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-blue-500 rounded-full animate-pulse"
                          style={{
                            height: isClient ? `${Math.random() * 40 + 10}px` : '25px',
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Text Input (shown when in text mode) */}
                  {isTextMode && (
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Type your response here..."
                        value={demoResponse}
                        onChange={(e) => setDemoResponse(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end">
                        <Button 
                          disabled={!demoResponse.trim()}
                          className="flex items-center space-x-2"
                        >
                          <Send className="h-4 w-4" />
                          Send Response
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      variant={isRecording ? "destructive" : "default"}
                      onClick={() => {
                        setIsRecording(!isRecording)
                        if (isRecording) {
                          // Simulate recording completion
                          setTimeout(() => {
                            setDemoResponse("Synchronous programming executes code sequentially, one line at a time, while asynchronous programming allows multiple operations to run concurrently...")
                          }, 2000)
                        }
                      }}
                      className="flex items-center space-x-2"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    <Button 
                      variant={isTextMode ? "default" : "outline"} 
                      onClick={() => setIsTextMode(!isTextMode)}
                      className="flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {isTextMode ? "Voice Mode" : "Text Mode"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of companies using AI to conduct better interviews
            </p>
            <div className="flex justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/dashboard">
                  Start Free Trial
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
