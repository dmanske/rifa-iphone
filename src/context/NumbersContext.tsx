
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  reservedNumbers: number[];
  reserveNumbers: (numeros: number[]) => Promise<boolean>;
  releaseReservations: () => Promise<void>;
  refreshNumbers: () => Promise<void>;
  timeRemaining: number;
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
  const [reservedNumbers, setReservedNumbers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNumbers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('raffle_numbers')
        .select('*')
        .order('numero');

      if (error) throw error;
      setNumbers(data || []);

      // Buscar números reservados pelo usuário atual
      if (user) {
        const userReserved = data?.filter(n => 
          n.status === 'reservado' && n.reserved_by === user.id
        ).map(n => n.numero) || [];
        setReservedNumbers(userReserved);

        // Calcular tempo restante da reserva
        const reservedNumber = data?.find(n => 
          n.status === 'reservado' && 
          n.reserved_by === user.id && 
          n.reservation_expires_at
        );

        if (reservedNumber?.reservation_expires_at) {
          const expiresAt = new Date(reservedNumber.reservation_expires_at).getTime();
          const now = new Date().getTime();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeRemaining(remaining);
        } else {
          setTimeRemaining(0);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar números:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const reserveNumbers = async (numeros: number[]): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para reservar números",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('reserve_numbers', {
        _user_id: user.id,
        _numeros: numeros,
        _minutes_to_expire: 10
      });

      if (error) throw error;

      const result = data[0];
      
      if (result.success) {
        toast({
          title: "Números reservados!",
          description: `${result.reserved_numbers.length} números foram reservados por 10 minutos`,
        });
        setReservedNumbers(result.reserved_numbers);
        setTimeRemaining(600); // 10 minutos
        await fetchNumbers();
        return true;
      } else {
        toast({
          title: "Alguns números não puderam ser reservados",
          description: result.message,
          variant: "destructive"
        });
        if (result.reserved_numbers.length > 0) {
          setReservedNumbers(result.reserved_numbers);
          setTimeRemaining(600);
          await fetchNumbers();
        }
        return false;
      }
    } catch (error) {
      console.error('Erro ao reservar números:', error);
      toast({
        title: "Erro",
        description: "Erro ao reservar números. Tente novamente.",
        variant: "destructive"
      });
      return false;
    }
  };

  const releaseReservations = async () => {
    if (!user || reservedNumbers.length === 0) return;

    try {
      // Liberar reservas (voltar status para disponível)
      const { error } = await supabase
        .from('raffle_numbers')
        .update({
          status: 'disponivel',
          reserved_by: null,
          reserved_at: null,
          reservation_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('reserved_by', user.id)
        .eq('status', 'reservado');

      if (error) throw error;

      setReservedNumbers([]);
      setTimeRemaining(0);
      await fetchNumbers();
      
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

  const refreshNumbers = useCallback(async () => {
    await fetchNumbers();
  }, [fetchNumbers]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Tempo expirado, atualizar números
            fetchNumbers();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeRemaining, fetchNumbers]);

  // Cleanup automático - reduzido para evitar muitas requisições
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        await supabase.rpc('cleanup_expired_reservations');
        await fetchNumbers();
      } catch (error) {
        console.error('Erro no cleanup:', error);
      }
    }, 60000); // A cada 60 segundos em vez de 30

    return () => clearInterval(cleanupInterval);
  }, [fetchNumbers]);

  // Load inicial
  useEffect(() => {
    fetchNumbers();
  }, [fetchNumbers]);

  const value: NumbersContextType = {
    numbers,
    loading,
    reservedNumbers,
    reserveNumbers,
    releaseReservations,
    refreshNumbers,
    timeRemaining
  };

  return (
    <NumbersContext.Provider value={value}>
      {children}
    </NumbersContext.Provider>
  );
};
