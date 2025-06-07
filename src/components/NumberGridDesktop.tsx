
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import NumberGridStats from './NumberGridStats';
import NumberGridControls from './NumberGridControls';
import NumberGridButton from './NumberGridButton';
import NumberGridLegend from './NumberGridLegend';

interface NumberGridDesktopProps {
  numbers: any[];
  selectedNumbers: number[];
  onNumberClick: (numero: number) => void;
  onSelectRandom: (count: number) => void;
  onClearSelection: () => void;
  getNumberStatus: (numero: number) => string;
  availableCount: number;
  soldCount: number;
}

const NumberGridDesktop: React.FC<NumberGridDesktopProps> = ({
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6">
        {/* Modern Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            🎉 Rifa da Sorte
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Escolha seus números da sorte
          </p>
        </div>

        {/* Stats Section */}
        <NumberGridStats 
          availableCount={availableCount} 
          soldCount={soldCount} 
          isMobile={false} 
        />

        {/* Quick Select Buttons */}
        <NumberGridControls 
          onSelectRandom={onSelectRandom}
          onClearSelection={onClearSelection}
          isMobile={false}
        />

        {/* Numbers Grid - 5 columns on mobile, 10 on desktop */}
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-6">
          {Array.from({ length: 130 }, (_, i) => i + 1).map((numero) => (
            <NumberGridButton
              key={numero}
              numero={numero}
              status={getNumberStatus(numero) as 'available' | 'selected' | 'sold'}
              onClick={() => onNumberClick(numero)}
              isMobile={false}
              disabled={!user || getNumberStatus(numero) === 'sold'}
            />
          ))}
        </div>

        {/* Selection Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
          <div className="text-base md:text-lg text-blue-700 mb-2">
            Números selecionados: <span className="font-bold">{selectedNumbers.length}</span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-blue-800">
            Total: R$ {(selectedNumbers.length * 100).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={onClearSelection}
            disabled={!user || selectedNumbers.length === 0}
            className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
          >
            Limpar Seleção
          </button>
          <button
            disabled={!user || selectedNumbers.length === 0}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
          >
            Comprar Números
          </button>
        </div>

        {/* Modern Legend */}
        <NumberGridLegend isMobile={false} />

        {/* Login prompt for non-authenticated users */}
        {!user && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-amber-800 font-medium">
              Faça login para selecionar seus números da sorte
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NumberGridDesktop;
