import { useEffect, useRef, useState } from 'react';

/**
 * YouTube Player API types
 */
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: YTPlayerConfig) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerConfig {
  videoId: string;
  playerVars?: {
    enablejsapi?: number;
    rel?: number;
    modestbranding?: number;
    autoplay?: number;  // 0 = no autoplay, 1 = autoplay
  };
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTPlayerEvent) => void;
    onError?: (event: YTPlayerEvent) => void;
  };
}

interface YTPlayer {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

interface UseYouTubePlayerProps {
  videoId: string | null;
  onVideoEnd?: () => void;
  onReady?: () => void;
}

interface UseYouTubePlayerReturn {
  playerRef: React.RefObject<HTMLDivElement>;
  isPlayerReady: boolean;
  isAPIReady: boolean;
}

/**
 * Custom hook for YouTube Player API integration
 * 
 * This hook loads the YouTube Player API and initializes a player instance.
 * It provides reliable video end detection for auto-start recording functionality.
 * 
 * Progressive Enhancement Strategy:
 * - Iframe shows immediately (fast loading)
 * - Player API loads in background
 * - When ready, upgrade to Player API for auto-start
 * - If API fails, iframe continues to work
 */
export const useYouTubePlayer = ({
  videoId,
  onVideoEnd,
  onReady,
}: UseYouTubePlayerProps): UseYouTubePlayerReturn => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<YTPlayer | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isAPIReady, setIsAPIReady] = useState(false);

  // Load YouTube Player API script
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      console.log('YouTube Player API already loaded');
      setIsAPIReady(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (existingScript) {
      console.log('YouTube Player API script already loading');
      // Wait for it to load
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube Player API ready (existing script)');
        setIsAPIReady(true);
      };
      return;
    }

    console.log('Loading YouTube Player API script');

    // Create and load the script
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    
    // Set up callback for when API is ready
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube Player API ready');
      setIsAPIReady(true);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup: remove the callback
      if (window.onYouTubeIframeAPIReady) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, []);

  // Initialize YouTube Player when API is ready and videoId is available
  useEffect(() => {
    console.log('🎬 [YouTube Player] Effect triggered:', {
      isAPIReady,
      videoId,
      hasPlayerRef: !!playerRef.current,
      hasOnVideoEnd: !!onVideoEnd
    });

    if (!isAPIReady || !videoId || !playerRef.current) {
      console.log('⏸️ [YouTube Player] Skipping initialization - missing requirements');
      return;
    }

    // Generate unique ID for the player element
    const playerId = `youtube-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    playerRef.current.id = playerId;

    console.log('🚀 [YouTube Player] Initializing Player for video:', videoId, 'with player ID:', playerId);

    try {
      // Create YouTube Player instance
      // CRITICAL: autoplay is set to 0 to prevent automatic playback
      // User MUST manually click play button on the video
      // Recording will start automatically ONLY when video ends naturally after user plays it
      const player = new window.YT.Player(playerId, {
        videoId: videoId,
        playerVars: {
          enablejsapi: 1,      // Enable JavaScript API for event detection
          rel: 0,              // Don't show related videos
          modestbranding: 1,   // Minimal YouTube branding
          autoplay: 0,         // CRITICAL: Disable autoplay - user must click play
        },
        events: {
          onReady: () => {
            console.log('✅ [YouTube Player] Player ready - autoplay disabled, user must click play');
            console.log('🎯 [YouTube Player] onVideoEnd callback is:', onVideoEnd ? 'CONNECTED ✅' : 'NOT CONNECTED ❌');
            setIsPlayerReady(true);
            onReady?.();
          },
          onStateChange: (event) => {
            const stateNames: Record<number, string> = {
              [-1]: 'UNSTARTED',
              [0]: 'ENDED',
              [1]: 'PLAYING',
              [2]: 'PAUSED',
              [3]: 'BUFFERING',
              [5]: 'CUED'
            };
            const stateName = stateNames[event.data] || 'UNKNOWN';
            console.log(`🎥 [YouTube Player] State changed: ${event.data} (${stateName})`);
            
            // Check if video ended naturally (state = 0)
            // This event fires ONLY when video finishes playing after user manually started it
            if (event.data === window.YT.PlayerState.ENDED) {
              console.log('🎬 [YouTube Player] Video ENDED detected!');
              console.log('📞 [YouTube Player] Calling onVideoEnd callback...');
              if (onVideoEnd) {
                console.log('✅ [YouTube Player] onVideoEnd callback exists, calling it now');
                onVideoEnd();  // Start audio recording
                console.log('✅ [YouTube Player] onVideoEnd callback called successfully');
              } else {
                console.error('❌ [YouTube Player] onVideoEnd callback is NULL/UNDEFINED - cannot trigger recording!');
              }
            }
          },
          onError: (event) => {
            console.error('❌ [YouTube Player] Error:', event);
          },
        },
      });

      playerInstanceRef.current = player;

      // Cleanup function
      return () => {
        console.log('Cleaning up YouTube Player');
        try {
          if (playerInstanceRef.current) {
            playerInstanceRef.current.destroy();
            playerInstanceRef.current = null;
          }
        } catch (error) {
          console.error('Error destroying YouTube Player:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing YouTube Player:', error);
    }
  }, [isAPIReady, videoId, onVideoEnd, onReady]);

  return {
    playerRef,
    isPlayerReady,
    isAPIReady,
  };
};
