
import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Mail, User, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CheckoutProps {
  onBack: () => void;
  onClose: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ onBack, onClose }) => {
  const { cartItems, getTotalPrice, getTotalWithFee, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const pixTotal = getTotalPrice();
  const cardTotal = getTotalWithFee(5);
  const finalTotal = paymentMethod === 'pix' ? pixTotal : cardTotal;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simular processamento de pagamento
    await new Promise(resolve => setTimeout(resolve, 3000));

    setIsProcessing(false);
    setIsSuccess(true);

    // Limpar carrinho após sucesso
    setTimeout(() => {
      clearCart();
      onClose();
    }, 3000);
  };

  if (isSuccess) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h3>
        <p className="text-gray-600 mb-4">
          Seus números foram reservados com sucesso. Você receberá um e-mail de confirmação em breve.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="text-sm text-green-800">
            <div className="font-semibold mb-1">Números Adquiridos:</div>
            <div className="flex flex-wrap gap-1">
              {cartItems.map((item, index) => (
                <span key={item.number} className="bg-green-200 px-2 py-1 rounded text-xs">
                  {item.number.toString().padStart(3, '0')}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Esta janela será fechada automaticamente...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Finalizar Compra</h2>
          <p className="text-sm text-gray-600">{cartItems.length} números selecionados</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Informações Pessoais</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nome Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Seu nome completo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="seu@email.com"
            />
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Método de Pagamento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pix Option */}
            <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
              paymentMethod === 'pix' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="pix"
                checked={paymentMethod === 'pix'}
                onChange={(e) => setPaymentMethod(e.target.value as 'pix')}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Pix</div>
                    <div className="text-sm text-gray-600">Aprovação instantânea</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    R$ {pixTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-green-600">Sem taxa</div>
                </div>
              </div>
            </label>

            {/* Card Option */}
            <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
              paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Cartão</div>
                    <div className="text-sm text-gray-600">Taxa 5%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">
                    R$ {cardTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-blue-600">+ R$ {(cardTotal - pixTotal).toFixed(2)}</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Card Details (shown only if card is selected) */}
        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Dados do Cartão</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome no Cartão
              </label>
              <input
                type="text"
                name="cardName"
                value={formData.cardName}
                onChange={handleInputChange}
                required={paymentMethod === 'card'}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nome como aparece no cartão"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Cartão
              </label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                required={paymentMethod === 'card'}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validade
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  required={paymentMethod === 'card'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MM/AA"
                  maxLength={5}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  required={paymentMethod === 'card'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Resumo do Pedido</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{cartItems.length} números × R$ 100,00</span>
              <span className="text-gray-900">R$ {pixTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {paymentMethod === 'card' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa de processamento (5%)</span>
                <span className="text-gray-900">R$ {(cardTotal - pixTotal).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-lg">R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-lg disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processando...</span>
            </>
          ) : (
            <span>Confirmar Pagamento - R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          )}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500 text-center">
        ✓ Pagamento seguro e criptografado • ✓ Confirmação por e-mail
      </div>
    </div>
  );
};

export default Checkout;
