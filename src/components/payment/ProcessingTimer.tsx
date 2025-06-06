
import React from 'react';
import { Loader2, Clock, CheckCircle } from 'lucide-react';

interface ProcessingTimerProps {
  processingTimer: number;
  status: 'processing' | 'confirmed';
}

const ProcessingTimer: React.FC<ProcessingTimerProps> = ({ processingTimer, status }) => {
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Aprovado!
          </h2>
          <p className="text-gray-600 mb-4">
            Finalizando processamento e preparando seus números...
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Finalizando em: {processingTimer}s</span>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              ✅ Processando dados dos números da sorte
            </p>
            <p className="text-green-700 text-sm mt-1">
              Garantindo que tudo esteja correto antes de mostrar seus números
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Processamento Concluído!
          </h2>
          <p className="text-gray-600 mb-4">
            Redirecionando para seus números da sorte...
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
        </div>
      </div>
    );
  }

  return null;
};

export default ProcessingTimer;
