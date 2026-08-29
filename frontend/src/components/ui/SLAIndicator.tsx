import { useEffect, useState } from 'react';
import { getRealTimeRemaining, formatDateTime, cn } from '../../lib/utils';
import { Clock } from 'lucide-react';

interface SLAIndicatorProps {
  dueDate: string;
  showIcon?: boolean;
  className?: string;
}

export function SLAIndicator({ dueDate, showIcon = true, className }: SLAIndicatorProps) {
  const [timeInfo, setTimeInfo] = useState(() => getRealTimeRemaining(dueDate));

  useEffect(() => {
    // Update every second for live real-time countdown
    const timer = setInterval(() => {
      setTimeInfo(getRealTimeRemaining(dueDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [dueDate]);

  const config = {
    on_track: {
      color: 'text-emerald-700 bg-emerald-50/80 border-emerald-200',
      dot: 'bg-emerald-500',
      pulse: 'bg-emerald-400',
    },
    approaching: {
      color: 'text-amber-700 bg-amber-50/80 border-amber-300',
      dot: 'bg-amber-500',
      pulse: 'bg-amber-400',
    },
    breached: {
      color: 'text-red-700 bg-red-50/80 border-red-300',
      dot: 'bg-red-500',
      pulse: 'bg-red-400',
    },
  }[timeInfo.status];

  return (
    <span
      title={`Statutory RTS Due Date: ${formatDateTime(dueDate)}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold select-none shadow-xs transition-colors',
        config.color,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', config.pulse)} />
        <span className={cn('relative inline-flex rounded-full h-2 w-2', config.dot)} />
      </span>
      {showIcon && <Clock className="w-3 h-3 opacity-70" />}
      <span className="font-mono tracking-tight">{timeInfo.formatted}</span>
    </span>
  );
}
