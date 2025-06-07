
import React from 'react';

interface PurchasesStatsProps {
  totalPurchases: number;
  totalVendido: number;
  totalPix: number;
  totalCartao: number;
}

const PurchasesStats: React.FC<PurchasesStatsProps> = ({
  totalPurchases,
  totalVendido,
  totalPix,
  totalCartao
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="text-2xl font-bold text-blue-600">{totalPurchases}</div>
        <div className="text-sm text-gray-600">Total de Compras</div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="text-2xl font-bold text-green-600">
          R$ {totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-gray-600">Total Arrecadado</div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="text-2xl font-bold text-green-600">
          R$ {totalPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-gray-600">Total Pix</div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="text-2xl font-bold text-blue-600">
          R$ {totalCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-gray-600">Total Cartão</div>
      </div>
    </div>
  );
};

export default PurchasesStats;
