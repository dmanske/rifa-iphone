
import React from 'react';
import { Calendar, CreditCard, Hash, Building2 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/utils/pixProofUtils';

interface PixProofDetailsProps {
  transaction: {
    nome: string;
    email: string;
    telefone: string | null;
    valor_total: number;
    data_pagamento: string | null;
    data_aprovacao_pix: string | null;
    mercadopago_payment_id: string | null;
    dados_comprovante: any;
  };
}

const PixProofDetails: React.FC<PixProofDetailsProps> = ({ transaction }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">Valor Pago</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(transaction.valor_total)}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">Data do Pagamento</p>
            <p className="text-sm text-gray-600">
              {formatDateTime(transaction.data_aprovacao_pix || transaction.data_pagamento)}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">ID Transação</p>
            <p className="text-sm text-gray-600 font-mono">
              {transaction.dados_comprovante?.transaction_id || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">Pagador</p>
            <p className="text-sm text-gray-600">{transaction.nome}</p>
            <p className="text-sm text-gray-600">{transaction.email}</p>
            {transaction.telefone && (
              <p className="text-sm text-gray-600">{transaction.telefone}</p>
            )}
          </div>
        </div>

        {transaction.mercadopago_payment_id && (
          <div className="flex items-start space-x-3">
            <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">ID MercadoPago</p>
              <p className="text-sm text-gray-600 font-mono">
                {transaction.mercadopago_payment_id}
              </p>
            </div>
          </div>
        )}

        {transaction.dados_comprovante?.bank_info && (
          <div className="flex items-start space-x-3">
            <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Banco</p>
              <p className="text-sm text-gray-600">
                {transaction.dados_comprovante.bank_info.payer?.long_name || 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PixProofDetails;
