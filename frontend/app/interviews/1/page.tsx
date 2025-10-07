import { Suspense } from 'react'
import InterviewClient from './client'

export default function InterviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InterviewClient />
    </Suspense>
  )
}
