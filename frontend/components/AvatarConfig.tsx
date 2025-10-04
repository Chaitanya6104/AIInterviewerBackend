'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Image, Video, Settings, Play, Square } from 'lucide-react'
import { AvatarConfig } from '@/lib/avatar'

interface AvatarConfigProps {
  config: AvatarConfig
  onConfigChange: (config: AvatarConfig) => void
  onTest?: () => void
  className?: string
}

export default function AvatarConfigComponent({
  config,
  onConfigChange,
  onTest,
  className = ''
}: AvatarConfigProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [testText, setTestText] = useState('Hello! I am your AI interviewer. How are you today?')

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        onConfigChange({
          ...config,
          image: imageUrl,
          video: undefined // Clear video when image is set
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const videoUrl = e.target?.result as string
        onConfigChange({
          ...config,
          video: videoUrl,
          image: undefined // Clear image when video is set
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVoiceChange = (field: string, value: number | string | boolean) => {
    onConfigChange({
      ...config,
      voice: {
        ...config.voice,
        [field]: value
      }
    })
  }

  const handleTest = async () => {
    if (onTest) {
      setIsTesting(true)
      try {
        await onTest()
      } finally {
        setIsTesting(false)
      }
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Avatar Configuration
        </CardTitle>
        <CardDescription>
          Configure your AI interviewer avatar appearance and voice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Type Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Avatar Type</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Default Avatar */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                !config.image && !config.video
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onConfigChange({ ...config, image: undefined, video: undefined })}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-medium">Default Avatar</p>
                <p className="text-xs text-gray-500">Animated face with lip sync</p>
              </div>
            </div>

            {/* Custom Image */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                config.image
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                  {config.image ? (
                    <img
                      src={config.image}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Image className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <p className="text-sm font-medium">Custom Image</p>
                <p className="text-xs text-gray-500">Upload your own avatar image</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload
                </Button>
              </div>
            </div>
          </div>

          {/* Custom Video */}
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              config.video
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                {config.video ? (
                  <video
                    src={config.video}
                    className="w-full h-full rounded-full object-cover"
                    muted
                    loop
                  />
                ) : (
                  <Video className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <p className="text-sm font-medium">Custom Video</p>
              <p className="text-xs text-gray-500">Upload a video avatar with natural movement</p>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                id="video-upload"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => document.getElementById('video-upload')?.click()}
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </Button>
            </div>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Voice Settings</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lang">Language</Label>
              <Select
                value={config.voice?.lang || 'en'}
                onValueChange={(value) => handleVoiceChange('lang', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speed">Speech Speed</Label>
              <Select
                value={config.voice?.slow ? 'slow' : 'normal'}
                onValueChange={(value) => handleVoiceChange('slow', value === 'slow')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal Speed</SelectItem>
                  <SelectItem value="slow">Slow Speed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tld">Voice Accent</Label>
              <Select
                value={config.voice?.tld || 'com'}
                onValueChange={(value) => handleVoiceChange('tld', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="com">US English</SelectItem>
                  <SelectItem value="co.uk">UK English</SelectItem>
                  <SelectItem value="com.au">Australian English</SelectItem>
                  <SelectItem value="ca">Canadian English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Test Avatar */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Test Avatar</Label>
          
          <div className="space-y-2">
            <Label htmlFor="test-text">Test Text</Label>
            <Input
              id="test-text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to test the avatar voice..."
            />
          </div>
          
          <Button
            onClick={handleTest}
            disabled={isTesting || !testText.trim()}
            className="w-full"
          >
            {isTesting ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Testing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Test Avatar Voice
              </>
            )}
          </Button>
        </div>

        {/* Current Configuration Summary */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Configuration</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Avatar:</strong> {config.image ? 'Custom Image' : config.video ? 'Custom Video' : 'Default'}</p>
            <p><strong>Language:</strong> {config.voice?.lang || 'en'}</p>
            <p><strong>Speed:</strong> {config.voice?.slow ? 'Slow' : 'Normal'}</p>
            <p><strong>Accent:</strong> {config.voice?.tld || 'com'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
