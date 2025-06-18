
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import NumberGrid from './NumberGrid';
import SimpleCheckout from './SimpleCheckout';
import SimpleSuccess from './SimpleSuccess';

interface RaffleMainProps {
  onShowAuth: () => void;
}

type ViewType = 'grid' | 'checkout' | 'success';

const RaffleMain: React.FC<RaffleMainProps> = ({ onShowAuth }) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('grid');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const handleNumbersSelected = (numbers: number[]) => {
    setSelectedNumbers(numbers);
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      onShowAuth();
      return;
    }

    if (selectedNumbers.length === 0) {
      return;
    }

    setCurrentView('checkout');
  };

  const handleBackToGrid = () => {
    setCurrentView('grid');
  };

  const handleCheckoutSuccess = () => {
    setSelectedNumbers([]);
    setCurrentView('success');
  };

  const handleGoHome = () => {
    setCurrentView('grid');
  };

  if (currentView === 'checkout') {
    return (
      <SimpleCheckout
        selectedNumbers={selectedNumbers}
        onBack={handleBackToGrid}
        onSuccess={handleCheckoutSuccess}
      />
    );
  }

  if (currentView === 'success') {
    return (
      <SimpleSuccess
        onGoHome={handleGoHome}
      />
    );
  }

  return (
    <div className="relative">
      <NumberGrid onNumbersSelected={handleNumbersSelected} />
      
      {/* Floating Checkout Button */}
      {selectedNumbers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={handleProceedToCheckout}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-full shadow-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
          >
            Reservar {selectedNumbers.length} número{selectedNumbers.length > 1 ? 's' : ''} - R$ {(selectedNumbers.length * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </button>
        </div>
      )}
    </div>
  );
};

export default RaffleMain;
