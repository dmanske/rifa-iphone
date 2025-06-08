
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentTimer } from '@/hooks/usePaymentTimer';
import { usePaymentCheck } from '@/hooks/usePaymentCheck';
import PaymentStatus from './payment/PaymentStatus';
import ProcessingTimer from './payment/ProcessingTimer';
import PurchaseSummary from './payment/PurchaseSummary';
import PaymentInfo from './payment/PaymentInfo';
import PixInstructions from './payment/PixInstructions';

interface PaymentWaitingProps {
  transactionId: string;
  paymentId: string;
  paymentMethod: 'pix' | 'cartao';
  selectedNumbers: number[];
  totalAmount: number;
  onPaymentConfirmed: () => void;
  onBack: () => void;
}

const PaymentWaiting: React.FC<PaymentWaitingProps> = ({
  transactionId,
  paymentId,
  paymentMethod,
  selectedNumbers,
  totalAmount,
  onPaymentConfirmed,
  onBack
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<'waiting' | 'confirmed' | 'processing' | 'timeout'>('waiting');
  const [fetchedTransactionData, setFetchedTransactionData] = useState<any>(null);
  const [hasReturnedFromApp, setHasReturnedFromApp] = useState(false);

  const handleTimeout = () => {
    console.log('⏰ Timeout atingido');
    setStatus('timeout');
    toast({
      title: "Verificação contínua",
      description: "Continuamos verificando seu pagamento em segundo plano...",
      variant: "default"
    });
  };

  const handleProcessingComplete = () => {
    console.log('🎉 Processamento concluído! Redirecionando...');
    setStatus('confirmed');
    
    toast({
      title: "Processamento concluído!",
      description: "Redirecionando para seus números da sorte...",
    });
    
    // Usar callback interno - não mais window.location.href
    setTimeout(() => {
      onPaymentConfirmed();
    }, 1500);
  };

  const {
    timeElapsed,
    processingTimer,
    formatTime,
    startElapsedTimer,
    stopElapsedTimer,
    startProcessingTimer,
    cleanup
  } = usePaymentTimer({ onTimeout: handleTimeout, onProcessingComplete: handleProcessingComplete });

  const handleStartProcessing = (transactionData?: any) => {
    console.log('🚀 Iniciando processamento com dados:', transactionData);
    setStatus('processing');
    setFetchedTransactionData(transactionData);
    stopElapsedTimer();
    startProcessingTimer();
  };

  const { checkCount, transactionData, startChecking } = usePaymentCheck({
    transactionId,
    onPaymentConfirmed,
    onStartProcessing: handleStartProcessing
  });

  // MELHORADO: Detectar quando a janela ganha foco (usuário volta do MercadoPago)
  useEffect(() => {
    let focusTimeoutId: NodeJS.Timeout;
    
    const handleWindowFocus = () => {
      console.log('👁️ Janela ganhou foco - usuário pode ter voltado do app de pagamento');
      setHasReturnedFromApp(true);
      
      // Aguardar um pouco para o app se estabilizar, depois forçar verificação
      clearTimeout(focusTimeoutId);
      focusTimeoutId = setTimeout(() => {
        console.log('🔄 Forçando verificação após retorno do app...');
        // A verificação já está rodando automaticamente, mas acelera o processo
      }, 1000);
    };

    const handleWindowBlur = () => {
      console.log('👁️ Janela perdeu foco - usuário pode ter ido para app de pagamento');
    };

    // Detectar mudanças de visibilidade da página (mais confiável que focus/blur)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Página ficou visível - verificando pagamento...');
        setHasReturnedFromApp(true);
        
        clearTimeout(focusTimeoutId);
        focusTimeoutId = setTimeout(() => {
          console.log('🔄 Verificação acelerada após retorno...');
        }, 500);
      } else {
        console.log('👁️ Página ficou oculta - usuário pode ter ido para outro app');
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(focusTimeoutId);
    };
  }, []);

  useEffect(() => {
    console.log('🕐 Iniciando verificação ACELERADA de pagamento para:', { transactionId, paymentId });
    
    startElapsedTimer();
    const cleanupChecking = startChecking();

    return () => {
      cleanup();
      cleanupChecking();
    };
  }, [transactionId, paymentId]);

  const getProcessingMessage = () => {
    if (hasReturnedFromApp && paymentMethod === 'pix') {
      return 'Verificando seu pagamento PIX... Aguarde alguns segundos.';
    }
    
    if (timeElapsed < 5) {
      return "Processando pagamento... Aguarde alguns segundos.";
    }
    
    return paymentMethod === 'pix' 
      ? 'Aguardando confirmação do PIX... (verificando a cada 2 segundos)'
      : 'Processando pagamento no cartão...';
  };

  // Show processing/confirmed screens
  if (status === 'processing' || status === 'confirmed') {
    return (
      <ProcessingTimer 
        processingTimer={processingTimer} 
        status={status}
        transactionData={fetchedTransactionData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Aguardando Pagamento</h1>
              <p className="text-sm text-gray-600">
                {paymentMethod === 'pix' ? 'PIX (R$ 1,00 - TESTE)' : 'Cartão de Crédito'} - {selectedNumbers.length} números
              </p>
              {hasReturnedFromApp && paymentMethod === 'pix' && (
                <p className="text-xs text-green-600 mt-1">✓ Verificando pagamento realizado</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <PaymentStatus
            status={status}
            paymentMethod={paymentMethod}
            timeElapsed={timeElapsed}
            formatTime={formatTime}
            checkCount={checkCount}
            getProcessingMessage={getProcessingMessage}
          />

          <PurchaseSummary
            selectedNumbers={selectedNumbers}
            totalAmount={totalAmount}
          />

          <PaymentInfo
            transactionId={transactionId}
            paymentId={paymentId}
            paymentMethod={paymentMethod}
          />

          {paymentMethod === 'pix' && <PixInstructions />}

          <div className="text-center">
            <button
              onClick={onBack}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Cancelar e Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentWaiting;
