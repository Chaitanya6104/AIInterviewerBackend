import { Suspense } from 'react'
import InterviewClient from './client'

// Static export configuration
export const dynamicParams = true

export async function generateStaticParams() {
  // For static export, we'll generate a few common IDs
  // The actual routing will be handled client-side
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' }
  ]
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InterviewClient />
    </Suspense>
  )
}
