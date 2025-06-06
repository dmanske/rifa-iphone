import React, { useState } from 'react';
import { Trash2, CreditCard, Smartphone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CheckoutAuth from './CheckoutAuth';

interface CartProps {
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({ onClose }) => {
  const { cartItems, removeFromCart, clearCart, getTotalPrice, getTotalWithFee } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const pixTotal = getTotalPrice();
  const cardTotal = getTotalWithFee(5); // 5% fee for credit card

  if (showCheckout) {
    return <CheckoutAuth onBack={() => setShowCheckout(false)} onClose={onClose} />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Carrinho vazio</h3>
        <p className="text-gray-600 mb-6">Adicione números para participar da rifa</p>
        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          Escolher Números
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Números Selecionados ({cartItems.length})
          </h3>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Limpar Tudo
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
          {cartItems.map((item) => (
            <div
              key={item.number}
              className="relative bg-blue-50 border border-blue-200 rounded-lg p-3 text-center"
            >
              <div className="font-semibold text-blue-900">
                {item.number.toString().padStart(3, '0')}
              </div>
              <div className="text-xs text-blue-600">R$ {item.price}</div>
              <button
                onClick={() => removeFromCart(item.number)}
                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Opções de Pagamento</h3>
        
        {/* Pix Option */}
        <div className="border border-green-200 rounded-xl p-4 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-green-900">Pix</div>
                <div className="text-xs text-green-700">Aprovação instantânea</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-900">
                R$ {pixTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-green-700">Sem taxa adicional</div>
            </div>
          </div>
        </div>

        {/* Credit Card Option */}
        <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-blue-900">Cartão de Crédito</div>
                <div className="text-xs text-blue-700">Taxa de processamento: 5%</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-900">
                R$ {cardTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-blue-700">
                R$ {pixTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + R$ {(cardTotal - pixTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} taxa
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>{cartItems.length} números × R$ 100,00</span>
          <span>R$ {pixTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="text-xs text-gray-500 mb-4">
          * Valores finais mostrados acima incluem todas as taxas aplicáveis
        </div>
        
        <button
          onClick={() => setShowCheckout(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-lg"
        >
          Finalizar Compra
        </button>
      </div>
    </div>
  );
};

export default Cart;
