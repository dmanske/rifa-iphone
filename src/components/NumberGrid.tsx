import React, { useState, useEffect } from 'react';
import { useNumbers } from '../context/NumbersContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Shuffle } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

interface NumberGridProps {
  onNumbersSelected: (numbers: number[]) => void;
}

const NumberGrid: React.FC<NumberGridProps> = ({ onNumbersSelected }) => {
  const { numbers, loading, selectedNumbers, setSelectedNumbers, clearSelectedNumbers } = useNumbers();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    onNumbersSelected(selectedNumbers);
  }, [selectedNumbers, onNumbersSelected]);

  const handleNumberClick = async (numero: number) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para selecionar números",
        variant: "destructive"
      });
      return;
    }

    const numberData = numbers.find(n => n.numero === numero);
    
    if (numberData?.status === 'vendido') {
      toast({
        title: "Número já vendido",
        description: "Este número já foi vendido e não está mais disponível",
        variant: "destructive"
      });
      return;
    }

    if (selectedNumbers.includes(numero)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== numero));
    } else {
      if (selectedNumbers.length >= 10) {
        toast({
          title: "Limite atingido",
          description: "Você pode selecionar no máximo 10 números por vez",
          variant: "destructive"
        });
        return;
      }
      setSelectedNumbers([...selectedNumbers, numero]);
    }
  };

  const selectRandomNumbers = (count: number) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para selecionar números",
        variant: "destructive"
      });
      return;
    }

    const availableNumbers = [];
    for (let i = 1; i <= 130; i++) {
      const numberData = numbers.find(n => n.numero === i);
      if (numberData?.status !== 'vendido' && !selectedNumbers.includes(i)) {
        availableNumbers.push(i);
      }
    }

    const remainingSlots = 10 - selectedNumbers.length;
    const numbersToAdd = Math.min(count, availableNumbers.length, remainingSlots);

    const newNumbers = [...selectedNumbers];
    for (let i = 0; i < numbersToAdd; i++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      const number = availableNumbers.splice(randomIndex, 1)[0];
      newNumbers.push(number);
    }

    setSelectedNumbers(newNumbers);
    toast({
      title: "Números selecionados",
      description: `${numbersToAdd} números foram selecionados aleatoriamente`,
    });
  };

  const handleClearSelection = () => {
    clearSelectedNumbers();
    toast({
      title: "Seleção limpa",
      description: "Números selecionados foram removidos",
    });
  };

  const getNumberStatus = (numero: number) => {
    const numberData = numbers.find(n => n.numero === numero);
    
    if (selectedNumbers.includes(numero)) {
      return 'selected';
    }
    
    if (numberData?.status === 'vendido') {
      return 'sold';
    }
    
    return 'available';
  };

  const getNumberClasses = (numero: number) => {
    const status = getNumberStatus(numero);
    
    if (isMobile) {
      const baseClasses = "aspect-square rounded-xl font-bold text-base transition-all duration-300 border-2 flex items-center justify-center relative overflow-hidden min-h-[60px] touch-manipulation";
      
      switch (status) {
        case 'selected':
          return `${baseClasses} bg-gradient-to-br from-purple-600 to-blue-600 text-white border-purple-600 shadow-lg scale-105 cursor-pointer`;
        case 'sold':
          return `${baseClasses} bg-red-500 text-white border-red-600 cursor-not-allowed opacity-80`;
        default:
          return `${baseClasses} bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer shadow-md ${!user ? 'opacity-60' : ''}`;
      }
    } else {
      const baseClasses = "aspect-square rounded-xl font-bold text-sm transition-all duration-300 border-2 flex items-center justify-center relative overflow-hidden min-h-[50px] touch-manipulation";
      
      switch (status) {
        case 'selected':
          return `${baseClasses} bg-gradient-to-br from-purple-600 to-blue-600 text-white border-purple-600 shadow-lg scale-105 animate-pulse cursor-pointer`;
        case 'sold':
          return `${baseClasses} bg-red-500 text-white border-red-600 cursor-not-allowed opacity-80`;
        default:
          return `${baseClasses} bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:scale-105 active:scale-95 cursor-pointer shadow-md hover:shadow-lg ${!user ? 'opacity-60' : ''}`;
      }
    }
  };

  // Calculate stats
  const soldCount = numbers.filter(n => n.status === 'vendido').length;
  const availableCount = 130 - soldCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-semibold">Carregando números...</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
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
          <div className="grid grid-cols-3 gap-3 p-4 bg-white">
            <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
              <div className="text-lg font-bold text-blue-600">{availableCount}</div>
              <div className="text-xs text-blue-600 font-medium">Disponíveis</div>
            </div>
            <div className="text-center bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3">
              <div className="text-lg font-bold text-red-600">{soldCount}</div>
              <div className="text-xs text-red-600 font-medium">Vendidos</div>
            </div>
            <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
              <div className="text-lg font-bold text-green-600">R$ 100</div>
              <div className="text-xs text-green-600 font-medium">Por número</div>
            </div>
          </div>

          {/* Mobile Quick Select */}
          {user && (
            <div className="px-4 pb-4 bg-white">
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => selectRandomNumbers(1)}
                  className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-2 rounded-full text-xs font-medium"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>+1</span>
                </button>
                <button
                  onClick={() => selectRandomNumbers(5)}
                  className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-2 rounded-full text-xs font-medium"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>+5</span>
                </button>
                <button
                  onClick={() => selectRandomNumbers(10)}
                  className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-2 rounded-full text-xs font-medium"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>+10</span>
                </button>
                <button
                  onClick={handleClearSelection}
                  className="bg-gray-200 text-gray-700 px-3 py-2 rounded-full text-xs font-medium"
                >
                  Limpar
                </button>
              </div>
            </div>
          )}

          {/* Mobile Numbers Grid */}
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
              {Array.from({ length: 130 }, (_, i) => i + 1).map((numero) => (
                <button
                  key={numero}
                  onClick={() => handleNumberClick(numero)}
                  disabled={!user || getNumberStatus(numero) === 'sold'}
                  className={getNumberClasses(numero)}
                >
                  {numero.toString().padStart(3, '0')}
                  {getNumberStatus(numero) === 'sold' && (
                    <span className="absolute top-1 right-1 text-xs">✗</span>
                  )}
                </button>
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

          {/* Mobile Action Buttons */}
          <div className="bg-white px-4 pb-4">
            <div className="flex gap-2">
              <button
                onClick={handleClearSelection}
                disabled={!user || selectedNumbers.length === 0}
                className="flex-1 bg-gray-200 disabled:opacity-50 text-gray-700 py-3 rounded-xl font-semibold text-sm"
              >
                Limpar
              </button>
              <button
                disabled={!user || selectedNumbers.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm"
              >
                Comprar
              </button>
            </div>
          </div>

          {/* Mobile Legend */}
          <div className="bg-white px-4 pb-6">
            <div className="flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
                <span className="text-gray-600">Disponível</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded"></div>
                <span className="text-gray-600">Selecionado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-600">Vendido</span>
              </div>
            </div>
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
  }

  // Desktop layout (unchanged)
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="text-xl md:text-2xl font-bold text-blue-600">{availableCount}</div>
            <div className="text-xs md:text-sm text-blue-600 font-medium">Disponíveis</div>
          </div>
          <div className="text-center bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
            <div className="text-xl md:text-2xl font-bold text-red-600">{soldCount}</div>
            <div className="text-xs md:text-sm text-red-600 font-medium">Vendidos</div>
          </div>
          <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="text-xl md:text-2xl font-bold text-green-600">R$ 100</div>
            <div className="text-xs md:text-sm text-green-600 font-medium">Por número</div>
          </div>
        </div>

        {/* Quick Select Buttons */}
        {user && (
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            <button
              onClick={() => selectRandomNumbers(1)}
              className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <Shuffle className="w-3 h-3" />
              <span>+1 Aleatório</span>
            </button>
            <button
              onClick={() => selectRandomNumbers(5)}
              className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <Shuffle className="w-3 h-3" />
              <span>+5 Aleatórios</span>
            </button>
            <button
              onClick={() => selectRandomNumbers(10)}
              className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <Shuffle className="w-3 h-3" />
              <span>+10 Aleatórios</span>
            </button>
            <button
              onClick={handleClearSelection}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              Limpar
            </button>
          </div>
        )}

        {/* Numbers Grid - 5 columns on mobile, 10 on desktop */}
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-6">
          {Array.from({ length: 130 }, (_, i) => i + 1).map((numero) => (
            <button
              key={numero}
              onClick={() => handleNumberClick(numero)}
              disabled={!user || getNumberStatus(numero) === 'sold'}
              className={getNumberClasses(numero)}
              style={{ animationDelay: `${(numero % 50) * 20}ms` }}
            >
              {numero.toString().padStart(3, '0')}
              {getNumberStatus(numero) === 'sold' && (
                <span className="absolute top-1 right-1 text-xs">✗</span>
              )}
            </button>
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
            onClick={handleClearSelection}
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
        <div className="flex justify-center gap-4 md:gap-6 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded shadow-sm"></div>
            <span className="text-gray-600 font-medium">Disponível</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded shadow-sm"></div>
            <span className="text-gray-600 font-medium">Selecionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded shadow-sm"></div>
            <span className="text-gray-600 font-medium">Vendido</span>
          </div>
        </div>

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

export default NumberGrid;
