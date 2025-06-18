
import React from 'react';
import { CheckCircle, Home } from 'lucide-react';

interface SimpleSuccessProps {
  onGoHome: () => void;
}

const SimpleSuccess: React.FC<SimpleSuccessProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Números Reservados!
          </h1>
          <p className="text-gray-600">
            Seus números foram reservados com sucesso.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Próximos passos:</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>✅ Números reservados</p>
            <p>💰 Faça o PIX conforme instruído</p>
            <p>⏳ Aguarde confirmação do organizador</p>
            <p>🎉 Boa sorte no sorteio!</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Importante:</strong> Seus números ficam reservados por 1 hora. 
            Faça o PIX dentro deste prazo.
          </p>
        </div>

        <button
          onClick={onGoHome}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Voltar ao Início</span>
        </button>

      </div>
    </div>
  );
};

export default SimpleSuccess;
