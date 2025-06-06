
import React from 'react';
import { Loader2, Clock } from 'lucide-react';

interface PaymentStatusProps {
  status: 'waiting' | 'confirmed' | 'processing' | 'timeout';
  paymentMethod: 'pix' | 'cartao';
  timeElapsed: number;
  formatTime: (seconds: number) => string;
  checkCount: number;
  getProcessingMessage: () => string;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  paymentMethod,
  timeElapsed,
  formatTime,
  checkCount,
  getProcessingMessage
}) => {
  return (
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
          {getProcessingMessage()}
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center space-x-2 text-blue-800">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Tempo decorrido: {formatTime(timeElapsed)}</span>
          </div>
        </div>

        {timeElapsed < 15 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-medium">
              ⏳ Processando transação...
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              Os primeiros segundos são necessários para processar o pagamento
            </p>
          </div>
        )}

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
            {checkCount > 0 && ` (verificação #${checkCount})`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
