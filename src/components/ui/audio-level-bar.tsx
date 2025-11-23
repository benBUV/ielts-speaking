import { cn } from '@/lib/utils';

interface AudioLevelBarProps {
  level: number;
  className?: string;
  'aria-label'?: string;
  'aria-live'?: 'polite' | 'assertive' | 'off';
}

export const AudioLevelBar = ({ 
  level, 
  className,
  'aria-label': ariaLabel = 'Audio level indicator',
  'aria-live': ariaLive = 'polite'
}: AudioLevelBarProps) => {
  const bars = 7; // 7 bars total (added 2 more)
  const activeBars = Math.round(level * bars);
  const percentage = Math.round(level * 100);

  return (
    <div 
      className={cn('flex items-center gap-1 h-full', className)}
      role="meter"
      aria-label={ariaLabel}
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-live={ariaLive}
    >
      {Array.from({ length: bars }).map((_, index) => {
        const isActive = index < activeBars;

        return (
          <div
            key={index}
            className={cn(
              'w-3 h-3 rounded-sm transition-all duration-150',
              isActive 
                ? 'bg-volume-active animate-fade-in scale-100' 
                : 'bg-muted-foreground scale-75 opacity-100'
            )}
            style={{
              transitionDelay: `${index * 20}ms`
            }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
};
