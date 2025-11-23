import { useState, useEffect, useRef, useCallback } from 'react';

export type SilenceState = 'none' | 'short' | 'medium' | 'long';

export interface UseSpeechDetectionReturn {
  isSpeaking: boolean;
  silenceDuration: number;
  totalSpeechTime: number;
  hasSpeechDetected: boolean;
  silenceState: SilenceState;
  resetDetection: () => void;
}

// Silence warning thresholds (in seconds)
const SILENCE_THRESHOLDS = {
  WARNING_1: 5,   // 5s: First silence warning
  WARNING_2: 10,  // 10s: Second silence warning
};

// Audio level thresholds for noise filtering
const AUDIO_THRESHOLDS = {
  SPEECH_MIN: 0.1,      // Minimum level to consider as speech
  NOISE_MAX: 0.05,      // Maximum level to consider as background noise
  SPEECH_CONFIDENCE: 0.15, // Level for confident speech detection
};

export const useSpeechDetection = (
  audioLevel: number,
  isRecording: boolean,
  isPaused: boolean,
  threshold = AUDIO_THRESHOLDS.SPEECH_MIN
): UseSpeechDetectionReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [silenceDuration, setSilenceDuration] = useState(0);
  const [totalSpeechTime, setTotalSpeechTime] = useState(0);
  const [hasSpeechDetected, setHasSpeechDetected] = useState(false);
  const [silenceState, setSilenceState] = useState<SilenceState>('none');

  // Refs for tracking
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const silenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelHistoryRef = useRef<number[]>([]);

  const resetDetection = useCallback(() => {
    console.log('🔄 [SpeechDetection] Resetting detection state');
    setIsSpeaking(false);
    setSilenceDuration(0);
    setTotalSpeechTime(0);
    setHasSpeechDetected(false);
    setSilenceState('none');
    lastSpeechTimeRef.current = Date.now();
    audioLevelHistoryRef.current = [];
    
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
  }, []);

  // Determine if audio level represents actual speech vs background noise
  const isActualSpeech = useCallback((level: number): boolean => {
    // Add to history (keep last 10 samples)
    audioLevelHistoryRef.current.push(level);
    if (audioLevelHistoryRef.current.length > 10) {
      audioLevelHistoryRef.current.shift();
    }

    // If level is below noise threshold, definitely not speech
    if (level < AUDIO_THRESHOLDS.NOISE_MAX) {
      return false;
    }

    // If level is above confidence threshold, definitely speech
    if (level > AUDIO_THRESHOLDS.SPEECH_CONFIDENCE) {
      return true;
    }

    // For levels in between, check if there's variation (speech has more variation than steady noise)
    if (audioLevelHistoryRef.current.length >= 5) {
      const recent = audioLevelHistoryRef.current.slice(-5);
      const avg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const variance = recent.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / recent.length;
      
      // Speech has more variance than steady background noise
      const hasVariation = variance > 0.001;
      return level > threshold && hasVariation;
    }

    // Default: use simple threshold
    return level > threshold;
  }, [threshold]);

  // Speech detection for UI feedback and silence warnings
  useEffect(() => {
    if (!isRecording || isPaused) {
      if (silenceIntervalRef.current) {
        clearInterval(silenceIntervalRef.current);
        silenceIntervalRef.current = null;
      }
      return;
    }

    const speaking = isActualSpeech(audioLevel);
    setIsSpeaking(speaking);

    if (speaking) {
      // User is speaking
      setHasSpeechDetected(true);
      lastSpeechTimeRef.current = Date.now();
      setSilenceDuration(0);
      setSilenceState('none');
    } else {
      // User is not speaking - track silence for warnings
      if (!silenceIntervalRef.current) {
        silenceIntervalRef.current = setInterval(() => {
          const now = Date.now();
          const timeSinceLastSpeech = Math.floor((now - lastSpeechTimeRef.current) / 1000);
          setSilenceDuration(timeSinceLastSpeech);
          
          // Update silence state for warnings
          if (timeSinceLastSpeech >= SILENCE_THRESHOLDS.WARNING_2) {
            setSilenceState('long');
          } else if (timeSinceLastSpeech >= SILENCE_THRESHOLDS.WARNING_1) {
            setSilenceState('medium');
          } else {
            setSilenceState('short');
          }
        }, 1000);
      }
    }

    return () => {
      if (silenceIntervalRef.current) {
        clearInterval(silenceIntervalRef.current);
        silenceIntervalRef.current = null;
      }
    };
  }, [audioLevel, isRecording, isPaused, isActualSpeech]);

  // Simple timer: count up from when recording starts until it stops
  useEffect(() => {
    if (!isRecording || isPaused) return;

    console.log('⏱️ [SpeechDetection] Starting simple timer (counts up while recording)');
    const timerInterval = setInterval(() => {
      setTotalSpeechTime((prev) => prev + 1);
    }, 1000);

    return () => {
      console.log('⏹️ [SpeechDetection] Stopping simple timer');
      clearInterval(timerInterval);
    };
  }, [isRecording, isPaused]);

  return {
    isSpeaking,
    silenceDuration,
    totalSpeechTime,
    hasSpeechDetected,
    silenceState,
    resetDetection,
  };
};
