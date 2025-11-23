import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerProps {
  seconds: number;
  label?: string;
  variant?: 'default' | 'warning' | 'danger';
  className?: string;
}

export const Timer = ({ seconds, label, variant = 'default', className }: TimerProps) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const timeString = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

  const variantStyles = {
    default: 'text-foreground',
    warning: 'text-accent',
    danger: 'text-destructive',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Clock className={cn('w-5 h-5', variantStyles[variant])} />
      <div className="flex flex-col">
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
        <span className={cn('text-2xl font-bold tabular-nums', variantStyles[variant])}>
          {timeString}
        </span>
      </div>
    </div>
  );
};
