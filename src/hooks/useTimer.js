import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer({ enabled, totalSeconds, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!enabled || !isRunning) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [enabled, isRunning, onExpire]);

  const percentage = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0;
  const isWarning = percentage < 25;
  const isCritical = percentage < 10;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return { timeLeft, formattedTime: formatTime(timeLeft), percentage, isWarning, isCritical, start, pause, reset, isRunning };
}
