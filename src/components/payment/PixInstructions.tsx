
import React from 'react';
import { QrCode } from 'lucide-react';

const PixInstructions: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
      <h3 className="font-semibold text-green-800 mb-3 flex items-center">
        <QrCode className="w-5 h-5 mr-2" />
        Como pagar com PIX
      </h3>
      <div className="space-y-2 text-sm text-green-700">
        <p>• Abra o app do seu banco</p>
        <p>• Vá em PIX → Ler QR Code</p>
        <p>• Escaneie o código na tela do MercadoPago</p>
        <p>• Confirme o pagamento</p>
        <p>• Aguarde a confirmação (pode levar alguns segundos)</p>
      </div>
    </div>
  );
};

export default PixInstructions;
