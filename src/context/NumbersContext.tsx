
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
  setSelectedNumbers: React.Dispatch<React.SetStateAction<number[]>>;
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
      console.log('📊 Buscando números da rifa (sistema simplificado)...');
      const { data, error } = await supabase
        .from('raffle_numbers')
        .select('*')
        .order('numero');

      if (error) throw error;
      
      console.log('📊 Números carregados:', data?.length);
      console.log('🔒 Números vendidos:', data?.filter(n => n.status === 'vendido').length);
      console.log('⏳ Números reservados:', data?.filter(n => n.status === 'reservado').length);
      
      setNumbers(data || []);
      
      // Log detalhado dos números não-disponíveis para debug
      const unavailableNumbers = data?.filter(n => n.status !== 'disponivel') || [];
      if (unavailableNumbers.length > 0) {
        console.log('🚫 Números indisponíveis:', unavailableNumbers.map(n => `${n.numero} (${n.status})`));
      }
      
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
    console.log('🔄 Forçando atualização dos números...');
    setLoading(true);
    await fetchNumbers();
  }, [fetchNumbers]);

  // Load inicial - SEMPRE carrega, independente do login
  useEffect(() => {
    console.log('🚀 Carregamento inicial dos números (sistema simplificado)...');
    fetchNumbers();
  }, []); // Sem dependências - carrega sempre na primeira renderização

  // Realtime subscription para atualizar números em tempo real
  useEffect(() => {
    console.log('👂 Configurando realtime subscription (sistema simplificado)...');
    
    const channel = supabase
      .channel('raffle_numbers_realtime_simple')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'raffle_numbers'
        },
        (payload) => {
          console.log('🔄 Números atualizados em tempo real:', payload.eventType, payload.new || payload.old);
          fetchNumbers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('💰 Transação atualizada - atualizando números:', payload.eventType);
          fetchNumbers();
        }
      )
      .subscribe((status) => {
        console.log('👂 Status da subscription:', status);
      });

    return () => {
      console.log('🔌 Desconectando realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [fetchNumbers]);

  // Atualizar quando o usuário faz login/logout
  useEffect(() => {
    if (user) {
      console.log('👤 Usuário logado - verificando números (sistema simplificado)...');
      // Delay pequeno para garantir que o contexto de auth está estável
      setTimeout(() => {
        fetchNumbers();
      }, 100);
    }
  }, [user, fetchNumbers]);

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
