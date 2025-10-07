'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import StartInterviewPage from './start'
import InterviewReportPage from './report'

export default function InterviewClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = useState<'start' | 'report'>('start')
  
  useEffect(() => {
    if (searchParams) {
      const action = searchParams.get('action')
      if (action === 'report') {
        setView('report')
      } else {
        setView('start')
      }
    }
  }, [searchParams])
  
  if (view === 'report') {
    return <InterviewReportPage />
  }
  
  return <StartInterviewPage />
}