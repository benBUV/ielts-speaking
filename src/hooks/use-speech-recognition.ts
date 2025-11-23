import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  getCurrentTranscript: () => string;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldBeListeningRef = useRef(false);
  const restartTimeoutRef = useRef<number | null>(null);
  const transcriptRef = useRef<string>(''); // Track latest transcript value
  const isCapturingRef = useRef(false); // Flag to prevent late-arriving transcripts

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();

    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        // 🔒 Ignore results if we're in capturing mode (transcript already saved)
        if (isCapturingRef.current) {
          console.log('🔒 [SpeechRecognition] Ignoring late-arriving result (already captured)');
          return;
        }

        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interim += transcriptPiece;
          }
        }

        // Update interim transcript for real-time display
        setInterimTranscript(interim);

        // Append final transcript
        if (finalTranscript) {
          setTranscript((prev) => {
            const newTranscript = (prev + finalTranscript).trim();
            transcriptRef.current = newTranscript; // Update ref immediately
            console.log('📝 [SpeechRecognition] Transcript updated:', newTranscript.substring(0, 50) + '...');
            return newTranscript;
          });
          // Clear interim after final result
          setInterimTranscript('');
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('🎤 [SpeechRecognition] Error:', event.error);
        
        // Don't treat no-speech as an error - it's expected during silence
        if (event.error === 'no-speech') {
          console.log('🎤 [SpeechRecognition] No speech detected, continuing...');
          return;
        }
        
        // Don't stop on aborted - it's intentional
        if (event.error === 'aborted') {
          console.log('🎤 [SpeechRecognition] Aborted intentionally');
          return;
        }
        
        // For other errors, mark as not listening
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        console.log('🎤 [SpeechRecognition] Recognition ended');
        setIsListening(false);
        
        // Auto-restart if we should still be listening (continuous mode)
        if (shouldBeListeningRef.current) {
          console.log('🔄 [SpeechRecognition] Auto-restarting recognition...');
          
          // Clear any existing restart timeout
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          
          // Restart after a brief delay to avoid rapid restart loops
          restartTimeoutRef.current = window.setTimeout(() => {
            if (shouldBeListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
                console.log('✅ [SpeechRecognition] Recognition restarted successfully');
              } catch (error) {
                console.error('❌ [SpeechRecognition] Failed to restart:', error);
              }
            }
          }, 100);
        }
      };
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        shouldBeListeningRef.current = false;
        recognitionRef.current.abort();
      }
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // Mark that we want to be listening (for auto-restart)
    shouldBeListeningRef.current = true;

    // 🔓 Clear capturing flag when starting new recording
    isCapturingRef.current = false;
    console.log('🔓 [SpeechRecognition] Capturing flag cleared - ready for new transcript');

    // Don't start if already listening
    if (isListening) {
      console.log('🎤 [SpeechRecognition] Already listening, skipping start');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      console.log('🎤 [SpeechRecognition] Started listening');
    } catch (error) {
      console.error('❌ [SpeechRecognition] Error starting:', error);
      // If already started, just mark as listening
      if ((error as Error).message?.includes('already started')) {
        setIsListening(true);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // Mark that we don't want to be listening (prevents auto-restart)
    shouldBeListeningRef.current = false;

    // Clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (!isListening) {
      console.log('🎤 [SpeechRecognition] Not listening, skipping stop');
      return;
    }

    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
      console.log('🎤 [SpeechRecognition] Stopped listening');
    } catch (error) {
      console.error('❌ [SpeechRecognition] Error stopping:', error);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = ''; // Reset ref as well
    console.log('🎤 [SpeechRecognition] Transcript reset');
  }, []);

  const getCurrentTranscript = useCallback(() => {
    // 🔒 Set capturing flag to prevent late-arriving results
    isCapturingRef.current = true;
    console.log('🔒 [SpeechRecognition] Capturing flag SET - blocking new results');
    
    // Return the ref value which is always up-to-date
    console.log('📝 [SpeechRecognition] getCurrentTranscript called, returning:', transcriptRef.current.substring(0, 50) + '...');
    return transcriptRef.current;
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    getCurrentTranscript,
  };
};
