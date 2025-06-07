
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

  // Classes dinâmicas para os botões com grid responsivo
  const getNumberButtonClass = (number: number) => {
    const baseClasses = 'rounded-xl font-bold transition-all duration-200 border-2 flex items-center justify-center text-center min-h-[50px] sm:min-h-[60px] lg:min-h-[64px] touch-manipulation';
    
    // Sempre mostrar números vendidos como desabilitados, independente do login
    if (isNumberSold(number)) {
      return `${baseClasses} bg-red-100 text-red-500 cursor-not-allowed border-red-200 opacity-60`;
    }
    
    // Mostrar números no carrinho apenas se o usuário estiver logado
    if (user && isNumberInCart(number)) {
      return `${baseClasses} bg-blue-600 text-white border-blue-600 shadow-lg scale-105`;
    }
    
    // Números disponíveis (com indicação visual se não logado)
    const availableClasses = `${baseClasses} bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 active:scale-95 cursor-pointer shadow-sm`;
    
    if (!user) {
      return `${availableClasses} opacity-75`; // Leve indicação visual de que precisa login
    }
    
    return availableClasses;
  };

  // Gerar array de números de 1 a 130
  const numbers = Array.from({ length: 130 }, (_, i) => i + 1);

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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Legend - Compacta e responsiva */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-center gap-4 text-xs">
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

        {/* Grid Principal - Layout Totalmente Responsivo com auto-fit */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
          <div className="mb-4 text-center">
            <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
              Números da Sorte • 001 - 130
            </span>
          </div>
          
          {/* 
            Grid responsivo usando auto-fit:
            - Mobile (até 480px): ~3-4 colunas (minmax 70px)
            - Tablet (480px-768px): ~5-7 colunas 
            - Desktop (768px+): ~8-12 colunas
            O grid se ajusta automaticamente baseado no tamanho da tela
          */}
          <div className="grid gap-2 sm:gap-3 grid-cols-[repeat(auto-fit,minmax(70px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(75px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(80px,1fr))]">
            {numbers.map((number) => (
              <button
                key={number}
                onClick={() => handleNumberClick(number)}
                disabled={isNumberSold(number)} // Sempre desabilitar números vendidos
                className={`
                  ${getNumberButtonClass(number)}
                  text-sm sm:text-base
                `}
              >
                {number.toString().padStart(3, '0')}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards - Layout responsivo */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
            <div className="font-bold text-blue-600 text-lg sm:text-xl">
              {130 - soldNumbers.length}
            </div>
            <div className="text-xs text-gray-600">Disponíveis</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
            <div className="font-bold text-red-600 text-lg sm:text-xl">
              {soldNumbers.length}
            </div>
            <div className="text-xs text-gray-600">Vendidos</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
            <div className="font-bold text-green-600 text-lg sm:text-xl">
              {user ? cartItems.length : 0}
            </div>
            <div className="text-xs text-gray-600">No Carrinho</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
            <div className="font-bold text-purple-600 text-lg sm:text-xl">
              R$ {user ? (cartItems.length * 100).toLocaleString('pt-BR') : '0'}
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
