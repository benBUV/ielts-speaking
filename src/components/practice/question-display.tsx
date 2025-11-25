import { useState, useRef, useEffect } from 'react';
import { Volume2, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Question } from '@/types';
import { isYouTubeUrl, getYouTubeEmbedUrl, getYouTubeVideoId } from '@/lib/youtube-utils';
import { isVideoFile, getMediaMimeType } from '@/lib/media-utils';
import { useYouTubePlayer } from '@/hooks/use-youtube-player';
import { useToast } from '@/hooks/use-toast';

interface QuestionDisplayProps {
  question: Question;
  onAudioEnded?: () => void;
  isRecording?: boolean;
  isPaused?: boolean;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;
  currentQuestionIndex?: number;
  totalQuestions?: number;
}

export const QuestionDisplay = ({ 
  question, 
  onAudioEnded,
  isRecording = false,
  isPaused = false,
  onPauseRecording,
  onResumeRecording,
  currentQuestionIndex,
  totalQuestions,
}: QuestionDisplayProps) => {
  const { toast } = useToast();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [isVideoFileMedia, setIsVideoFileMedia] = useState(false);
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [wasRecordingBeforePlayback, setWasRecordingBeforePlayback] = useState(false);
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const youtubePlayerInstanceRef = useRef<any>(null);
  const autoStartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle video playback end - reset video and resume recording if needed
  const handleVideoEnd = () => {
    console.log('🎬 [QuestionDisplay] Video ended');
    setIsPlayingAudio(false);
    
    // Reset video to beginning for replay WITHOUT locking controls
    // Using pause() + currentTime reset keeps video in ready state
    if (videoRef.current) {
      videoRef.current.pause(); // Ensure video is paused
      videoRef.current.currentTime = 0; // Rewind to start
      console.log('🔄 [QuestionDisplay] Video reset to beginning (ready for replay)');
    }
    
    // Resume recording if it was paused for playback
    if (wasRecordingBeforePlayback && onResumeRecording) {
      console.log('▶️ [QuestionDisplay] Auto-resuming recording after video end');
      setWasRecordingBeforePlayback(false);
      onResumeRecording();
      toast({
        title: "Recording Resumed",
        description: "Continue speaking - your response is being recorded",
      });
    }
    
    // Call the original callback if provided
    onAudioEnded?.();
  };

  // Progressive enhancement: Load Player API in background for auto-start
  const { playerRef, isPlayerReady, isAPIReady } = useYouTubePlayer({
    videoId: youtubeVideoId,
    onVideoEnd: handleVideoEnd,
    onReady: () => {
      console.log('✅ [QuestionDisplay] YouTube Player ready - auto-start enabled');
    },
  });

  // Check if media is a YouTube video or video file
  useEffect(() => {
    console.log('🔍 [QuestionDisplay] Checking media:', question.media);
    setMediaError(null); // Reset error state
    
    if (question.media) {
      const isYT = isYouTubeUrl(question.media);
      const isVidFile = isVideoFile(question.media);
      
      setIsYouTubeVideo(isYT);
      setIsVideoFileMedia(isVidFile);
      
      if (isYT) {
        const embedUrl = getYouTubeEmbedUrl(question.media);
        const videoId = getYouTubeVideoId(question.media);
        setYoutubeEmbedUrl(embedUrl);
        setYoutubeVideoId(videoId);
        console.log('✅ [QuestionDisplay] YouTube video detected, ID:', videoId);
        console.log('🔗 [QuestionDisplay] Embed URL:', embedUrl);
      } else if (isVidFile) {
        console.log('✅ [QuestionDisplay] Video file detected:', question.media);
        console.log('📹 [QuestionDisplay] MIME type:', getMediaMimeType(question.media));
      } else {
        console.log('ℹ️ [QuestionDisplay] Audio file or other media type');
        console.log('🔊 [QuestionDisplay] MIME type:', getMediaMimeType(question.media));
      }
    }
  }, [question.media]);

  // Intelligent state management: Pause recording when video starts playing
  useEffect(() => {
    if (isPlayingAudio && isRecording && !isPaused) {
      console.log('⏸️ [QuestionDisplay] Video playback started during recording - auto-pausing recording');
      setWasRecordingBeforePlayback(true);
      onPauseRecording?.();
      toast({
        title: "Recording Paused",
        description: "Recording paused while video is playing",
      });
    }
  }, [isPlayingAudio, isRecording, isPaused, onPauseRecording, toast]);

  // Auto-start recording when video is unavailable
  useEffect(() => {
    // Clear any existing timer
    if (autoStartTimerRef.current) {
      clearInterval(autoStartTimerRef.current);
      autoStartTimerRef.current = null;
    }

    // Only auto-start if there's a media error and we're not already recording
    if (mediaError && !isRecording && onAudioEnded) {
      console.log('⚠️ [QuestionDisplay] Media unavailable - starting auto-start countdown');
      
      // Start countdown from 5 seconds
      let countdown = 5;
      setAutoStartCountdown(countdown);

      // Update countdown every second
      const intervalId = setInterval(() => {
        countdown -= 1;
        setAutoStartCountdown(countdown);

        if (countdown <= 0) {
          clearInterval(intervalId);
          setAutoStartCountdown(null);
          console.log('🎙️ [QuestionDisplay] Auto-starting recording after media failure');
          
          // Trigger recording start by calling onAudioEnded
          onAudioEnded();
          
          toast({
            title: "Recording Started",
            description: "Video unavailable - recording started automatically",
          });
        }
      }, 1000);

      autoStartTimerRef.current = intervalId;
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoStartTimerRef.current) {
        clearInterval(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }
    };
  }, [mediaError, isRecording, onAudioEnded, toast]);

  const handlePlayAudio = () => {
    if (!question.media) return;

    // If audio is already playing, pause it
    if (audioRef.current && isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    // Create new audio instance
    const audio = new Audio(question.media);
    audioRef.current = audio;
    setIsPlayingAudio(true);

    audio.onended = () => {
      setIsPlayingAudio(false);
      audioRef.current = null;
      onAudioEnded?.();
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
      audioRef.current = null;
      console.error('Failed to load audio:', question.media);
    };

    audio.play().catch((error) => {
      console.error('Failed to play audio:', error);
      setIsPlayingAudio(false);
      audioRef.current = null;
    });
  };

  // Determine if card should be shown (for Part 2 questions during recording)
  const showCard = question.card && question.type === 'part2' && isRecording && !isPaused;

  return (
    <Card className="w-full border-[0px] border-solid border-[rgb(225,231,239)]">
      <CardContent className="px-0 sm:px-4 md:px-6 pb-0 sm:pb-4 md:pb-6">
        <div className="space-y-5">

          {/* Question Counter - Above video, left-aligned, 5px spacing */}
          {currentQuestionIndex !== undefined && totalQuestions !== undefined && (
            <div className="px-5 sm:px-0">
              <p className="w-full sm:min-w-[600px] sm:w-[70%] sm:max-w-4xl mx-auto text-left text-foreground mb-[5px]">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
          )}

          {/* Accessible text fallback - Always in DOM for screen readers */}
          {/* Visually hidden when media is present, visible when media is unavailable */}
          <div 
            id={`question-text-${question.id}`}
            className={!question.media ? "prose prose-lg max-w-none" : "sr-only"}
            role="region"
            aria-label="Question text content"
            aria-live="polite"
          >
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {question.text}
            </p>
          </div>

          {/* Consolidated error message with question text and countdown */}
          {mediaError && (
            <div className="space-y-3">
              {/* Consolidated error message with question text */}
              <div 
                className="flex flex-col items-center justify-center gap-4 px-6 py-5 bg-orange-50 dark:bg-orange-950 border-2 border-orange-300 dark:border-orange-700 rounded-lg"
                role="alert"
                aria-live="assertive"
              >
                {/* Error header */}
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <span className="text-2xl">⚠️</span>
                  <span className="font-semibold text-base">Whoops - video unavailable</span>
                </div>
                
                {/* Question text */}
                <div className="w-full text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Text question:</p>
                  <p className="text-lg font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                    {question.text}
                  </p>
                </div>
              </div>

              {/* Auto-start countdown indicator - disappears when recording starts */}
              {!isRecording && autoStartCountdown !== null && autoStartCountdown > 0 && (
                <div 
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-primary/10 border-2 border-primary/30 rounded-lg animate-pulse"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center gap-3 text-primary">
                    <div className="relative flex items-center justify-center w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                      <span className="text-xl font-bold z-10">{autoStartCountdown}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-base">Recording will start automatically</span>
                      <span className="text-sm opacity-90">Get ready to speak...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Part 2 Cue Card - Show when recording for Part 2 questions */}
          {showCard && (
            <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary rounded-lg">
              <h3 className="text-xl font-bold text-primary mb-4">
                {question.card.title}
              </h3>
              
              {question.card.subtitle && (
                <p className="font-semibold text-foreground mb-3 text-base">
                  {question.card.subtitle}
                </p>
              )}
              
              <ul className="space-y-3">
                {question.card.bullets.map((bullet, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-primary font-bold text-lg mt-0.5">•</span>
                    <span className="text-foreground text-base leading-relaxed">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Media content: YouTube video, video file, or audio */}
          {/* Hide media when Part 2 card is displayed */}
          {question.media && !showCard && (
            <div className="space-y-3 pt-0 mt-[30px] mb-[0px] border-[0px] border-solid border-[rgb(225,231,239)]">
              {isYouTubeVideo && youtubeEmbedUrl ? (
                // YouTube Video Player (Progressive Enhancement)
                // CRITICAL: pointer-events-auto ensures YouTube player is always clickable during recording
                (<div className="flex flex-col items-center justify-center gap-1.5 mt-[30px] mb-[0px] pointer-events-auto px-5 sm:px-0">
                  {/* Progressive Enhancement: Show iframe first, upgrade to Player API when ready */}
                  <div 
                    key={`youtube-container-${question.id}`}
                    className="w-full sm:min-w-[600px] sm:w-[70%] sm:max-w-4xl mx-auto aspect-video rounded-lg overflow-hidden relative pointer-events-auto transition-all duration-300"
                    role="region"
                    aria-label="Question video player"
                    aria-describedby={`question-text-${question.id}`}
                  >
                    {/* Always render the player div for ref attachment */}
                    <div 
                      ref={playerRef} 
                      className="w-full h-full absolute inset-0 pointer-events-auto"
                      aria-label={`Video question: ${question.text}`}
                    />
                    
                    {/* Show iframe overlay until Player API is ready */}
                    {!isPlayerReady && (
                      <iframe
                        key={youtubeEmbedUrl}
                        src={youtubeEmbedUrl}
                        title={`Question Video: ${question.text}`}
                        className="w-full h-full absolute inset-0 z-10 pointer-events-auto"
                        style={{ pointerEvents: 'auto' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        aria-describedby={`question-text-${question.id}`}
                      />
                    )}
                  </div>
                  <p className={`text-sm text-muted-foreground text-center transition-opacity duration-300 mt-[5px] mb-[-20px] ${isPlayingAudio ? 'opacity-0' : 'opacity-100'}`}>
                    Press play to begin
                  </p>
                </div>)
              ) : isVideoFileMedia ? (
                // HTML5 Video Player (for .mp4, .webm files)
                // CRITICAL: pointer-events-auto ensures video is always clickable during recording
                (<div className="flex flex-col items-center justify-center gap-1.5 mt-[30px] mb-[0px] pointer-events-auto px-5 sm:px-0">
                  <div 
                    className="w-full sm:min-w-[600px] sm:w-[70%] sm:max-w-4xl mx-auto rounded-lg overflow-hidden bg-black pointer-events-auto transition-all duration-300"
                    role="region"
                    aria-label="Question video player"
                    aria-describedby={`question-text-${question.id}`}
                  >
                    <video
                      key={question.media}
                      ref={videoRef}
                      controls
                      controlsList="nodownload"
                      playsInline
                      preload="auto"
                      className="w-full h-auto pointer-events-auto"
                      style={{ maxHeight: '500px', pointerEvents: 'auto' }}
                      aria-label={`Video question: ${question.text}`}
                      aria-describedby={`question-text-${question.id}`}
                      onEnded={() => {
                        console.log('📹 [QuestionDisplay] Video ended');
                        handleVideoEnd();
                      }}
                      onPlay={() => {
                        console.log('▶️ [QuestionDisplay] Video playing');
                        setIsPlayingAudio(true);
                        
                        // Auto-pause recording if playing during recording
                        if (isRecording && !isPaused) {
                          console.log('⏸️ [QuestionDisplay] Auto-pausing recording for video playback');
                          setWasRecordingBeforePlayback(true);
                          onPauseRecording?.();
                          toast({
                            title: "Recording Paused",
                            description: "Recording paused while video is playing",
                          });
                        }
                      }}
                      onPause={() => {
                        console.log('⏸️ [QuestionDisplay] Video paused');
                        setIsPlayingAudio(false);
                      }}
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget;
                        console.log('📊 [QuestionDisplay] Video metadata loaded:', {
                          duration: video.duration,
                          videoWidth: video.videoWidth,
                          videoHeight: video.videoHeight,
                          hasVideo: video.videoWidth > 0 && video.videoHeight > 0,
                        });
                        if (video.videoWidth === 0 || video.videoHeight === 0) {
                          setMediaError('This file appears to be audio-only. No video track detected.');
                        } else {
                          // Ensure video shows first frame by seeking to start
                          // This makes the video visible even when not playing
                          video.currentTime = 0;
                        }
                      }}
                      onLoadedData={(e) => {
                        const video = e.currentTarget;
                        console.log('✅ [QuestionDisplay] Video data loaded - first frame should be visible');
                        // Ensure we're at the beginning to show first frame
                        if (video.currentTime === 0 || video.paused) {
                          video.currentTime = 0;
                        }
                      }}
                      onError={(e) => {
                        const video = e.currentTarget;
                        const error = video.error;
                        console.error('❌ [QuestionDisplay] Video error:', {
                          code: error?.code,
                          message: error?.message,
                          src: question.media,
                        });
                        setMediaError(`Video error: ${error?.message || 'Failed to load video'}`);
                      }}
                    >
                      <source src={question.media} type={getMediaMimeType(question.media)} />
                      <p className="text-white p-4">
                        Your browser does not support the video element. Please refer to the question text above.
                      </p>
                    </video>
                  </div>
                  {wasRecordingBeforePlayback && isPlayingAudio && (
                    <div className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400 px-4 py-2 rounded-md flex items-center gap-2">
                      <Pause className="w-4 h-4" />
                      <span>Recording paused during video playback</span>
                    </div>
                  )}
                  <p className={`text-sm text-muted-foreground text-center transition-opacity duration-300 mt-[5px] mb-[-20px] ${isPlayingAudio ? 'opacity-0' : 'opacity-100'}`}>
                    Press play to begin
                  </p>
                </div>)
              ) : (
                // Audio Player (for non-YouTube, non-video media)
                (<div className="flex flex-col items-center justify-center gap-4">
                  <div className="text-center text-muted-foreground text-sm">
                    Audio Version Available
                  </div>
                  {/* HTML5 Audio Player */}
                  <audio 
                    key={question.media}
                    controls 
                    className="w-full sm:min-w-[600px] sm:w-[70%] sm:max-w-4xl mx-auto transition-all duration-300"
                    aria-label={`Audio question: ${question.text}`}
                    aria-describedby={`question-text-${question.id}`}
                    onEnded={() => {
                      setIsPlayingAudio(false);
                      onAudioEnded?.();
                    }}
                    onPlay={() => setIsPlayingAudio(true)}
                    onPause={() => setIsPlayingAudio(false)}
                  >
                    <source src={question.media} type={getMediaMimeType(question.media) || 'audio/mpeg'} />
                    <p>Your browser does not support the audio element. Please refer to the question text above.</p>
                  </audio>
                  {/* Alternative: Custom Play Button */}
                  <Button
                    onClick={handlePlayAudio}
                    size="lg"
                    className="gap-2"
                    variant={isPlayingAudio ? "secondary" : "default"}
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-5 h-5" />
                        Pause Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-5 h-5" />
                        Play Audio Question
                      </>
                    )}
                  </Button>
                </div>)
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
