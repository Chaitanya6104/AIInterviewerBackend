"""
Text-to-Speech Service using Google Text-to-Speech (gTTS)
"""

import os
import tempfile
import base64
from typing import Optional, Dict, Any
from gtts import gTTS
import io
from app.core.config import settings


class TTSService:
    """Service for text-to-speech conversion using gTTS"""
    
    def __init__(self):
        self.cache_dir = os.path.join(os.getcwd(), "audio_cache")
        self.ensure_cache_dir()
    
    def ensure_cache_dir(self):
        """Ensure the audio cache directory exists"""
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)
    
    def get_cache_key(self, text: str, lang: str = 'en', slow: bool = False) -> str:
        """Generate a cache key for the given text and parameters"""
        import hashlib
        key_string = f"{text}_{lang}_{slow}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def get_cached_audio(self, cache_key: str) -> Optional[bytes]:
        """Get cached audio if it exists"""
        cache_file = os.path.join(self.cache_dir, f"{cache_key}.mp3")
        if os.path.exists(cache_file):
            with open(cache_file, 'rb') as f:
                return f.read()
        return None
    
    def cache_audio(self, cache_key: str, audio_data: bytes):
        """Cache audio data"""
        cache_file = os.path.join(self.cache_dir, f"{cache_key}.mp3")
        with open(cache_file, 'wb') as f:
            f.write(audio_data)
    
    async def text_to_speech(
        self, 
        text: str, 
        lang: str = 'en', 
        slow: bool = False,
        tld: str = 'com'
    ) -> Dict[str, Any]:
        """
        Convert text to speech using gTTS
        
        Args:
            text: Text to convert to speech
            lang: Language code (default: 'en')
            slow: Whether to speak slowly (default: False)
            tld: Top-level domain for Google TTS (default: 'com')
        
        Returns:
            Dict containing base64 encoded audio and metadata
        """
        try:
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")
            
            # Generate cache key
            cache_key = self.get_cache_key(text, lang, slow)
            
            # Check cache first
            cached_audio = self.get_cached_audio(cache_key)
            if cached_audio:
                print(f"✅ Using cached audio for: {text[:50]}...")
                return {
                    "audio_data": base64.b64encode(cached_audio).decode('utf-8'),
                    "format": "mp3",
                    "cached": True,
                    "text": text,
                    "lang": lang,
                    "slow": slow
                }
            
            # Create gTTS object
            tts = gTTS(
                text=text,
                lang=lang,
                slow=slow,
                tld=tld
            )
            
            # Generate audio in memory
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            audio_data = audio_buffer.getvalue()
            
            # Cache the audio
            self.cache_audio(cache_key, audio_data)
            
            # Encode as base64 for transmission
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            print(f"✅ Generated TTS audio for: {text[:50]}...")
            
            return {
                "audio_data": audio_base64,
                "format": "mp3",
                "cached": False,
                "text": text,
                "lang": lang,
                "slow": slow,
                "size_bytes": len(audio_data)
            }
            
        except Exception as e:
            print(f"❌ TTS generation error: {e}")
            raise Exception(f"TTS generation failed: {str(e)}")
    
    async def get_available_languages(self) -> Dict[str, str]:
        """Get available languages for gTTS"""
        return {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'hi': 'Hindi',
            'ar': 'Arabic',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'da': 'Danish',
            'no': 'Norwegian',
            'fi': 'Finnish',
            'pl': 'Polish',
            'tr': 'Turkish',
            'th': 'Thai',
            'vi': 'Vietnamese',
            'id': 'Indonesian',
            'ms': 'Malay',
            'tl': 'Filipino'
        }
    
    async def get_available_voices(self) -> Dict[str, Any]:
        """Get available voice options"""
        return {
            "languages": await self.get_available_languages(),
            "speed_options": {
                "normal": False,
                "slow": True
            },
            "tld_options": {
                "com": "US English",
                "co.uk": "UK English",
                "com.au": "Australian English",
                "ca": "Canadian English"
            }
        }
    
    def clear_cache(self):
        """Clear the audio cache"""
        try:
            import shutil
            if os.path.exists(self.cache_dir):
                shutil.rmtree(self.cache_dir)
                self.ensure_cache_dir()
                print("✅ Audio cache cleared")
        except Exception as e:
            print(f"❌ Error clearing cache: {e}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            if not os.path.exists(self.cache_dir):
                return {"total_files": 0, "total_size_mb": 0}
            
            files = os.listdir(self.cache_dir)
            total_size = sum(
                os.path.getsize(os.path.join(self.cache_dir, f)) 
                for f in files 
                if f.endswith('.mp3')
            )
            
            return {
                "total_files": len([f for f in files if f.endswith('.mp3')]),
                "total_size_mb": round(total_size / (1024 * 1024), 2)
            }
        except Exception as e:
            print(f"❌ Error getting cache stats: {e}")
            return {"total_files": 0, "total_size_mb": 0}


# Global TTS service instance
tts_service = TTSService()
