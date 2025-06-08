
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import NumberGridStats from './NumberGridStats';
import NumberGridControls from './NumberGridControls';
import NumberGridButton from './NumberGridButton';
import NumberGridLegend from './NumberGridLegend';

interface NumberGridMobileProps {
  numbers: any[];
  selectedNumbers: number[];
  onNumberClick: (numero: number) => void;
  onSelectRandom: (count: number) => void;
  onClearSelection: () => void;
  getNumberStatus: (numero: number) => string;
  availableCount: number;
  soldCount: number;
}

const NumberGridMobile: React.FC<NumberGridMobileProps> = ({
  numbers,
  selectedNumbers,
  onNumberClick,
  onSelectRandom,
  onClearSelection,
  getNumberStatus,
  availableCount,
  soldCount
}) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500">
      <div className="bg-white">
        {/* Mobile Header */}
        <div className="text-center py-6 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            🎉 Rifa da Sorte
          </h1>
          <p className="text-blue-100 text-sm">
            Escolha seus números da sorte
          </p>
        </div>

        {/* Mobile Stats */}
        <NumberGridStats 
          availableCount={availableCount} 
          soldCount={soldCount} 
          isMobile={true} 
        />

        {/* Mobile Quick Select */}
        <NumberGridControls 
          onSelectRandom={onSelectRandom}
          onClearSelection={onClearSelection}
          isMobile={true}
        />

        {/* Mobile Numbers Grid */}
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
            {Array.from({ length: 130 }, (_, i) => i + 1).map((numero) => (
              <NumberGridButton
                key={numero}
                numero={numero}
                status={getNumberStatus(numero) as 'available' | 'selected' | 'sold'}
                onClick={() => onNumberClick(numero)}
                isMobile={true}
                disabled={!user || getNumberStatus(numero) === 'sold'}
              />
            ))}
          </div>
        </div>

        {/* Mobile Selection Info */}
        <div className="bg-white p-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-sm text-blue-700 mb-1">
              Números selecionados: <span className="font-bold">{selectedNumbers.length}</span>
            </div>
            <div className="text-lg font-bold text-blue-800">
              Total: R$ {(selectedNumbers.length * 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </div>
        </div>

        {/* Mobile Legend */}
        <div className="bg-white px-4 pb-6">
          <NumberGridLegend isMobile={true} />
        </div>

        {/* Login prompt for mobile */}
        {!user && (
          <div className="bg-white px-4 pb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-amber-800 font-medium text-sm">
                Faça login para selecionar seus números da sorte
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NumberGridMobile;
