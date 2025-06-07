
import React from 'react';
import { Download, FileText } from 'lucide-react';
import { handleDownloadProof, handleDownloadMercadoPagoProof } from '@/utils/pixProofUtils';

interface PixProofActionsProps {
  comprovanteUrl: string | null;
  mercadopagoPaymentId: string | null;
  onClose: () => void;
}

const PixProofActions: React.FC<PixProofActionsProps> = ({ 
  comprovanteUrl, 
  mercadopagoPaymentId, 
  onClose 
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
      {comprovanteUrl && (
        <button
          onClick={() => handleDownloadProof(comprovanteUrl)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-1"
        >
          <Download className="w-4 h-4" />
          <span>Comprovante PIX</span>
        </button>
      )}

      {mercadopagoPaymentId && (
        <button
          onClick={() => handleDownloadMercadoPagoProof(mercadopagoPaymentId)}
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex-1"
        >
          <FileText className="w-4 h-4" />
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
  );
};

export default PixProofActions;
