
import { useState, useRef, useEffect } from 'react';

interface UsePaymentTimerProps {
  onTimeout: () => void;
  onProcessingComplete: () => void;
}

export const usePaymentTimer = ({ onTimeout, onProcessingComplete }: UsePaymentTimerProps) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [processingTimer, setProcessingTimer] = useState(10); // Aumentado para 10 segundos
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startElapsedTimer = () => {
    console.log('⏰ Iniciando timer de tempo decorrido');
    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        console.log('⏰ Tempo decorrido:', newTime + 's');
        return newTime;
      });
    }, 1000);
  };

  const stopElapsedTimer = () => {
    console.log('⏸️ Parando timer de tempo decorrido');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startProcessingTimer = () => {
    console.log('🚀 Iniciando timer de processamento (10s)');
    setProcessingTimer(10); // Reset para 10 segundos
    
    processingIntervalRef.current = setInterval(() => {
      setProcessingTimer(prev => {
        const newTimer = prev - 1;
        console.log('⏰ Timer de processamento:', newTimer);
        
        if (newTimer <= 0) {
          console.log('✅ Timer finalizado, executando callback...');
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
    console.log('⏸️ Parando timer de processamento');
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
  };

  const cleanup = () => {
    console.log('🧹 Limpando timers');
    stopElapsedTimer();
    stopProcessingTimer();
  };

  // Timeout after 10 minutes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout de 10 minutos atingido');
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
