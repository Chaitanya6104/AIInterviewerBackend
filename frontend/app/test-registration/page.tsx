'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestRegistrationPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testRegistration = async () => {
    setLoading(true)
    setResult(null)

    const testData = {
      email: "test@example.com",
      username: "testuser",
      password: "testpass123",
      full_name: "Test User"
    }

    try {
      console.log('Testing registration with data:', testData)
      
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })

      const data = await response.json()
      console.log('Registration response:', data)
      
      setResult({
        status: response.status,
        data: data,
        success: response.ok
      })
    } catch (error: any) {
      console.error('Registration error:', error)
      setResult({
        error: error?.message || 'Registration failed',
        success: false
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Registration API</CardTitle>
            <CardDescription>
              Test the registration endpoint directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testRegistration} disabled={loading}>
              {loading ? 'Testing...' : 'Test Registration'}
            </Button>

            {result && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
