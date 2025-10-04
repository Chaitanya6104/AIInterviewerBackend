'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, MessageSquare, Brain, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DemoPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTextMode, setIsTextMode] = useState(false)

  const handleStartRecording = () => {
    setIsRecording(true)
    // Simulate recording
    setTimeout(() => setIsRecording(false), 3000)
  }

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
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Interactive Demo
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience how AI-powered interviews work in real-time. Try both voice and text modes.
            </p>
          </div>

          {/* Demo Interface */}
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
                    <span className="text-gray-600 font-semibold">JD</span>
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
                          height: `${Math.random() * 40 + 10}px`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant={isRecording ? "destructive" : "default"}
                    onClick={handleStartRecording}
                    disabled={isRecording}
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
                    {isTextMode ? "Text Mode Active" : "Switch to Text"}
                  </Button>
                </div>

                {/* Text Input (when in text mode) */}
                {isTextMode && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Type your response:
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Type your answer here..."
                    />
                    <Button className="w-full">Send Response</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features Showcase */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <Mic className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Real-time Voice</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Natural voice interaction with live transcription and AI analysis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Brain className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">AI Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Intelligent question generation and response evaluation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Flexible Modes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Choose between voice or text-based interviews
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 mb-6">
              Sign up now to conduct your own AI-powered interviews
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/login">
                  Start Free Trial
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">
                  View Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
