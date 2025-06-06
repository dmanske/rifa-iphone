
import { useState, useRef, useEffect } from 'react';

interface UsePaymentTimerProps {
  onTimeout: () => void;
  onProcessingComplete: () => void;
}

export const usePaymentTimer = ({ onTimeout, onProcessingComplete }: UsePaymentTimerProps) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [processingTimer, setProcessingTimer] = useState(7);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startElapsedTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };

  const stopElapsedTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startProcessingTimer = () => {
    processingIntervalRef.current = setInterval(() => {
      setProcessingTimer(prev => {
        const newTimer = prev - 1;
        console.log('⏰ Timer de processamento:', newTimer);
        
        if (newTimer <= 0) {
          console.log('⏰ Timer finalizado, redirecionando...');
          if (processingIntervalRef.current) {
            clearInterval(processingIntervalRef.current);
            processingIntervalRef.current = null;
          }
          onProcessingComplete();
        }
        
        return newTimer;
      });
    }, 1000);
  };

  const stopProcessingTimer = () => {
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
  };

  const cleanup = () => {
    stopElapsedTimer();
    stopProcessingTimer();
  };

  // Timeout after 10 minutes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onTimeout();
      cleanup();
    }, 600000);

    return () => {
      clearTimeout(timeoutId);
      cleanup();
    };
  }, [onTimeout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeElapsed,
    processingTimer,
    formatTime,
    startElapsedTimer,
    stopElapsedTimer,
    startProcessingTimer,
    stopProcessingTimer,
    cleanup
  };
};
