
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsePaymentCheckProps {
  transactionId: string;
  onPaymentConfirmed: () => void;
  onStartProcessing: (transactionData?: any) => void;
}

export const usePaymentCheck = ({ transactionId, onPaymentConfirmed, onStartProcessing }: UsePaymentCheckProps) => {
  const { toast } = useToast();
  const [checkCount, setCheckCount] = useState(0);
  const [transactionData, setTransactionData] = useState<any>(null);
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
        console.log('✅ Pagamento confirmado! Dados da transação:', transactions[0]);
        hasConfirmed.current = true;
        
        const transaction = transactions[0];
        setTransactionData(transaction);
        
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        
        toast({
          title: "Pagamento aprovado!",
          description: "Processando seus números da sorte...",
        });
        
        // Passar os dados da transação para o processamento
        onStartProcessing(transaction);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
    }
  };

  const startChecking = () => {
    console.log('🚀 Iniciando verificação de pagamento - MODO ACELERADO');
    
    // Primeira verificação imediata
    checkPaymentStatus();
    
    // Configurar intervalo MAIS RÁPIDO para testes
    checkIntervalRef.current = setInterval(() => {
      checkPaymentStatus();
    }, 2000); // Verificar a cada 2 segundos (mais rápido)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  };

  const stopChecking = () => {
    console.log('⏸️ Parando verificação de pagamento');
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  };

  return {
    checkCount,
    transactionData,
    startChecking,
    stopChecking,
    hasConfirmed: hasConfirmed.current
  };
};
