'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import StartInterviewPage from '../components/StartInterview'
import InterviewReportPage from '../components/InterviewReport'

export default function InterviewClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [view, setView] = useState<'start' | 'report'>('start')
  
  useEffect(() => {
    // Check if URL contains /start or /report
    if (pathname && pathname.includes('/start')) {
      setView('start')
    } else if (pathname && pathname.includes('/report')) {
      setView('report')
    } else if (searchParams) {
      // Fallback to query parameter
      const action = searchParams.get('action')
      if (action === 'report') {
        setView('report')
      } else {
        setView('start')
      }
    }
  }, [pathname, searchParams])
  
  if (view === 'report') {
    return <InterviewReportPage />
  }
  
  return <StartInterviewPage />
}
