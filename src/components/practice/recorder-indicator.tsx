import { Circle, Square } from 'lucide-react';

interface RecorderIndicatorProps {
  isRecording: boolean;
  isPaused: boolean;
}

export const RecorderIndicator = ({ isRecording, isPaused }: RecorderIndicatorProps) => {
  if (!isRecording) {
    // Not recording - show square (inactive)
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Square className="w-4 h-4 fill-current" />
        <span className="text-sm font-medium w-[120px] text-left">Ready</span>
      </div>
    );
  }

  if (isPaused) {
    // Recording paused - show square
    return (
      <div className="flex items-center gap-2 text-warning">
        <Square className="w-4 h-4 fill-current" />
        <span className="text-sm font-medium w-[120px] text-left">Paused</span>
      </div>
    );
  }

  // Recording active - show red circle with pulse animation
  return (
    <div className="flex items-center gap-2 text-destructive">
      <Circle className="w-4 h-4 fill-current animate-pulse" />
      <span className="text-sm font-medium w-[120px] text-left">Recording</span>
    </div>
  );
};
