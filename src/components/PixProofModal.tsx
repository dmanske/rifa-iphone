
import React from 'react';
import { X, Download, Calendar, CreditCard, Hash, Building2 } from 'lucide-react';

interface PixProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
    valor_total: number;
    data_pagamento: string | null;
    data_aprovacao_pix: string | null;
    comprovante_url: string | null;
    qr_code_pix: string | null;
    qr_code_base64: string | null;
    mercadopago_payment_id: string | null;
    dados_comprovante: any;
  };
}

const PixProofModal: React.FC<PixProofModalProps> = ({ isOpen, onClose, transaction }) => {
  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleDownloadProof = () => {
    if (transaction.comprovante_url) {
      window.open(transaction.comprovante_url, '_blank');
    }
  };

  const copyPixCode = () => {
    if (transaction.qr_code_pix) {
      navigator.clipboard.writeText(transaction.qr_code_pix);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Comprovante PIX</h2>
            <p className="text-sm text-gray-600">Detalhes do pagamento realizado</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="text-center">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✅ Pagamento Aprovado
            </span>
          </div>

          {/* QR Code */}
          {transaction.qr_code_base64 && (
            <div className="text-center space-y-3">
              <h3 className="font-semibold text-gray-900">QR Code PIX</h3>
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${transaction.qr_code_base64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 border border-gray-200 rounded-lg"
                />
              </div>
              {transaction.qr_code_pix && (
                <button
                  onClick={copyPixCode}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Copiar código PIX
                </button>
              )}
            </div>
          )}

          {/* Transaction Details */}
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

              {/* Bank Info */}
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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {transaction.comprovante_url && (
              <button
                onClick={handleDownloadProof}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-1"
              >
                <Download className="w-4 h-4" />
                <span>Comprovante Oficial</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <span>Fechar</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            <p>Este comprovante é gerado automaticamente pelo MercadoPago</p>
            <p>Para questões sobre o pagamento, utilize o ID da transação</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixProofModal;
