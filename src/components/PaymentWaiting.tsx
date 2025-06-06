
import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, Loader2, ArrowLeft, Clock, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'confirmed' | 'timeout'>('waiting');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasConfirmed = useRef(false);

  useEffect(() => {
    console.log('🕐 Iniciando verificação de pagamento para:', { transactionId, paymentId });

    // Timer para contar tempo decorrido
    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Verificação periódica do status do pagamento
    const checkPaymentStatus = async () => {
      try {
        console.log('🔍 Verificando status do pagamento...');
        
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .eq('status', 'pago')
          .limit(1);

        if (transactions && transactions.length > 0 && !hasConfirmed.current) {
          console.log('✅ Pagamento confirmado! Redirecionando...');
          hasConfirmed.current = true;
          setStatus('confirmed');
          
          // Limpar intervalos
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
          
          toast({
            title: "Pagamento aprovado!",
            description: "Seus números foram confirmados com sucesso. Redirecionando...",
          });
          
          // Aguardar um momento e redirecionar
          setTimeout(() => {
            onPaymentConfirmed();
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
      }
    };

    // Verificar imediatamente
    checkPaymentStatus();

    // Verificar a cada 5 segundos
    checkIntervalRef.current = setInterval(checkPaymentStatus, 5000);

    // Timeout após 10 minutos
    const timeoutId = setTimeout(() => {
      if (!hasConfirmed.current) {
        console.log('⏰ Timeout atingido');
        setStatus('timeout');
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        
        toast({
          title: "Tempo limite atingido",
          description: "Continue aguardando o pagamento ou entre em contato conosco.",
          variant: "default"
        });
      }
    }, 600000); // 10 minutos

    // Cleanup
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      clearTimeout(timeoutId);
    };
  }, [transactionId, paymentId, onPaymentConfirmed, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'confirmed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Confirmado!
          </h2>
          <p className="text-gray-600 mb-4">
            Redirecionando para a tela de sucesso...
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
        </div>
      </div>
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
                {paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'} - {selectedNumbers.length} números
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Status do Pagamento */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {status === 'waiting' ? (
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                ) : (
                  <Clock className="w-8 h-8 text-orange-600" />
                )}
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {paymentMethod === 'pix' ? 'Aguardando Confirmação do PIX' : 'Processando Pagamento'}
              </h2>
              
              <p className="text-gray-600 mb-4">
                {paymentMethod === 'pix' 
                  ? 'Escaneie o QR Code ou cole o código PIX para efetuar o pagamento'
                  : 'Aguardando confirmação do cartão de crédito'
                }
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 text-blue-800">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Tempo decorrido: {formatTime(timeElapsed)}</span>
                </div>
              </div>

              {status === 'timeout' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <p className="text-orange-800 font-medium">
                    ⏰ Tempo limite atingido
                  </p>
                  <p className="text-orange-700 text-sm mt-1">
                    Continue aguardando ou entre em contato conosco
                  </p>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium mb-2">
                  ✅ Verificação automática ativa
                </p>
                <p className="text-green-700 text-sm">
                  Esta página será atualizada automaticamente quando o pagamento for confirmado
                </p>
              </div>
            </div>
          </div>

          {/* Resumo da Compra */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Resumo da Compra</h3>
            
            <div className="grid grid-cols-10 gap-2 mb-4">
              {selectedNumbers.map(num => (
                <div
                  key={num}
                  className="bg-blue-100 text-blue-800 p-2 rounded text-center text-sm font-bold"
                >
                  {num.toString().padStart(3, '0')}
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{selectedNumbers.length} números × R$ 100,00</span>
                <span className="text-gray-900">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg text-blue-600">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Informações do Pagamento */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informações do Pagamento</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID da Transação:</span>
                <span className="text-gray-900 font-mono">{transactionId.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID do Pagamento:</span>
                <span className="text-gray-900 font-mono">{paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Método:</span>
                <span className="text-gray-900">{paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}</span>
              </div>
            </div>
          </div>

          {/* Instruções PIX */}
          {paymentMethod === 'pix' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                <QrCode className="w-5 h-5 mr-2" />
                Como pagar com PIX
              </h3>
              <div className="space-y-2 text-sm text-green-700">
                <p>• Abra o app do seu banco</p>
                <p>• Vá em PIX → Ler QR Code</p>
                <p>• Escaneie o código na tela do MercadoPago</p>
                <p>• Confirme o pagamento</p>
                <p>• Aguarde a confirmação (instantânea)</p>
              </div>
            </div>
          )}

          {/* Botão de Voltar */}
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
