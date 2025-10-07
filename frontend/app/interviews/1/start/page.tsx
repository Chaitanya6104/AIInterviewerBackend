import { Suspense } from 'react'
import StartInterviewPage from '../../components/StartInterview'

export default function StartPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StartInterviewPage />
    </Suspense>
  )
}
