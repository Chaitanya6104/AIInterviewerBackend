'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import AvatarConfigComponent from '../../components/AvatarConfig'
import Avatar from '../../components/Avatar'
import { AvatarConfig, speakWithAvatar } from '../../lib/avatar'
import ProtectedRoute from '../../components/ProtectedRoute'

export default function AvatarSettingsPage() {
  const [config, setConfig] = useState<AvatarConfig>({
    voice: {
      lang: 'en',
      slow: false,
      tld: 'com',
    },
    size: 'lg'
  })

  const handleConfigChange = (newConfig: AvatarConfig) => {
    setConfig(newConfig)
  }

  const handleTest = async () => {
    try {
      await speakWithAvatar(
        'Hello! I am your AI interviewer. This is a test of the avatar voice settings.',
        config,
        () => console.log('Speech started'),
        () => console.log('Speech ended'),
        (error) => console.error('Speech error:', error)
      )
    } catch (error) {
      console.error('Test failed:', error)
    }
  }

  const handleSave = () => {
    // Save configuration to localStorage
    localStorage.setItem('avatarConfig', JSON.stringify(config))
    alert('Avatar configuration saved!')
  }

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('avatarConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
      } catch (error) {
        console.error('Failed to parse saved config:', error)
      }
    }
  }, [])

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
                    <Save className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Avatar Settings</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Configuration Panel */}
              <div>
                <AvatarConfigComponent
                  config={config}
                  onConfigChange={handleConfigChange}
                  onTest={handleTest}
                />
                
                <div className="mt-6">
                  <Button onClick={handleSave} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </div>

              {/* Preview Panel */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Avatar Preview</CardTitle>
                    <CardDescription>
                      Preview how your avatar will look and sound during interviews
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-6">
                      <Avatar
                        text="Hello! I am your AI interviewer. How are you today?"
                        isSpeaking={false}
                        avatarImage={config.image}
                        avatarVideo={config.video}
                        size="lg"
                      />
                      
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                          This is how your avatar will appear during interviews
                        </p>
                        <p className="text-xs text-gray-500">
                          The avatar will speak the interview questions with the voice settings you've configured
                        </p>
                      </div>

                      {/* Configuration Summary */}
                      <div className="w-full p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Settings</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p><strong>Avatar Type:</strong> {config.image ? 'Custom Image' : config.video ? 'Custom Video' : 'Default Animated'}</p>
                          <p><strong>Language:</strong> {config.voice?.lang || 'en'}</p>
                          <p><strong>Speed:</strong> {config.voice?.slow ? 'Slow' : 'Normal'}</p>
                          <p><strong>Accent:</strong> {config.voice?.tld || 'com'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Instructions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>How to Use Your Avatar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">1. Upload Your Avatar</h4>
                      <p className="text-sm text-gray-600">
                        Upload a high-quality image or video of a person to use as your AI interviewer avatar. 
                        The avatar will automatically sync lip movements with the speech.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">2. Configure Voice</h4>
                      <p className="text-sm text-gray-600">
                        Adjust the speech rate, pitch, and volume to match your preferred interviewer voice. 
                        Test the settings to ensure they sound natural.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">3. Start Interview</h4>
                      <p className="text-sm text-gray-600">
                        When you start an interview, the avatar will automatically speak each question 
                        using your configured voice settings.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">4. Interactive Experience</h4>
                      <p className="text-sm text-gray-600">
                        The avatar provides a more engaging interview experience with visual feedback 
                        and natural speech patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
