
import React, { useState, useEffect } from 'react';
import { Clock, Lock, ShoppingCart, AlertCircle } from 'lucide-react';
import { useNumbers } from '@/context/NumbersContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface NumberGridProps {
  onNumbersSelected: (numbers: number[]) => void;
}

const NumberGrid: React.FC<NumberGridProps> = ({ onNumbersSelected }) => {
  const { numbers, loading, reservedNumbers, reserveNumbers, releaseReservations, timeRemaining } = useNumbers();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  // Sincronizar números reservados com selecionados
  useEffect(() => {
    if (reservedNumbers.length > 0) {
      setSelectedNumbers(reservedNumbers);
      onNumbersSelected(reservedNumbers);
    }
  }, [reservedNumbers, onNumbersSelected]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleNumberClick = async (numero: number) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para selecionar números",
        variant: "destructive"
      });
      return;
    }

    const numberData = numbers.find(n => n.numero === numero);
    if (!numberData) return;

    // Se o número não está disponível, não permitir seleção
    if (numberData.status === 'vendido') {
      toast({
        title: "Número vendido",
        description: "Este número já foi vendido",
        variant: "destructive"
      });
      return;
    }

    if (numberData.status === 'reservado' && numberData.reserved_by !== user.id) {
      toast({
        title: "Número reservado",
        description: "Este número está reservado por outro usuário",
        variant: "destructive"
      });
      return;
    }

    // Se já há números reservados, não permitir alterar
    if (reservedNumbers.length > 0) {
      toast({
        title: "Números já reservados",
        description: "Você já tem números reservados. Finalize a compra ou libere as reservas primeiro.",
        variant: "destructive"
      });
      return;
    }

    // Adicionar/remover da seleção
    const newSelection = selectedNumbers.includes(numero)
      ? selectedNumbers.filter(n => n !== numero)
      : [...selectedNumbers, numero];

    setSelectedNumbers(newSelection);
  };

  const handleReserveSelected = async () => {
    if (selectedNumbers.length === 0) {
      toast({
        title: "Nenhum número selecionado",
        description: "Selecione pelo menos um número",
        variant: "destructive"
      });
      return;
    }

    const success = await reserveNumbers(selectedNumbers);
    if (success) {
      onNumbersSelected(selectedNumbers);
    }
  };

  const handleReleaseReservations = async () => {
    await releaseReservations();
    setSelectedNumbers([]);
    onNumbersSelected([]);
  };

  const getNumberStatus = (numero: number) => {
    const numberData = numbers.find(n => n.numero === numero);
    if (!numberData) return 'loading';
    
    if (numberData.status === 'vendido') return 'sold';
    if (numberData.status === 'reservado') {
      if (numberData.reserved_by === user?.id) return 'reserved-own';
      return 'reserved-other';
    }
    if (selectedNumbers.includes(numero)) return 'selected';
    return 'available';
  };

  const getNumberStyle = (status: string) => {
    switch (status) {
      case 'sold':
        return 'bg-red-500 text-white cursor-not-allowed';
      case 'reserved-other':
        return 'bg-orange-400 text-white cursor-not-allowed';
      case 'reserved-own':
        return 'bg-green-500 text-white cursor-pointer ring-2 ring-green-600';
      case 'selected':
        return 'bg-blue-500 text-white cursor-pointer ring-2 ring-blue-600';
      case 'available':
        return 'bg-white border-2 border-gray-300 text-gray-900 hover:border-blue-500 cursor-pointer';
      default:
        return 'bg-gray-200 text-gray-500 cursor-not-allowed animate-pulse';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timer e controles */}
      {reservedNumbers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">
                  Números Reservados ({reservedNumbers.length})
                </h3>
                <p className="text-sm text-yellow-700">
                  Tempo restante: {formatTime(timeRemaining)}
                </p>
              </div>
            </div>
            <button
              onClick={handleReleaseReservations}
              className="text-sm text-yellow-700 hover:text-yellow-800 underline"
            >
              Liberar reservas
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {reservedNumbers.map(num => (
              <span
                key={num}
                className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium"
              >
                {num.toString().padStart(3, '0')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Controles de seleção */}
      {reservedNumbers.length === 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">
                Selecionados: {selectedNumbers.length}
              </h3>
              <p className="text-sm text-blue-700">
                Total: R$ {(selectedNumbers.length * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          {selectedNumbers.length > 0 && (
            <button
              onClick={handleReserveSelected}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Reservar ({selectedNumbers.length})
            </button>
          )}
        </div>
      )}

      {/* Legenda */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
          <span>Disponível</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Selecionado</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Reservado (seu)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-400 rounded"></div>
          <span>Reservado (outro)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Vendido</span>
        </div>
      </div>

      {/* Grid de números */}
      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: 130 }, (_, i) => i + 1).map((numero) => {
          const status = getNumberStatus(numero);
          const style = getNumberStyle(status);
          
          return (
            <button
              key={numero}
              onClick={() => handleNumberClick(numero)}
              disabled={status === 'sold' || status === 'reserved-other' || loading}
              className={`
                aspect-square flex items-center justify-center text-sm font-bold rounded-lg
                transition-all duration-200 hover:scale-105 disabled:hover:scale-100
                ${style}
              `}
            >
              {status === 'sold' && <Lock className="w-3 h-3" />}
              {status !== 'sold' && numero.toString().padStart(3, '0')}
            </button>
          );
        })}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="font-bold text-green-700">
            {numbers.filter(n => n.status === 'disponivel').length}
          </div>
          <div className="text-green-600">Disponíveis</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="font-bold text-orange-700">
            {numbers.filter(n => n.status === 'reservado').length}
          </div>
          <div className="text-orange-600">Reservados</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="font-bold text-red-700">
            {numbers.filter(n => n.status === 'vendido').length}
          </div>
          <div className="text-red-600">Vendidos</div>
        </div>
      </div>
    </div>
  );
};

export default NumberGrid;
