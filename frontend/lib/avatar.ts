/**
 * Avatar utilities for managing AI avatar functionality
 */

import { aiAPI } from './api'

// Audio cache to store generated audio
const audioCache = new Map<string, string>()

export interface AvatarConfig {
  image?: string
  video?: string
  voice?: {
    lang?: string
    slow?: boolean
    tld?: string
  }
  size?: 'sm' | 'md' | 'lg'
}

export const defaultAvatarConfig: AvatarConfig = {
  voice: {
    lang: 'en',
    slow: false,
    tld: 'com',
  },
  size: 'md'
}

/**
 * Get available TTS voices from backend
 */
export const getAvailableVoices = async () => {
  try {
    const response = await aiAPI.getAvailableVoices()
    return response.data
  } catch (error) {
    console.error('Failed to get available voices:', error)
    return {
      languages: { 'en': 'English' },
      speed_options: { normal: false, slow: true },
      tld_options: { 'com': 'US English' }
    }
  }
}

/**
 * Speak text with the avatar using gTTS
 */
export const speakWithAvatar = async (
  text: string,
  config: AvatarConfig = defaultAvatarConfig,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: any) => void
): Promise<void> => {
  try {
    if (!text.trim()) {
      console.log('TTS: Empty text, skipping')
      return
    }
    
    // Create cache key
    const cacheKey = `${text}_${config.voice?.lang || 'en'}_${config.voice?.slow || false}_${config.voice?.tld || 'com'}`
    
    // Check cache first
    if (audioCache.has(cacheKey)) {
      console.log('TTS: Using cached audio for:', text.substring(0, 50) + '...')
      const cachedUrl = audioCache.get(cacheKey)!
      const audio = new Audio(cachedUrl)
      
      audio.onended = () => {
        if (onEnd) onEnd()
      }
      
      audio.onerror = (error) => {
        console.error('TTS: Cached audio playback error:', error)
        if (onError) onError(error)
      }
      
      // Start audio first, then call onStart when it actually starts playing
      await audio.play()
      if (onStart) onStart()
      return
    }
    
    console.log('TTS: Starting speech synthesis for:', text.substring(0, 50) + '...')
    
    const voiceConfig = config.voice || defaultAvatarConfig.voice!
    console.log('TTS: Calling backend API with config:', voiceConfig)
    
    // Start the API call immediately
    const ttsPromise = aiAPI.textToSpeech(
      text,
      voiceConfig.lang || 'en',
      voiceConfig.slow || false,
      voiceConfig.tld || 'com'
    )
    
    const response = await ttsPromise
    console.log('TTS: Received response from backend')
    
    // Create audio element and play
    const audioData = response.data.audio_data
    const audioBlob = new Blob([Uint8Array.from(atob(audioData), c => c.charCodeAt(0))], { type: 'audio/mp3' })
    const audioUrl = URL.createObjectURL(audioBlob)
    
    // Cache the audio URL
    audioCache.set(cacheKey, audioUrl)
    
    console.log('TTS: Created audio blob, URL:', audioUrl)
    
    const audio = new Audio(audioUrl)
    
    audio.onended = () => {
      console.log('TTS: Audio playback ended')
      if (onEnd) onEnd()
    }
    
    audio.onerror = (error) => {
      console.error('TTS: Audio playback error:', error)
      if (onError) onError(error)
      throw new Error('Audio playback failed')
    }
    
    console.log('TTS: Starting audio playback')
    await audio.play()
    console.log('TTS: Audio playback started successfully')
    
    // Call onStart after audio actually starts playing
    if (onStart) onStart()
    
  } catch (error) {
    console.error('TTS error:', error)
    if (onError) onError(error)
    throw error
  }
}

/**
 * Stop current speech
 */
export const stopAvatarSpeech = (): void => {
  // For gTTS, we can't easily stop audio playback
  // This would require tracking the current audio element
  console.log('Stop speech requested - gTTS audio will continue until finished')
}

/**
 * Check if speech synthesis is currently speaking
 */
export const isAvatarSpeaking = (): boolean => {
  // For gTTS, we can't easily check if audio is playing
  // This would require tracking the current audio element
  return false
}

/**
 * Get TTS cache statistics
 */
export const getTTSCacheStats = async () => {
  try {
    const response = await aiAPI.getTTSCacheStats()
    return response.data
  } catch (error) {
    console.error('Failed to get TTS cache stats:', error)
    return { total_files: 0, total_size_mb: 0 }
  }
}

/**
 * Clear TTS cache
 */
export const clearTTSCache = async () => {
  try {
    const response = await aiAPI.clearTTSCache()
    return response.data
  } catch (error) {
    console.error('Failed to clear TTS cache:', error)
    throw error
  }
}

/**
 * Preload audio for text to reduce latency
 */
export const preloadAudio = async (
  text: string,
  config: AvatarConfig = defaultAvatarConfig
): Promise<void> => {
  try {
    if (!text.trim()) return
    
    const cacheKey = `${text}_${config.voice?.lang || 'en'}_${config.voice?.slow || false}_${config.voice?.tld || 'com'}`
    
    // Skip if already cached
    if (audioCache.has(cacheKey)) {
      console.log('TTS: Audio already cached for:', text.substring(0, 50) + '...')
      return
    }
    
    console.log('TTS: Preloading audio for:', text.substring(0, 50) + '...')
    
    const voiceConfig = config.voice || defaultAvatarConfig.voice!
    const response = await aiAPI.textToSpeech(
      text,
      voiceConfig.lang || 'en',
      voiceConfig.slow || false,
      voiceConfig.tld || 'com'
    )
    
    const audioData = response.data.audio_data
    const audioBlob = new Blob([Uint8Array.from(atob(audioData), c => c.charCodeAt(0))], { type: 'audio/mp3' })
    const audioUrl = URL.createObjectURL(audioBlob)
    
    audioCache.set(cacheKey, audioUrl)
    console.log('TTS: Audio preloaded and cached for:', text.substring(0, 50) + '...')
    
  } catch (error) {
    console.error('TTS: Failed to preload audio:', error)
  }
}

/**
 * Preload multiple audio files in parallel
 */
export const preloadMultipleAudio = async (
  texts: string[],
  config: AvatarConfig = defaultAvatarConfig
): Promise<void> => {
  try {
    console.log('TTS: Preloading multiple audio files:', texts.length)
    
    // Preload all audio files in parallel
    const preloadPromises = texts.map(text => preloadAudio(text, config))
    await Promise.all(preloadPromises)
    
    console.log('TTS: All audio files preloaded successfully')
    
  } catch (error) {
    console.error('TTS: Failed to preload multiple audio files:', error)
  }
}
