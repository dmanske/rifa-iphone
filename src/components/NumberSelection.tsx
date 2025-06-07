
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, X, LogIn, Shuffle } from 'lucide-react';
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

  // Buscar números vendidos sempre que o componente montar (independente do usuário)
  useEffect(() => {
    fetchSoldNumbers();
  }, []); // Remover dependência do user para carregar sempre

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
    // Sempre bloquear números vendidos, mesmo sem login
    if (isNumberSold(number)) return;
    
    // Verificar se o usuário está logado antes de permitir seleção
    if (!user) {
      onAuthRequired();
      return;
    }
    
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

  // Funções para seleção rápida
  const selectRandomNumbers = (count: number) => {
    if (!user) {
      onAuthRequired();
      return;
    }

    const availableNumbers = [];
    for (let i = 1; i <= 130; i++) {
      if (!isNumberSold(i) && !isNumberInCart(i)) {
        availableNumbers.push(i);
      }
    }

    const remainingSlots = 10 - cartItems.length;
    const numbersToAdd = Math.min(count, availableNumbers.length, remainingSlots);

    for (let i = 0; i < numbersToAdd; i++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      const number = availableNumbers.splice(randomIndex, 1)[0];
      addToCart(number);
    }
  };

  const clearSelection = () => {
    if (!user) return;
    cartItems.forEach(item => removeFromCart(item.number));
  };

  // Classes dinâmicas para os botões
  const getNumberButtonClass = (number: number) => {
    const baseClasses = 'aspect-square rounded-xl font-bold transition-all duration-300 border-2 flex items-center justify-center text-center touch-manipulation relative overflow-hidden';
    
    // Sempre mostrar números vendidos como desabilitados
    if (isNumberSold(number)) {
      return `${baseClasses} bg-red-500 text-white cursor-not-allowed border-red-600 opacity-80`;
    }
    
    // Mostrar números no carrinho apenas se o usuário estiver logado
    if (user && isNumberInCart(number)) {
      return `${baseClasses} bg-gradient-to-br from-purple-600 to-blue-600 text-white border-purple-600 shadow-lg scale-105 animate-pulse`;
    }
    
    // Números disponíveis
    const availableClasses = `${baseClasses} bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:scale-105 active:scale-95 cursor-pointer shadow-md hover:shadow-lg`;
    
    if (!user) {
      return `${availableClasses} opacity-60`; // Indicação visual de que precisa login
    }
    
    return availableClasses;
  };

  // Gerar array de números de 1 a 130
  const numbers = Array.from({ length: 130 }, (_, i) => i + 1);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500">
      {/* Header Moderno */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  🎉 Rifa da Sorte
                </h1>
                <p className="text-white/80 text-sm">
                  Escolha seus números da sorte
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!user && (
                <button
                  onClick={onAuthRequired}
                  className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
              
              <button
                onClick={handleCartClick}
                className="relative bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 px-4 py-2 text-sm"
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
        <div className="mx-4 mt-4">
          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <LogIn className="w-5 h-5 text-white" />
                <div>
                  <p className="text-white font-medium text-sm">Login necessário</p>
                  <p className="text-white/80 text-xs">
                    Faça login para escolher seus números
                  </p>
                </div>
              </div>
              <button
                onClick={onAuthRequired}
                className="bg-white/30 hover:bg-white/40 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Container Principal com Fundo Branco */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {/* Stats Modernos */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600">{130 - soldNumbers.length}</div>
              <div className="text-xs text-blue-600 font-medium">Disponíveis</div>
            </div>
            <div className="text-center bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-600">{soldNumbers.length}</div>
              <div className="text-xs text-red-600 font-medium">Vendidos</div>
            </div>
            <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600">R$ 100</div>
              <div className="text-xs text-green-600 font-medium">Por número</div>
            </div>
          </div>

          {/* Quick Select Buttons */}
          {user && (
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              <button
                onClick={() => selectRandomNumbers(1)}
                className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all"
              >
                <Shuffle className="w-3 h-3" />
                <span>+1 Aleatório</span>
              </button>
              <button
                onClick={() => selectRandomNumbers(5)}
                className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all"
              >
                <Shuffle className="w-3 h-3" />
                <span>+5 Aleatórios</span>
              </button>
              <button
                onClick={() => selectRandomNumbers(10)}
                className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all"
              >
                <Shuffle className="w-3 h-3" />
                <span>+10 Aleatórios</span>
              </button>
              <button
                onClick={clearSelection}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-all"
              >
                Limpar
              </button>
            </div>
          )}

          {/* Grid de Números - 5 colunas no mobile */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {numbers.map((number) => (
              <button
                key={number}
                onClick={() => handleNumberClick(number)}
                disabled={isNumberSold(number)}
                className={getNumberButtonClass(number)}
              >
                {number.toString().padStart(3, '0')}
                {isNumberSold(number) && (
                  <span className="absolute top-1 right-1 text-xs">✗</span>
                )}
              </button>
            ))}
          </div>

          {/* Selection Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
            <div className="text-lg text-blue-700 mb-2">
              Números selecionados: <span className="font-bold">{user ? cartItems.length : 0}</span>
            </div>
            <div className="text-2xl font-bold text-blue-800">
              Total: R$ {user ? (cartItems.length * 100).toLocaleString('pt-BR') : '0'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={clearSelection}
              disabled={!user || cartItems.length === 0}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 py-3 rounded-xl font-semibold transition-all"
            >
              Limpar Seleção
            </button>
            <button
              onClick={handleCartClick}
              disabled={!user || cartItems.length === 0}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all"
            >
              Comprar Números
            </button>
          </div>

          {/* Legend Visual */}
          <div className="flex justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
              <span className="text-gray-600">Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded"></div>
              <span className="text-gray-600">Selecionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-600">Vendido</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className={`bg-white w-full overflow-y-auto ${
            isMobile 
              ? 'rounded-t-2xl max-h-[90vh]' 
              : 'rounded-2xl max-w-2xl max-h-[90vh]'
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
