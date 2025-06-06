
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

  const handleTimeout = () => {
    console.log('⏰ Timeout atingido');
    setStatus('timeout');
    toast({
      title: "Tempo limite atingido",
      description: "Continue aguardando o pagamento ou entre em contato conosco.",
      variant: "default"
    });
  };

  const handleProcessingComplete = () => {
    setStatus('confirmed');
    toast({
      title: "Processamento concluído!",
      description: "Redirecionando para seus números da sorte...",
    });
    
    setTimeout(() => {
      const urlParams = new URLSearchParams();
      urlParams.set('payment_success', 'true');
      urlParams.set('payment_id', paymentId);
      urlParams.set('transaction_id', transactionId);
      urlParams.set('status', 'approved');
      urlParams.set('source', 'mercadopago');
      
      const newUrl = window.location.origin + '/success?' + urlParams.toString();
      console.log('🔄 Redirecionando para:', newUrl);
      window.location.href = newUrl;
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

  const handleStartProcessing = () => {
    setStatus('processing');
    stopElapsedTimer();
    startProcessingTimer();
  };

  const { checkCount, startChecking } = usePaymentCheck({
    transactionId,
    onPaymentConfirmed,
    onStartProcessing: handleStartProcessing
  });

  useEffect(() => {
    console.log('🕐 Iniciando verificação de pagamento para:', { transactionId, paymentId });
    
    startElapsedTimer();
    const cleanupChecking = startChecking();

    return () => {
      cleanup();
      cleanupChecking();
    };
  }, [transactionId, paymentId]);

  const getProcessingMessage = () => {
    if (timeElapsed < 10) {
      return "Processando pagamento... Aguarde alguns segundos.";
    }
    return paymentMethod === 'pix' 
      ? 'Aguardando confirmação do PIX...'
      : 'Processando pagamento no cartão...';
  };

  // Show processing/confirmed screens
  if (status === 'processing' || status === 'confirmed') {
    return <ProcessingTimer processingTimer={processingTimer} status={status} />;
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
                {paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'} - {selectedNumbers.length} números
              </p>
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
