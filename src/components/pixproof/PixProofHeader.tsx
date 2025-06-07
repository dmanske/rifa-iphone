
import React from 'react';
import { X } from 'lucide-react';

interface PixProofHeaderProps {
  onClose: () => void;
}

const PixProofHeader: React.FC<PixProofHeaderProps> = ({ onClose }) => {
  return (
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
  );
};

export default PixProofHeader;
