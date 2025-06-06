
import React from 'react';

interface PurchaseSummaryProps {
  selectedNumbers: number[];
  totalAmount: number;
}

const PurchaseSummary: React.FC<PurchaseSummaryProps> = ({ selectedNumbers, totalAmount }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Resumo da Compra</h3>
      
      <div className="grid grid-cols-10 gap-2 mb-4">
        {selectedNumbers.map(num => (
          <div
            key={num}
            className="bg-blue-100 text-blue-800 p-2 rounded text-center text-sm font-bold"
          >
            {num.toString().padStart(3, '0')}
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">{selectedNumbers.length} números × R$ 100,00</span>
          <span className="text-gray-900">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-lg text-blue-600">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSummary;
