import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface TimerIndicatorProps {
  className?: string;
}

export function TimerIndicator({ className }: TimerIndicatorProps) {
  const { timer, updateTimer, settings } = useAppStore();

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      updateTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateTimer]);

  // Format time display
  const formatTime = (minutes: number, seconds: number): string => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Determine timer color based on remaining time
  const getTimerColor = () => {
    const totalMinutes = timer.minutes + (timer.seconds / 60);
    const originalMinutes = settings?.pomodoroMinutes || 25;
    const percentage = totalMinutes / originalMinutes;
    
    if (percentage > 0.5) return 'bg-green-500';
    if (percentage > 0.25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`flex items-center space-x-2 ${className || ''}`}>
      <div className={`w-2 h-2 rounded-full ${timer.isRunning ? 'animate-pulse' : ''} ${getTimerColor()}`} />
      <span className="font-mono">
        {formatTime(timer.minutes, timer.seconds)}
      </span>
    </div>
  );
}
