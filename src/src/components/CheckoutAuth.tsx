import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Mail, User, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CheckoutAuthProps {
  onBack: () => void;
  onClose: () => void;
}

const CheckoutAuth: React.FC<CheckoutAuthProps> = ({ onBack, onClose }) => {
  const { cartItems, getTotalPrice, getTotalWithFee, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    whatsapp: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
        phone: user.user_metadata?.phone || prev.phone
      }));
    }
  }, [user]);

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
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para finalizar a compra",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome completo",
        variant: "destructive"
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "E-mail obrigatório",
        description: "Por favor, informe seu e-mail",
        variant: "destructive"
      });
      return;
    }

    if (!formData.whatsapp.trim()) {
      toast({
        title: "WhatsApp obrigatório",
        description: "Por favor, informe seu WhatsApp para entrar no grupo",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Criar sessão de checkout no Stripe
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          numeros: cartItems.map(item => item.number),
          metodo_pagamento: paymentMethod,
          nome: formData.name,
          email: formData.email,
          telefone: formData.whatsapp,
        }
      });

      if (error) {
        console.error('Erro na função:', error);
        throw new Error(error.message || 'Erro ao processar pagamento');
      }

      if (!data.url) {
        throw new Error('URL de pagamento não recebida');
      }

      // Redirecionar para o Stripe Checkout
      window.location.href = data.url;

    } catch (error) {
      console.error('Erro no checkout:', error);
      toast({
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Houve um problema ao processar seu pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Login Necessário</h3>
        <p className="text-gray-600 mb-6">
          Você precisa estar logado para finalizar a compra.
        </p>
        <button
          onClick={onBack}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          Fazer Login
        </button>
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
                Nome Completo *
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
                WhatsApp *
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(11) 99999-9999"
              />
              <p className="text-xs text-gray-500 mt-1">
                Será usado para adicionar você no grupo do sorteio
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              E-mail *
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
              paymentMethod === 'cartao' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cartao"
                checked={paymentMethod === 'cartao'}
                onChange={(e) => setPaymentMethod(e.target.value as 'cartao')}
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

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Resumo do Pedido</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{cartItems.length} números × R$ 100,00</span>
              <span className="text-gray-900">R$ {pixTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {paymentMethod === 'cartao' && (
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
            <span>
              Pagar com {paymentMethod === 'pix' ? 'Pix' : 'Cartão'} - R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500 text-center">
        ✓ Dados seguros e criptografados • ✓ Processamento via Stripe
      </div>
    </div>
  );
};

export default CheckoutAuth;
