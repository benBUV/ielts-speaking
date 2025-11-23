import { Mic, MicOff } from 'lucide-react';
import type { SilenceState } from '@/hooks/use-speech-detection';

interface SilenceIndicatorProps {
  silenceState: SilenceState;
  isPaused: boolean;
  onResume?: () => void;
}

export function SilenceIndicator({ silenceState, isPaused, onResume }: SilenceIndicatorProps) {
  // Don't show anything for normal states
  if (silenceState === 'none' || silenceState === 'short') {
    return null;
  }

  // Medium silence: Soft indicator
  if (silenceState === 'medium' && isPaused) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-4 bg-muted/50 rounded-lg border border-muted-foreground/20 animate-in fade-in duration-300">
        <MicOff className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Paused — waiting for speech
        </p>
      </div>
    );
  }

  // Long silence: Gentle prompt
  if (silenceState === 'long' && isPaused) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-4 px-6 bg-muted/50 rounded-lg border border-muted-foreground/20 animate-in fade-in duration-300">
        <Mic className="w-5 h-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Ready when you're ready — tap Resume to continue
        </p>
        {onResume && (
          <button
            onClick={onResume}
            className="text-xs text-primary hover:text-primary/80 transition-colors underline"
          >
            Resume Recording
          </button>
        )}
      </div>
    );
  }

  return null;
}
