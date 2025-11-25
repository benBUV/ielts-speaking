import { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Pause, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AudioLevelBar } from '@/components/ui/audio-level-bar';
import { QuestionDisplay } from '@/components/practice/question-display';
import { ReviewSection } from '@/components/practice/review-section';
import { RecorderIndicator } from '@/components/practice/recorder-indicator';
import { SilenceIndicator } from '@/components/practice/silence-indicator';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useSpeechDetection } from '@/hooks/use-speech-detection';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useToast } from '@/hooks/use-toast';
import { AppPhase, Recording, QuestionType, Question, QuestionBank } from '@/types';
import { downloadAudioBlob, mergeAudioBlobs } from '@/lib/audio-utils';
import { loadQuestionBank } from '@/utils/question-bank-loader';
import { cn } from '@/lib/utils';

export default function PracticePage() {
  const { toast } = useToast();
  const [phase, setPhase] = useState<AppPhase>(AppPhase.Loading);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [hasAudioEnded, setHasAudioEnded] = useState(false);
  const [sampleQuestions, setSampleQuestions] = useState<Question[]>([]);
  const [questionBankInfo, setQuestionBankInfo] = useState<QuestionBank | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Ref to track if stop sequence has been triggered for current question
  const hasTriggeredStopRef = useRef(false);

  const {
    isRecording,
    isPaused,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const {
    silenceDuration,
    totalSpeechTime,
    hasSpeechDetected,
    silenceState,
    resetDetection,
  } = useSpeechDetection(audioLevel, isRecording, isPaused);

  const {
    transcript,
    interimTranscript,
    isSupported: isSpeechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
    getCurrentTranscript,
  } = useSpeechRecognition();

  // Ensure currentQuestionIndex never exceeds bounds
  const safeQuestionIndex = Math.min(currentQuestionIndex, sampleQuestions.length - 1);
  const currentQuestion = sampleQuestions[safeQuestionIndex] || sampleQuestions[0];

  // 🔍 DIAGNOSTIC: Log recordings whenever they change
  useEffect(() => {
    console.log('🔍 [DIAGNOSTIC] Recordings array updated:', recordings.length);
    recordings.forEach((rec, idx) => {
      console.log(`🔍 [DIAGNOSTIC] Recording ${idx + 1}:`, {
        id: rec.id,
        questionId: rec.questionId,
        hasAudioBlob: !!rec.audioBlob,
        audioBlobSize: rec.audioBlob?.size || 0,
        hasTranscript: !!rec.transcript,
        transcriptLength: rec.transcript?.length || 0,
        transcriptPreview: rec.transcript?.substring(0, 50) || '(empty)',
        duration: rec.duration,
      });
    });
  }, [recordings]);

  // 🔍 DIAGNOSTIC: Log transcript whenever it changes
  useEffect(() => {
    console.log('🔍 [DIAGNOSTIC] Transcript state updated:', {
      length: transcript.length,
      preview: transcript.substring(0, 100) || '(empty)',
      interimLength: interimTranscript.length,
    });
  }, [transcript, interimTranscript]);

  // Persist timer values to localStorage
  useEffect(() => {
    if (phase === AppPhase.Recording || phase === AppPhase.Preparation) {
      const timerData = {
        totalSpeechTime,
        targetTime: currentQuestion?.speakingDuration || 0,
        questionIndex: currentQuestionIndex,
        timestamp: Date.now(),
      };
      localStorage.setItem('ielts-practice-timer', JSON.stringify(timerData));
    }
  }, [totalSpeechTime, currentQuestion, currentQuestionIndex, phase]);

  // Canvas LMS iframe resize functionality
  useEffect(() => {
    const sendResizeMessage = () => {
      try {
        // Get the actual content height
        const contentHeight = document.documentElement.scrollHeight;
        
        // Send resize message to Canvas LMS parent window
        if (window.parent && window.parent !== window) {
          // Canvas LMS expects this specific message format
          window.parent.postMessage(
            JSON.stringify({
              subject: 'lti.frameResize',
              height: contentHeight,
            }),
            '*'
          );
          
          console.log('📏 [Canvas LMS] Sent resize message:', contentHeight);
        }
      } catch (error) {
        console.error('Failed to send resize message:', error);
      }
    };

    // Send initial resize
    sendResizeMessage();

    // Create ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(() => {
      sendResizeMessage();
    });

    // Observe the document body for size changes
    if (document.body) {
      resizeObserver.observe(document.body);
    }

    // Also send resize on phase changes and window resize
    window.addEventListener('resize', sendResizeMessage);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', sendResizeMessage);
    };
  }, [phase, currentQuestionIndex, recordings.length]);

  // Restore timer values from localStorage on mount
  useEffect(() => {
    const savedTimer = localStorage.getItem('ielts-practice-timer');
    if (savedTimer) {
      try {
        const timerData = JSON.parse(savedTimer);
        // Only restore if less than 1 hour old
        if (Date.now() - timerData.timestamp < 3600000) {
          console.log('⏱️ [PracticePage] Restored timer data from localStorage:', timerData);
        }
      } catch (error) {
        console.error('Failed to restore timer data:', error);
      }
    }
  }, []);

  // Load question bank and preload videos on mount
  useEffect(() => {
    const loadBank = async () => {
      try {
        const { questions, bankInfo, error } = await loadQuestionBank();
        
        setSampleQuestions(questions);
        setQuestionBankInfo(bankInfo);

        if (error) {
          toast({
            title: 'Question Bank Not Found',
            description: error,
            variant: 'destructive',
          });
        }

        // Preload all YouTube videos in background
        console.log('🎬 [PracticePage] Preloading videos...');
        if (questions && Array.isArray(questions)) {
          questions.forEach((question, index) => {
            if (question.media && question.media.includes('youtube.com')) {
              // Create hidden iframe to preload video
              const iframe = document.createElement('iframe');
              iframe.src = question.media.replace('watch?v=', 'embed/') + '?enablejsapi=1';
              iframe.style.display = 'none';
              iframe.style.position = 'absolute';
              iframe.style.width = '1px';
              iframe.style.height = '1px';
              document.body.appendChild(iframe);
              console.log(`✅ [PracticePage] Preloading video ${index + 1}:`, question.media);
              
              // Remove iframe after 5 seconds (video should be buffered by then)
              setTimeout(() => {
                document.body.removeChild(iframe);
              }, 5000);
            }
          });
        }

        // Skip Ready phase and go directly to first question
        setTimeout(() => {
          setPhase(AppPhase.Preparation);
          
          if (!isSpeechRecognitionSupported) {
            toast({
              title: 'Speech Recognition Unavailable',
              description: 'Your browser does not support speech recognition. Audio will be recorded but transcripts will not be available. For best experience, use Chrome or Edge.',
              variant: 'destructive',
            });
          }
        }, 1500);
      } catch (error) {
        console.error('Failed to load question bank:', error);
        toast({
          title: 'Error Loading Questions',
          description: 'Failed to load question bank. Please refresh the page.',
          variant: 'destructive',
        });
        setPhase(AppPhase.Preparation);
      }
    };

    loadBank();
  }, [isSpeechRecognitionSupported, toast]);

  // Silence detection with natural transitions (no intrusive toasts)
  useEffect(() => {
    if (!isRecording || !hasSpeechDetected || isPaused) return;

    // Medium silence (10s): Auto-pause recording
    if (silenceState === 'medium') {
      console.log('⏸️ [PracticePage] Medium silence - auto-pausing recording');
      pauseRecording();
    }

    // Long silence (25s): Already paused, just show gentle prompt in UI
    if (silenceState === 'long') {
      console.log('⏸️ [PracticePage] Long silence - showing gentle prompt');
      // UI will show "Ready when you're ready — tap to continue"
    }
  }, [silenceState, isRecording, hasSpeechDetected, isPaused, pauseRecording]);

  // Auto-transitions based on question type
  useEffect(() => {
    if (!isRecording || !hasSpeechDetected || isPaused) return;

    const { type, speakingDuration } = currentQuestion;
    const stopTime = speakingDuration + 5; // Add 5 seconds grace period

    // Only trigger once per question
    if (totalSpeechTime >= stopTime && !hasTriggeredStopRef.current) {
      hasTriggeredStopRef.current = true; // Mark as triggered
      
      if (type === QuestionType.Part1) {
        console.log('🔍 [DIAGNOSTIC] Part 1 stop time reached - will call handleNextQuestion');
        toast({
          title: 'Let me stop you there',
          duration: 2000,
        });
        // Add 2-second delay before moving to next question
        setTimeout(() => {
          handleNextQuestion();
        }, 2000);
      } else if (type === QuestionType.Part2) {
        console.log('🔍 [DIAGNOSTIC] Part 2 stop time reached - will call handleStopRecording');
        toast({
          title: "That's two minutes, great job!",
          duration: 2000,
        });
        // Add 2-second delay before stopping
        setTimeout(() => {
          handleStopRecording();
        }, 2000);
      } else if (type === QuestionType.Part3) {
        console.log('🔍 [DIAGNOSTIC] Part 3 stop time reached - will call handleNextQuestion');
        toast({
          title: 'Nice response!',
          description: 'Let me ask you something else…',
          duration: 2000,
        });
        // Add 2-second delay before moving to next question
        setTimeout(() => {
          handleNextQuestion();
        }, 2000);
      }
    }
  }, [totalSpeechTime, isRecording, hasSpeechDetected, currentQuestion, isPaused]);

  // No speech detected check
  useEffect(() => {
    if (!currentQuestion) return;
    
    if (isRecording && !hasSpeechDetected && totalSpeechTime === 0 && !isPaused) {
      const timer = setTimeout(() => {
        if (!hasSpeechDetected) {
          console.log('🔍 [DIAGNOSTIC] No speech detected - will call handleStopRecording');
          toast({
            title: 'No response detected',
            variant: 'destructive',
            duration: 3000,
          });
          handleStopRecording();
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isRecording, hasSpeechDetected, totalSpeechTime, currentQuestion, isPaused]);

  const handleStartRecording = useCallback(async () => {
    console.log('🎤 [PracticePage] handleStartRecording called');
    try {
      console.log('🔄 [PracticePage] Resetting transcript and detection...');
      resetTranscript();
      resetDetection();
      
      console.log('🎙️ [PracticePage] Starting audio recording...');
      await startRecording();
      console.log('✅ [PracticePage] Audio recording started successfully');
      
      if (isSpeechRecognitionSupported) {
        console.log('🗣️ [PracticePage] Starting speech recognition...');
        startListening();
        console.log('✅ [PracticePage] Speech recognition started');
      } else {
        console.warn('⚠️ [PracticePage] Speech recognition not supported');
      }
    } catch (error) {
      console.error('❌ [PracticePage] Recording error:', error);
      toast({
        title: 'Recording Error',
        description: 'Failed to start recording. Please check microphone permissions.',
        variant: 'destructive',
      });
    }
  }, [
    startRecording,
    startListening,
    isSpeechRecognitionSupported,
    resetTranscript,
    resetDetection,
    toast,
  ]);

  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
      if (isSpeechRecognitionSupported) {
        startListening();
      }
    } else {
      pauseRecording();
      if (isSpeechRecognitionSupported) {
        stopListening();
      }
    }
  };

  const handleStopRecording = async () => {
    console.log('🛑 [PracticePage] ========== handleStopRecording START ==========');
    console.log('📊 [PracticePage] Current question:', currentQuestion.id);
    console.log('📊 [PracticePage] isRecording:', isRecording);
    
    // Reset the stop trigger flag
    hasTriggeredStopRef.current = false;
    
    // STEP 1: Stop listening FIRST (prevents new transcripts from coming in)
    if (isSpeechRecognitionSupported) {
      stopListening();
      console.log('✅ [PracticePage] Speech recognition stopped');
    }
    
    // STEP 2: Wait for ALL final speech results to arrive (increased from 200ms to 500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('⏱️ [PracticePage] Waited 500ms for final speech results');
    
    // STEP 3: Capture the transcript using getCurrentTranscript (sets capturing flag)
    const currentTranscript = getCurrentTranscript();
    console.log('🔍 [DIAGNOSTIC] Transcript comparison:');
    console.log('  - transcript state:', transcript.length, 'chars -', transcript.substring(0, 50));
    console.log('  - getCurrentTranscript():', currentTranscript.length, 'chars -', currentTranscript.substring(0, 50));
    console.log('  - Are they equal?', transcript === currentTranscript);
    console.log('📝 [PracticePage] Captured transcript:', currentTranscript.substring(0, 100) + '...');
    console.log('📝 [PracticePage] Transcript length:', currentTranscript.length, 'characters');
    
    // STEP 4: Stop audio recording
    console.log('🎙️ [PracticePage] Stopping audio recording...');
    const blob = await stopRecording();
    console.log('✅ [PracticePage] Audio recording stopped, blob size:', blob?.size || 0, 'bytes');

    // STEP 5: Save the recording with the captured transcript
    if (blob) {
      const recording: Recording = {
        id: `recording-${Date.now()}`,
        questionId: currentQuestion.id,
        audioBlob: blob,
        transcript: currentTranscript, // Use the captured transcript
        duration: totalSpeechTime,
        timestamp: Date.now(),
      };

      console.log('💾 [PracticePage] Saving recording...');
      console.log('💾 [PracticePage] Recording details:', {
        id: recording.id,
        questionId: recording.questionId,
        transcriptLength: recording.transcript.length,
        duration: recording.duration,
        blobSize: recording.audioBlob.size,
      });

      setRecordings((prev) => {
        const newRecordings = [...prev, recording];
        console.log('✅ [PracticePage] Recording saved! Total recordings:', newRecordings.length);
        return newRecordings;
      });
    } else {
      console.warn('⚠️ [PracticePage] No audio blob available, recording not saved');
    }

    // STEP 6: Clear transcript for next question
    console.log('🧹 [PracticePage] Clearing transcript...');
    resetTranscript();
    console.log('✅ [PracticePage] Transcript cleared');

    // Move to next question or review
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      console.log('➡️ [PracticePage] Moving to next question:', currentQuestionIndex + 1);
      setCurrentQuestionIndex((prev) => prev + 1);
      setPhase(AppPhase.Preparation);
      setHasAudioEnded(false);
      resetRecording();
      resetDetection();
    } else {
      console.log('✅ [PracticePage] All questions completed - showing review');
      setPhase(AppPhase.Review);
    }
    
    console.log('🛑 [PracticePage] ========== handleStopRecording END ==========');
  };

  const handleNextQuestion = async () => {
    console.log('🔄 [PracticePage] ========== handleNextQuestion START ==========');
    console.log('📊 [PracticePage] Current question:', currentQuestion.id);
    console.log('📊 [PracticePage] isRecording:', isRecording);
    
    // Reset the stop trigger flag for the next question
    hasTriggeredStopRef.current = false;
    
    // Set transitioning state for smooth UX
    setIsTransitioning(true);
    
    // Save current recording if in recording phase
    if (isRecording) {
      console.log('💾 [PracticePage] STEP 1: Stopping speech recognition...');
      
      // STEP 1: Stop listening FIRST (prevents new transcripts from coming in)
      if (isSpeechRecognitionSupported) {
        stopListening();
        console.log('✅ [PracticePage] Speech recognition stopped');
      }
      
      // STEP 2: Wait for ALL final speech results to arrive (increased from 200ms to 500ms)
      // The Web Speech API may have pending final results
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('⏱️ [PracticePage] Waited 500ms for final speech results');
      
      // STEP 3: Capture the transcript using getCurrentTranscript (sets capturing flag)
      const currentTranscript = getCurrentTranscript();
      console.log('🔍 [DIAGNOSTIC] Transcript comparison:');
      console.log('  - transcript state:', transcript.length, 'chars -', transcript.substring(0, 50));
      console.log('  - getCurrentTranscript():', currentTranscript.length, 'chars -', currentTranscript.substring(0, 50));
      console.log('  - Are they equal?', transcript === currentTranscript);
      console.log('📝 [PracticePage] STEP 2: Captured transcript:', currentTranscript.substring(0, 100) + '...');
      console.log('📝 [PracticePage] Transcript length:', currentTranscript.length, 'characters');
      
      // STEP 4: Stop audio recording
      console.log('🎙️ [PracticePage] STEP 3: Stopping audio recording...');
      const blob = await stopRecording();
      console.log('✅ [PracticePage] Audio recording stopped, blob size:', blob?.size || 0, 'bytes');

      // STEP 5: Save the recording with the captured transcript
      if (blob) {
        const recording: Recording = {
          id: `recording-${Date.now()}`,
          questionId: currentQuestion.id,
          audioBlob: blob,
          transcript: currentTranscript, // Use the captured transcript
          duration: totalSpeechTime,
          timestamp: Date.now(),
        };

        console.log('💾 [PracticePage] STEP 4: Saving recording...');
        console.log('💾 [PracticePage] Recording details:', {
          id: recording.id,
          questionId: recording.questionId,
          transcriptLength: recording.transcript.length,
          duration: recording.duration,
          blobSize: recording.audioBlob.size,
        });
        
        setRecordings((prev) => {
          const newRecordings = [...prev, recording];
          console.log('✅ [PracticePage] Recording saved! Total recordings:', newRecordings.length);
          return newRecordings;
        });
      } else {
        console.warn('⚠️ [PracticePage] No audio blob available, recording not saved');
      }

      // STEP 6: Reset recording and detection states
      console.log('🔄 [PracticePage] STEP 5: Resetting recording and detection states...');
      resetRecording();
      resetDetection();
      console.log('✅ [PracticePage] States reset');
    } else {
      console.log('ℹ️ [PracticePage] Not recording, skipping save');
    }

    // STEP 7: Clear transcript for next question
    console.log('🧹 [PracticePage] STEP 6: Clearing transcript for next question...');
    resetTranscript();
    console.log('✅ [PracticePage] Transcript cleared');

    // Check if there are more questions
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      console.log('➡️ [PracticePage] STEP 7: Moving to next question:', currentQuestionIndex + 1);
      
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setHasAudioEnded(false);
      
      // Get next question to determine how to start it
      const nextQuestion = sampleQuestions[currentQuestionIndex + 1];
      console.log('📋 [PracticePage] Next question:', nextQuestion.id, 'Type:', nextQuestion.type);
      
      // Brief delay for smooth transition
      setTimeout(() => {
        if (!nextQuestion.media) {
          // Text-only question: Start recording immediately
          console.log('📝 [PracticePage] Text question - starting recording immediately');
          setPhase(AppPhase.Recording);
          // Ensure state updates before starting recording
          setTimeout(() => {
            handleStartRecording();
            setIsTransitioning(false);
          }, 100);
        } else {
          // Media question: Start preparation phase and auto-play video
          console.log('🎬 [PracticePage] Media question - starting preparation phase with auto-play');
          setPhase(AppPhase.Preparation);
          setIsTransitioning(false);
          // Video will auto-play and auto-start recording when it ends
        }
      }, 300);
    } else {
      // All questions completed - go to review
      console.log('✅ [PracticePage] All questions completed - showing review');
      setTimeout(() => {
        setPhase(AppPhase.Review);
        setIsTransitioning(false);
      }, 300);
    }
    
    console.log('🔄 [PracticePage] ========== handleNextQuestion END ==========');
  };

  const handleAudioEnded = () => {
    console.log('🎯 [PracticePage] handleAudioEnded called!');
    console.log('📊 [PracticePage] Current state:', {
      phase,
      currentQuestionIndex,
      hasAudioEnded,
      isRecording
    });
    setHasAudioEnded(true);
    // Auto-start recording immediately after media ends
    console.log('🎬 [PracticePage] Setting phase to Recording...');
    setPhase(AppPhase.Recording);
    console.log('🎤 [PracticePage] Calling handleStartRecording...');
    handleStartRecording();
    console.log('✅ [PracticePage] handleAudioEnded completed');
  };

  const handleRetry = () => {
    setPhase(AppPhase.Preparation);
    setCurrentQuestionIndex(0);
    setRecordings([]);
    setHasAudioEnded(false);
    resetRecording();
    resetTranscript();
    resetDetection();
  };

  const handleDownloadIndividual = (recordingId: string) => {
    const recording = recordings.find((r) => r.id === recordingId);
    if (recording) {
      downloadAudioBlob(recording.audioBlob, `recording-${recordingId}.webm`);
    }
  };

  const handleDownloadMerged = async () => {
    try {
      const blobs = recordings.map((r) => r.audioBlob);
      const mergedBlob = await mergeAudioBlobs(blobs);
      downloadAudioBlob(mergedBlob, 'ielts-practice-merged.wav');
      toast({
        title: 'Success',
        description: 'Merged audio downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to merge audio files',
        variant: 'destructive',
      });
    }
  };

  if (phase === AppPhase.Loading || sampleQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-lg text-foreground">
              Hi, just a moment while I prepare your question(s)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === AppPhase.Review) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <ReviewSection
            recordings={recordings}
            questions={sampleQuestions}
            onDownloadIndividual={handleDownloadIndividual}
            onDownloadMerged={handleDownloadMerged}
          />
          <div className="flex justify-center">
            <Button onClick={handleRetry} size="lg" className="gap-2">
              <RotateCcw className="w-5 h-5" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fluid external container with responsive padding */}
      <div className="p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-7xl mx-auto">
          <Card className="border-0">
            <CardContent className="p-0">
              {/* Three-Zone Layout with responsive spacing - Mobile-first approach */}
              <div className="flex flex-col gap-1 sm:gap-4 md:gap-6 px-0 sm:px-4 md:px-6 pb-4 sm:pb-6">
                
                {/* ZONE 1: INPUT ZONE - Video/Question Display */}
                <section 
                  className="w-full"
                  aria-label="Question input zone"
                >
                  {(phase === AppPhase.Preparation || phase === AppPhase.Recording) && (
                    <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                      <QuestionDisplay 
                        question={currentQuestion} 
                        onAudioEnded={handleAudioEnded}
                        isRecording={isRecording}
                        isPaused={isPaused}
                        onPauseRecording={pauseRecording}
                        onResumeRecording={resumeRecording}
                        currentQuestionIndex={currentQuestionIndex}
                        totalQuestions={sampleQuestions.length}
                      />
                    </div>
                  )}
                </section>

                {/* ZONE 2: CONTROL ZONE - Recording Controls and Feedback */}
                <section 
                  className="w-full space-y-[10px] px-6 sm:px-0"
                  aria-label="Recording control zone"
                >
                  {(phase === AppPhase.Preparation || phase === AppPhase.Recording) && (
                    <>
                      {/* Status Indicators Row - Responsive layout with mobile-first approach */}
                      <div className={cn(
                        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 md:gap-6 transition-opacity duration-300",
                        phase === AppPhase.Preparation && "opacity-40 pointer-events-none"
                      )}
                      role="region"
                      aria-label="Recording status indicators"
                      >
                        {/* Left: Recording Status */}
                        <div className="flex items-center justify-center h-12" style={{ flexBasis: 'content' }}>
                          <RecorderIndicator isRecording={isRecording} isPaused={isPaused} />
                        </div>
                        
                        {/* Center: Volume Bar */}
                        <div className="flex justify-center" style={{ flexBasis: 'content' }}>
                          <div className="h-12 flex items-center">
                            <AudioLevelBar 
                              level={phase === AppPhase.Recording ? audioLevel : 0}
                              aria-label="Audio level indicator"
                              aria-live="polite"
                            />
                          </div>
                        </div>
                        
                        {/* Right: Timer Display */}
                        <div className="text-center" style={{ flexBasis: 'content' }}>
                          <p className="text-sm text-muted-foreground mb-1">
                            Speaking Time / Target
                          </p>
                          <p className={cn(
                            "text-2xl font-bold tabular-nums transition-colors duration-300",
                            totalSpeechTime > currentQuestion.speakingDuration 
                              ? "text-destructive" // Warning state: red when exceeded target
                              : "text-foreground" // Normal state: default color
                          )}>
                            {Math.floor(totalSpeechTime / 60)}:{(totalSpeechTime % 60).toString().padStart(2, '0')}
                            <span className="text-muted-foreground mx-2">/</span>
                            {Math.floor(currentQuestion.speakingDuration / 60)}:
                            {(currentQuestion.speakingDuration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>

                      {/* Silence Indicator */}
                      {phase === AppPhase.Recording && (
                        <SilenceIndicator 
                          silenceState={silenceState} 
                          isPaused={isPaused}
                          onResume={resumeRecording}
                        />
                      )}

                      {/* Control Buttons - Enhanced visual feedback */}
                      <div className="flex justify-center gap-4 pt-2">
                        <Button 
                          onClick={handlePauseResume} 
                          variant="outline" 
                          size="lg"
                          className={cn(
                            "gap-2 min-h-[44px] w-[180px] transition-all duration-200",
                            "hover:opacity-80 active:scale-95",
                            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
                          )}
                          disabled={!isRecording || phase === AppPhase.Preparation}
                          aria-label={isPaused ? "Resume recording" : "Pause recording"}
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-5 h-5" aria-hidden="true" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-5 h-5" aria-hidden="true" />
                              Pause
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={handleNextQuestion} 
                          size="lg" 
                          className={cn(
                            "gap-2 min-h-[44px] w-[180px] transition-all duration-200",
                            "hover:opacity-80 active:scale-95",
                            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
                          )}
                          disabled={!isRecording || isTransitioning || phase === AppPhase.Preparation}
                          aria-label={currentQuestionIndex === sampleQuestions.length - 1 ? "Finish practice" : "Move to next question"}
                        >
                          {isTransitioning ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                              Loading...
                            </>
                          ) : currentQuestionIndex === sampleQuestions.length - 1 ? (
                            <>
                              Finish
                            </>
                          ) : (
                            <>
                              Next Question
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </section>

                {/* ZONE 3: OUTPUT ZONE - Transcript Display */}
                <section 
                  className="w-full px-6 sm:px-0"
                  aria-label="Transcript output zone"
                >
                  {(phase === AppPhase.Preparation || phase === AppPhase.Recording) && (
                    <div>
                      {isSpeechRecognitionSupported ? (
                        <div 
                          className="p-6 rounded-lg min-h-[8rem] max-h-[16rem] overflow-y-auto bg-[#F5F7FA] border border-border/50 mt-[30px]"
                          role="region"
                          aria-label="Live transcript"
                          aria-live="polite"
                          aria-atomic="false"
                        >
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                            Live Transcript
                          </h3>
                          <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                            {transcript || interimTranscript ? (
                              <>
                                <span className="text-foreground">{transcript}</span>
                                {interimTranscript && (
                                  <span className="text-muted-foreground italic">
                                    {transcript && ' '}
                                    {interimTranscript}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground italic">
                                Your speech will appear here as you speak...
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="bg-muted/50 border border-border p-6 rounded-lg min-h-[8rem] flex items-center justify-center"
                          role="alert"
                        >
                          <p className="text-sm text-warning text-center">
                            ⚠️ Speech recognition is not supported in your browser. Audio will be recorded but transcripts will not be available.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </section>

              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
