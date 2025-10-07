import { Suspense } from 'react'
import InterviewReportPage from '../../components/InterviewReport'

export default function ReportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InterviewReportPage />
    </Suspense>
  )
}
