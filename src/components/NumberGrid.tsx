
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
  const { numbers, loading, selectedNumbers, setSelectedNumbers, clearSelectedNumbers, refreshNumbers } = useNumbers();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Garantir atualização dos números quando o usuário faz login
  useEffect(() => {
    if (user) {
      console.log('👤 Usuário logado - forçando refresh dos números');
      refreshNumbers();
    }
  }, [user, refreshNumbers]);

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

    // VALIDAÇÃO DUPLA - Verificar se o número está vendido
    const numberData = numbers.find(n => n.numero === numero);
    
    if (numberData?.status === 'vendido') {
      console.log('❌ Tentativa de selecionar número vendido:', numero);
      toast({
        title: "Número já vendido",
        description: `O número ${numero.toString().padStart(3, '0')} já foi vendido e não está mais disponível`,
        variant: "destructive"
      });
      return;
    }

    // Verificar se está em uma lista de números vendidos (extra segurança)
    const soldNumbers = numbers.filter(n => n.status === 'vendido').map(n => n.numero);
    if (soldNumbers.includes(numero)) {
      console.log('❌ Número está na lista de vendidos:', numero);
      toast({
        title: "Número indisponível",
        description: `O número ${numero.toString().padStart(3, '0')} não está disponível para seleção`,
        variant: "destructive"
      });
      return;
    }

    if (selectedNumbers.includes(numero)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== numero));
      console.log('➖ Número removido da seleção:', numero);
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
      console.log('➕ Número adicionado à seleção:', numero);
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

    // Filtrar apenas números realmente disponíveis
    const availableNumbers = [];
    for (let i = 1; i <= 130; i++) {
      const numberData = numbers.find(n => n.numero === i);
      // Verificação tripla para garantir que o número está disponível
      if (numberData?.status !== 'vendido' && 
          !selectedNumbers.includes(i) && 
          numberData?.status === 'disponivel') {
        availableNumbers.push(i);
      }
    }

    const remainingSlots = 10 - selectedNumbers.length;
    const numbersToAdd = Math.min(count, availableNumbers.length, remainingSlots);

    if (numbersToAdd === 0) {
      toast({
        title: "Nenhum número disponível",
        description: "Não há números disponíveis para seleção aleatória",
        variant: "destructive"
      });
      return;
    }

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
    
    // Verificação mais rigorosa do status vendido
    if (numberData?.status === 'vendido') {
      return 'sold';
    }
    
    return 'available';
  };

  // Calculate stats - garantir que números vendidos sejam contados corretamente
  const soldCount = numbers.filter(n => n.status === 'vendido').length;
  const availableCount = 130 - soldCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-semibold">Carregando números...</p>
          <p className="text-gray-500 text-sm mt-2">Verificando disponibilidade</p>
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
