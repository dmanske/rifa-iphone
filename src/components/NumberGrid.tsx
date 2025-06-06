
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useNumbers } from '../context/NumbersContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface NumberGridProps {
  onNumbersSelected: (numbers: number[]) => void;
}

const NumberGrid: React.FC<NumberGridProps> = ({ onNumbersSelected }) => {
  const { numbers, loading, reservedNumbers, reserveNumbers, releaseReservations, timeRemaining } = useNumbers();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  useEffect(() => {
    onNumbersSelected(selectedNumbers);
  }, [selectedNumbers, onNumbersSelected]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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

    if (numberData?.status === 'reservado' && numberData.reserved_by !== user.id) {
      toast({
        title: "Número reservado",
        description: "Este número está reservado por outro usuário",
        variant: "destructive"
      });
      return;
    }

    if (selectedNumbers.includes(numero)) {
      setSelectedNumbers(prev => prev.filter(n => n !== numero));
    } else {
      if (selectedNumbers.length >= 10) {
        toast({
          title: "Limite atingido",
          description: "Você pode selecionar no máximo 10 números por vez",
          variant: "destructive"
        });
        return;
      }
      setSelectedNumbers(prev => [...prev, numero]);
    }
  };

  const handleReserveNumbers = async () => {
    if (selectedNumbers.length === 0) {
      toast({
        title: "Nenhum número selecionado",
        description: "Selecione números antes de reservar",
        variant: "destructive"
      });
      return;
    }

    const success = await reserveNumbers(selectedNumbers);
    if (success) {
      setSelectedNumbers([]);
    }
  };

  const handleReleaseReservations = async () => {
    try {
      await releaseReservations();
      setSelectedNumbers([]);
      toast({
        title: "Reservas liberadas",
        description: "Suas reservas foram liberadas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao liberar reservas:', error);
      toast({
        title: "Erro",
        description: "Erro ao liberar reservas. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const getNumberStatus = (numero: number) => {
    const numberData = numbers.find(n => n.numero === numero);
    
    if (selectedNumbers.includes(numero)) {
      return 'selected';
    }
    
    if (numberData?.status === 'vendido') {
      return 'sold';
    }
    
    if (numberData?.status === 'reservado') {
      if (user && numberData.reserved_by === user.id) {
        return 'reserved-own';
      }
      return 'reserved-other';
    }
    
    return 'available';
  };

  const getNumberClasses = (numero: number) => {
    const status = getNumberStatus(numero);
    const baseClasses = "w-16 h-16 rounded-lg font-bold text-sm transition-all cursor-pointer hover:scale-105";
    
    switch (status) {
      case 'selected':
        return `${baseClasses} bg-blue-600 text-white border-2 border-blue-800`;
      case 'sold':
        return `${baseClasses} bg-red-500 text-white cursor-not-allowed opacity-75`;
      case 'reserved-own':
        return `${baseClasses} bg-green-500 text-white border-2 border-green-700`;
      case 'reserved-other':
        return `${baseClasses} bg-yellow-500 text-white cursor-not-allowed opacity-75`;
      default:
        return `${baseClasses} bg-white text-gray-900 border-2 border-gray-300 hover:border-blue-500`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timer de reserva */}
      {user && timeRemaining > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">
                  Você tem números reservados
                </h3>
                <p className="text-sm text-yellow-700">
                  Tempo restante: {formatTime(timeRemaining)}
                </p>
              </div>
            </div>
            <button
              onClick={handleReleaseReservations}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Liberar Reservas
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {user && selectedNumbers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800">
                {selectedNumbers.length} números selecionados
              </h3>
              <p className="text-sm text-blue-700">
                Total: R$ {(selectedNumbers.length * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={handleReserveNumbers}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Reservar Números
            </button>
          </div>
        </div>
      )}

      {/* Numbers Grid */}
      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: 130 }, (_, i) => i + 1).map((numero) => (
          <button
            key={numero}
            onClick={() => handleNumberClick(numero)}
            className={getNumberClasses(numero)}
            disabled={!user || getNumberStatus(numero) === 'sold' || getNumberStatus(numero) === 'reserved-other'}
          >
            {numero.toString().padStart(3, '0')}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Legenda:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
            <span>Disponível</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span>Selecionado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Seus Reservados</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Vendido</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumberGrid;
