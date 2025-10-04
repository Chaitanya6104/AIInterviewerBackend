'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AvatarProps {
  text: string
  isSpeaking?: boolean
  onSpeechEnd?: () => void
  avatarImage?: string
  avatarVideo?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({
  text,
  isSpeaking = false,
  onSpeechEnd,
  avatarImage,
  avatarVideo,
  className = '',
  size = 'md'
}: AvatarProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const isSpeakingRef = useRef(false)
  const lastTextRef = useRef('')

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  // Text-to-speech functionality using gTTS
  const speakText = useCallback(async (textToSpeak: string) => {
    if (!textToSpeak.trim() || isSpeakingRef.current || lastTextRef.current === textToSpeak) {
      console.log('TTS: Skipping duplicate or empty text')
      return
    }

    try {
      isSpeakingRef.current = true
      lastTextRef.current = textToSpeak
      // Don't start animation immediately - wait for audio to actually start

      // Import the speakWithAvatar function
      const { speakWithAvatar } = await import('@/lib/avatar')
      
      await speakWithAvatar(
        textToSpeak,
        {
          voice: {
            lang: 'en',
            slow: false,
            tld: 'com'
          }
        },
        () => {
          // onStart callback - start animation when audio actually starts
          console.log('TTS started for:', textToSpeak.substring(0, 50) + '...')
          setIsAnimating(true)
          // Start video if it exists
          if (videoRef.current) {
            videoRef.current.play()
          }
        },
        () => {
          // onEnd callback
          setIsAnimating(false)
          isSpeakingRef.current = false
          // Stop video if it exists
          if (videoRef.current) {
            videoRef.current.pause()
          }
          if (onSpeechEnd) {
            onSpeechEnd()
          }
        },
        (error) => {
          // onError callback
          console.error('TTS error:', error)
          setIsAnimating(false)
          isSpeakingRef.current = false
          // Stop video if it exists
          if (videoRef.current) {
            videoRef.current.pause()
          }
        }
      )
    } catch (error) {
      console.error('Failed to speak text:', error)
      setIsAnimating(false)
      isSpeakingRef.current = false
      // Stop video if it exists
      if (videoRef.current) {
        videoRef.current.pause()
      }
    }
  }, [onSpeechEnd])

  // Start speaking when text changes
  useEffect(() => {
    if (text && text.trim() && isSpeaking) {
      console.log('Avatar: Starting TTS for text:', text.substring(0, 50) + '...')
      speakText(text)
    }
  }, [text, isSpeaking, speakText])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Lip sync animation
  const getLipSyncIntensity = () => {
    if (!isAnimating) return 0
    // Simple lip sync based on time - in a real implementation, 
    // this would be driven by audio analysis
    return Math.sin(Date.now() * 0.01) * 0.5 + 0.5
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Avatar Container */}
      <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-white shadow-lg">
        {avatarVideo ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          >
            <source src={avatarVideo} type="video/mp4" />
          </video>
        ) : avatarImage ? (
          <img
            src={avatarImage}
            alt="AI Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          // Default avatar with animated face
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
            <div className="relative">
              {/* Eyes */}
              <div className="flex space-x-2 mb-2">
                <motion.div
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{
                    scaleY: isAnimating ? [1, 0.3, 1] : 1,
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: isAnimating ? Infinity : 0,
                    repeatType: "reverse"
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{
                    scaleY: isAnimating ? [1, 0.3, 1] : 1,
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: isAnimating ? Infinity : 0,
                    repeatType: "reverse",
                    delay: 0.1
                  }}
                />
              </div>
              
              {/* Mouth */}
              <motion.div
                className="w-4 h-2 bg-white rounded-full mx-auto"
                animate={{
                  scaleY: isAnimating ? [1, 0.2, 1] : 1,
                  scaleX: isAnimating ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 0.2,
                  repeat: isAnimating ? Infinity : 0,
                  repeatType: "reverse"
                }}
              />
            </div>
          </div>
        )}

        {/* Speaking indicator */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
            >
              <motion.div
                className="w-2 h-2 bg-white rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lip sync overlay for custom images */}
        {avatarImage && isAnimating && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-red-400 rounded-full opacity-50" />
          </motion.div>
        )}
      </div>

      {/* Text bubble - removed to prevent duplicate display */}

      {/* Audio visualization */}
      {isAnimating && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-blue-500 rounded-full"
              animate={{
                height: [4, 16, 4],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
