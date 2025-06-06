
import React from 'react';

interface PaymentInfoProps {
  transactionId: string;
  paymentId: string;
  paymentMethod: 'pix' | 'cartao';
}

const PaymentInfo: React.FC<PaymentInfoProps> = ({ transactionId, paymentId, paymentMethod }) => {
  return (
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
  );
};

export default PaymentInfo;
