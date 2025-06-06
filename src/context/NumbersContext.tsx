
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RaffleNumber {
  id: string;
  numero: number;
  status: 'disponivel' | 'reservado' | 'vendido';
  reserved_by?: string;
  reserved_at?: string;
  sold_to?: string;
  sold_at?: string;
  reservation_expires_at?: string;
}

interface NumbersContextType {
  numbers: RaffleNumber[];
  loading: boolean;
  selectedNumbers: number[];
  setSelectedNumbers: (numbers: number[]) => void;
  clearSelectedNumbers: () => void;
  refreshNumbers: () => Promise<void>;
}

const NumbersContext = createContext<NumbersContextType | undefined>(undefined);

export const useNumbers = () => {
  const context = useContext(NumbersContext);
  if (!context) {
    throw new Error('useNumbers must be used within a NumbersProvider');
  }
  return context;
};

export const NumbersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const { user } = useAuth();

  const fetchNumbers = useCallback(async () => {
    try {
      console.log('📊 Buscando números...');
      const { data, error } = await supabase
        .from('raffle_numbers')
        .select('*')
        .order('numero');

      if (error) throw error;
      
      console.log('📊 Números carregados:', data?.length);
      setNumbers(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar números:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSelectedNumbers = () => {
    console.log('🧹 Limpando números selecionados');
    setSelectedNumbers([]);
  };

  const refreshNumbers = useCallback(async () => {
    console.log('🔄 Atualizando números...');
    await fetchNumbers();
  }, [fetchNumbers]);

  // Load inicial
  useEffect(() => {
    fetchNumbers();
  }, [fetchNumbers]);

  // Realtime subscription para atualizar números em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('raffle_numbers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'raffle_numbers'
        },
        (payload) => {
          console.log('🔄 Números atualizados em tempo real:', payload);
          fetchNumbers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: 'status=eq.pago'
        },
        (payload) => {
          console.log('💰 Transação confirmada - atualizando números:', payload);
          fetchNumbers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNumbers]);

  const value: NumbersContextType = {
    numbers,
    loading,
    selectedNumbers,
    setSelectedNumbers,
    clearSelectedNumbers,
    refreshNumbers
  };

  return (
    <NumbersContext.Provider value={value}>
      {children}
    </NumbersContext.Provider>
  );
};
