
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, X, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import Cart from './Cart';
import { supabase } from '@/integrations/supabase/client';

interface NumberSelectionProps {
  onBack: () => void;
  onAuthRequired: () => void;
}

const NumberSelection: React.FC<NumberSelectionProps> = ({ onBack, onAuthRequired }) => {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { user } = useAuth();
  const [showCart, setShowCart] = useState(false);
  const [soldNumbers, setSoldNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSoldNumbers();
  }, []);

  const fetchSoldNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('numbers')
        .eq('status', 'confirmed');

      if (error) {
        console.error('Erro ao buscar números vendidos:', error);
        return;
      }

      const allSoldNumbers: number[] = [];
      data?.forEach(purchase => {
        if (purchase.numbers) {
          allSoldNumbers.push(...purchase.numbers);
        }
      });

      setSoldNumbers(allSoldNumbers);
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getNumberButtonClass = (number: number) => {
    if (isNumberSold(number)) {
      return 'bg-red-100 text-red-400 cursor-not-allowed border-red-200';
    }
    if (isNumberInCart(number)) {
      return 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105';
    }
    return 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:scale-105 cursor-pointer';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Escolha seus números</h1>
                <p className="text-gray-600">R$ 100,00 por número • Máximo 10 números por pessoa</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {!user && (
                <button
                  onClick={onAuthRequired}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Fazer Login</span>
                </button>
              )}
              
              <button
                onClick={handleCartClick}
                className="relative bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Carrinho</span>
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
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
        <div className="bg-blue-50 border border-blue-200 mx-6 mt-6 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LogIn className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-blue-800 font-medium">Login necessário</p>
                <p className="text-blue-700 text-sm">
                  Faça login ou crie uma conta para escolher seus números da sorte
                </p>
              </div>
            </div>
            <button
              onClick={onAuthRequired}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Entrar
            </button>
          </div>
        </div>
      )}

      {/* Numbers Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
              <span className="text-gray-600">Disponível</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-gray-600">Selecionado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-200 rounded"></div>
              <span className="text-gray-600">Vendido</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-3">
          {Array.from({ length: 130 }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              onClick={() => handleNumberClick(number)}
              disabled={isNumberSold(number)}
              className={`
                aspect-square rounded-xl border-2 font-semibold text-sm transition-all duration-200
                ${getNumberButtonClass(number)}
                ${!isNumberSold(number) && user ? 'hover:shadow-md' : ''}
                ${!user ? 'opacity-50' : ''}
              `}
            >
              {number.toString().padStart(3, '0')}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{130 - soldNumbers.length}</div>
            <div className="text-sm text-gray-600">Números Disponíveis</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-red-600">{soldNumbers.length}</div>
            <div className="text-sm text-gray-600">Números Vendidos</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{cartItems.length}</div>
            <div className="text-sm text-gray-600">No Carrinho</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">
              R$ {(cartItems.length * 100).toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-gray-600">Total Selecionado</div>
          </div>
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Meu Carrinho</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
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
