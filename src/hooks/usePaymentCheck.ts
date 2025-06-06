
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsePaymentCheckProps {
  transactionId: string;
  onPaymentConfirmed: () => void;
  onStartProcessing: () => void;
}

export const usePaymentCheck = ({ transactionId, onPaymentConfirmed, onStartProcessing }: UsePaymentCheckProps) => {
  const { toast } = useToast();
  const [checkCount, setCheckCount] = useState(0);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasConfirmed = useRef(false);

  const checkPaymentStatus = async () => {
    try {
      console.log('🔍 Verificando status do pagamento... (check #' + (checkCount + 1) + ')');
      
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('status', 'pago')
        .limit(1);

      setCheckCount(prev => prev + 1);

      if (transactions && transactions.length > 0 && !hasConfirmed.current) {
        console.log('✅ Pagamento confirmado! Aguardando processamento completo...');
        hasConfirmed.current = true;
        
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        
        toast({
          title: "Pagamento aprovado!",
          description: "Aguarde enquanto finalizamos o processamento...",
        });
        
        onStartProcessing();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
    }
  };

  const startChecking = () => {
    // Primeira verificação após 8 segundos
    const initialCheckTimeout = setTimeout(() => {
      checkPaymentStatus();
      
      // Configurar intervalo progressivo
      checkIntervalRef.current = setInterval(() => {
        checkPaymentStatus();
      }, checkCount < 3 ? 8000 : 5000);
    }, 8000);

    return () => {
      clearTimeout(initialCheckTimeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  };

  const stopChecking = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  };

  return {
    checkCount,
    startChecking,
    stopChecking,
    hasConfirmed: hasConfirmed.current
  };
};
