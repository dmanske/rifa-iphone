
import React from 'react';
import { copyPixCode } from '@/utils/pixProofUtils';

interface PixProofQRCodeProps {
  qrCodeBase64: string | null;
  qrCodePix: string | null;
}

const PixProofQRCode: React.FC<PixProofQRCodeProps> = ({ qrCodeBase64, qrCodePix }) => {
  if (!qrCodeBase64) return null;

  return (
    <div className="text-center space-y-3">
      <h3 className="font-semibold text-gray-900">QR Code PIX</h3>
      <div className="flex justify-center">
        <img
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code PIX"
          className="w-48 h-48 border border-gray-200 rounded-lg"
        />
      </div>
      {qrCodePix && (
        <button
          onClick={() => copyPixCode(qrCodePix)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Copiar código PIX
        </button>
      )}
    </div>
  );
};

export default PixProofQRCode;
