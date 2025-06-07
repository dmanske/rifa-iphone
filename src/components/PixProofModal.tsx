
import React from 'react';
import PixProofHeader from './pixproof/PixProofHeader';
import PixProofQRCode from './pixproof/PixProofQRCode';
import PixProofDetails from './pixproof/PixProofDetails';
import PixProofActions from './pixproof/PixProofActions';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <PixProofHeader onClose={onClose} />

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="text-center">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✅ Pagamento Aprovado
            </span>
          </div>

          <PixProofQRCode 
            qrCodeBase64={transaction.qr_code_base64}
            qrCodePix={transaction.qr_code_pix}
          />

          <PixProofDetails transaction={transaction} />

          <PixProofActions 
            comprovanteUrl={transaction.comprovante_url}
            mercadopagoPaymentId={transaction.mercadopago_payment_id}
            onClose={onClose}
          />

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
