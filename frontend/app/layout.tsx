import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Interviewer - Intelligent Interview Platform',
  description: 'AI-powered interview platform with real-time voice/text interaction, adaptive questioning, and comprehensive scoring.',
  keywords: 'AI interview, interview platform, voice interview, AI scoring, interview automation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration warnings for browser extensions
              if (typeof window !== 'undefined') {
                const originalError = console.error;
                console.error = function(...args) {
                  if (
                    typeof args[0] === 'string' &&
                    (args[0].includes('data-new-gr-c-s-check-loaded') ||
                     args[0].includes('data-gr-ext-installed') ||
                     args[0].includes('Extra attributes from the server'))
                  ) {
                    return;
                  }
                  originalError.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
