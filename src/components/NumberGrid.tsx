
import React, { useState, useEffect } from 'react';
import { useNumbers } from '../context/NumbersContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '../hooks/use-mobile';
import NumberGridMobile from './NumberGridMobile';
import NumberGridDesktop from './NumberGridDesktop';

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

  const commonProps = {
    numbers,
    selectedNumbers,
    onNumberClick: handleNumberClick,
    onSelectRandom: selectRandomNumbers,
    onClearSelection: handleClearSelection,
    getNumberStatus,
    availableCount,
    soldCount
  };

  if (isMobile) {
    return <NumberGridMobile {...commonProps} />;
  }

  return <NumberGridDesktop {...commonProps} />;
};

export default NumberGrid;
