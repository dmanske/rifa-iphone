
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, X, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import Cart from './Cart';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '../hooks/use-mobile';

interface NumberSelectionProps {
  onBack: () => void;
  onAuthRequired: () => void;
}

const NumberSelection: React.FC<NumberSelectionProps> = ({ onBack, onAuthRequired }) => {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [showCart, setShowCart] = useState(false);
  const [soldNumbers, setSoldNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar números vendidos sempre que o componente montar ou quando o usuário mudar
  useEffect(() => {
    fetchSoldNumbers();
  }, [user]);

  const fetchSoldNumbers = async () => {
    try {
      console.log('🔄 Buscando números vendidos...');
      setLoading(true);
      
      // Buscar primeiro da tabela raffle_numbers (fonte principal)
      const { data: raffleData, error: raffleError } = await supabase
        .from('raffle_numbers')
        .select('numero')
        .eq('status', 'vendido');

      let allSoldNumbers: number[] = [];

      if (raffleError) {
        console.warn('⚠️ Erro ao buscar de raffle_numbers, usando fallback:', raffleError);
        
        // Fallback: buscar da tabela transactions
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select('numeros_comprados')
          .eq('status', 'pago');

        if (transactionError) {
          console.error('❌ Erro em ambas as consultas:', transactionError);
          return;
        }

        transactionData?.forEach(transaction => {
          if (transaction.numeros_comprados) {
            allSoldNumbers.push(...transaction.numeros_comprados);
          }
        });
      } else {
        // Usar dados da raffle_numbers (preferencial)
        allSoldNumbers = raffleData?.map(item => item.numero) || [];
      }

      console.log('📊 Números vendidos carregados:', allSoldNumbers.length);
      setSoldNumbers(allSoldNumbers);
    } catch (error) {
      console.error('💥 Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription para atualizar números quando houver mudanças
  useEffect(() => {
    const channel = supabase
      .channel('numbers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'raffle_numbers'
        },
        (payload) => {
          console.log('🔄 Número atualizado em tempo real:', payload);
          fetchSoldNumbers();
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
          console.log('🔄 Transação atualizada em tempo real:', payload);
          fetchSoldNumbers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isNumberSold = (number: number) => soldNumbers.includes(number);
  const isNumberInCart = (number: number) => cartItems.some(item => item.number === number);

  const handleNumberClick = (number: number) => {
    // Verificar se o usuário está logado antes de permitir seleção
    if (!user) {
      onAuthRequired();
      return;
    }

    if (isNumberSold(number)) return;
    
    if (isNumberInCart(number)) {
      removeFromCart(number);
    } else {
      // Limitar a 10 números por pessoa
      if (cartItems.length >= 10) {
        return;
      }
      addToCart(number);
    }
  };

  const handleCartClick = () => {
    // Verificar se o usuário está logado antes de abrir o carrinho
    if (!user) {
      onAuthRequired();
      return;
    }
    setShowCart(true);
  };

  // Layout responsivo para botões - Mobile otimizado
  const getNumberButtonClass = (number: number) => {
    const baseClasses = 'rounded-xl font-bold transition-all duration-200 border-2 flex items-center justify-center text-center';
    
    // Mobile: botões maiores e mais espaçados | Desktop: layout original
    const sizeClasses = isMobile 
      ? 'h-14 w-full text-lg min-h-[56px] touch-manipulation' // Mobile: botões maiores para toque
      : 'h-16 text-base'; // Desktop: mantém tamanho original
    
    if (isNumberSold(number)) {
      return `${baseClasses} ${sizeClasses} bg-red-100 text-red-500 cursor-not-allowed border-red-200 opacity-60`;
    }
    if (isNumberInCart(number)) {
      return `${baseClasses} ${sizeClasses} bg-blue-600 text-white border-blue-600 shadow-lg scale-105`;
    }
    return `${baseClasses} ${sizeClasses} bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 active:scale-95 cursor-pointer shadow-sm`;
  };

  // Organizar números em linhas - Layout responsivo
  const organizeNumbersForDisplay = () => {
    const numbers = Array.from({ length: 130 }, (_, i) => i + 1);
    
    if (isMobile) {
      // Mobile: organizar em grupos de 6 números (2x3 grid)
      const groups = [];
      for (let i = 0; i < numbers.length; i += 6) {
        groups.push(numbers.slice(i, i + 6));
      }
      return groups;
    } else {
      // Desktop: manter layout original (10 por linha)
      const rows = [];
      for (let i = 1; i <= 130; i += 10) {
        const row = [];
        for (let j = i; j < i + 10 && j <= 130; j++) {
          row.push(j);
        }
        rows.push(row);
      }
      return rows;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando números...</p>
        </div>
      </div>
    );
  }

  const numberGroups = organizeNumbersForDisplay();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Responsivo */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
                  Escolha seus números
                </h1>
                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  R$ 100,00 por número • Máx. 10 números
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!user && (
                <button
                  onClick={onAuthRequired}
                  className={`flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${
                    isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
              
              <button
                onClick={handleCartClick}
                className={`relative bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-sm'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Carrinho</span>
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Login */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 mx-4 mt-4 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LogIn className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-blue-800 font-medium text-sm">Login necessário</p>
                <p className="text-blue-700 text-xs">
                  Faça login para escolher seus números
                </p>
              </div>
            </div>
            <button
              onClick={onAuthRequired}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Entrar
            </button>
          </div>
        </div>
      )}

      {/* Numbers Grid - Layout Responsivo Otimizado */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Legend - Compacta no mobile */}
        <div className="mb-6">
          <div className={`flex gap-4 text-xs ${isMobile ? 'flex-wrap justify-center' : 'flex-row'}`}>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white border-2 border-gray-200 rounded"></div>
              <span className="text-gray-600">Disponível</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span className="text-gray-600">Selecionado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-100 border-2 border-red-200 rounded"></div>
              <span className="text-gray-600">Vendido</span>
            </div>
          </div>
        </div>

        {/* Grid Principal - Layout Adaptativo */}
        <div className={`space-y-6 ${isMobile ? 'space-y-4' : ''}`}>
          {numberGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white rounded-2xl shadow-sm border p-4">
              {/* Header do grupo */}
              <div className="mb-4 text-center">
                <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
                  {isMobile 
                    ? `${group[0].toString().padStart(3, '0')} - ${group[group.length - 1].toString().padStart(3, '0')}`
                    : `${group[0].toString().padStart(3, '0')} - ${group[group.length - 1].toString().padStart(3, '0')}`
                  }
                </span>
              </div>
              
              {/* Grid de números - Responsivo */}
              <div className={`grid gap-3 ${
                isMobile 
                  ? 'grid-cols-2 sm:grid-cols-3' // Mobile: 2 colunas, SM: 3 colunas
                  : 'grid-cols-10' // Desktop: 10 colunas (original)
              }`}>
                {group.map((number) => (
                  <button
                    key={number}
                    onClick={() => handleNumberClick(number)}
                    disabled={isNumberSold(number) || !user}
                    className={`
                      ${getNumberButtonClass(number)}
                      ${!user ? 'opacity-50' : ''}
                      ${isMobile ? 'active:scale-95 active:bg-blue-100' : ''} // Feedback de toque mobile
                    `}
                  >
                    {number.toString().padStart(3, '0')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Cards - Layout responsivo */}
        <div className={`mt-8 grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
            <div className={`font-bold text-blue-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {130 - soldNumbers.length}
            </div>
            <div className="text-xs text-gray-600">Disponíveis</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
            <div className={`font-bold text-red-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {soldNumbers.length}
            </div>
            <div className="text-xs text-gray-600">Vendidos</div>
          </div>
          {/* Mobile: Segunda linha para os próximos 2 cards */}
          <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
            <div className={`font-bold text-green-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {cartItems.length}
            </div>
            <div className="text-xs text-gray-600">No Carrinho</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
            <div className={`font-bold text-purple-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              R$ {(cartItems.length * 100).toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Cart Modal - Adaptado para mobile */}
      {showCart && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className={`bg-white w-full overflow-y-auto ${
            isMobile 
              ? 'rounded-t-2xl max-h-[90vh]' // Mobile: modal bottom sheet
              : 'rounded-2xl max-w-2xl max-h-[90vh]' // Desktop: modal centralizado
          }`}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Meu Carrinho</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <Cart onClose={() => setShowCart(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NumberSelection;
