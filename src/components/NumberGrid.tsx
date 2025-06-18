
import React, { useState, useEffect, useCallback } from 'react';
import { useNumbers } from '../context/NumbersContext';
import { useAuth } from '../hooks/useAuth';
import NumberGridMobile from './NumberGridMobile';
import NumberGridDesktop from './NumberGridDesktop';
import { User, LogIn } from 'lucide-react';

interface NumberGridProps {
  onNumbersSelected: (numbers: number[]) => void;
}

const NumberGrid: React.FC<NumberGridProps> = ({ onNumbersSelected }) => {
  const { numbers, loading, selectedNumbers, setSelectedNumbers } = useNumbers();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handleNumberClick = useCallback((number: number) => {
    const isSelected = selectedNumbers.includes(number);

    if (isSelected) {
      setSelectedNumbers(selectedNumbers.filter((num) => num !== number));
    } else {
      setSelectedNumbers([...selectedNumbers, number]);
    }
  }, [selectedNumbers, setSelectedNumbers]);

  useEffect(() => {
    onNumbersSelected(selectedNumbers);
  }, [selectedNumbers, onNumbersSelected]);

  const getNumberStatus = (number: number) => {
    const numberData = numbers.find(n => n.numero === number);
    if (!numberData) return 'disponivel';
    return numberData.status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-teal-500 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Carregando números da rifa...
          </h2>
          <p className="text-gray-600">
            Aguarde um momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-teal-500">
      {/* Header com Login */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">🎲 Rifa Lucky Prize</h1>
            <p className="text-white/80 text-sm">Escolha seus números da sorte</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3 bg-white/20 rounded-full px-4 py-2">
                <User className="w-5 h-5 text-white" />
                <span className="text-white font-medium">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
            ) : (
              <button
                onClick={() => {
                  // Trigger auth modal - we'll need to pass this up to parent
                  const event = new CustomEvent('showAuth');
                  window.dispatchEvent(event);
                }}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105"
              >
                <LogIn className="w-5 h-5" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="pt-6">
        {isMobile ? (
          <NumberGridMobile
            numbers={numbers}
            selectedNumbers={selectedNumbers}
            onNumberClick={handleNumberClick}
            getNumberStatus={getNumberStatus}
          />
        ) : (
          <NumberGridDesktop
            numbers={numbers}
            selectedNumbers={selectedNumbers}
            onNumberClick={handleNumberClick}
            getNumberStatus={getNumberStatus}
          />
        )}
      </div>
    </div>
  );
};

export default NumberGrid;
