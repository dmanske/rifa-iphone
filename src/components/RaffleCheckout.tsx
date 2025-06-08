
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Mail, User, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RaffleCheckoutProps {
  onBack: () => void;
  selectedNumbers: number[];
}

const RaffleCheckout: React.FC<RaffleCheckoutProps> = ({ onBack, selectedNumbers }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.full_name || prev.name,
        phone: profile.phone || prev.phone,
      }));
    }
  }, [profile]);

  // VALIDAÇÃO CRÍTICA: Verificar se há números vendidos na seleção
  useEffect(() => {
    const validateSelectedNumbers = async () => {
      if (selectedNumbers.length === 0) return;
      
      try {
        console.log('🔍 Validando números selecionados no checkout:', selectedNumbers);
        
        const { data: numbersData, error } = await supabase
          .from('raffle_numbers')
          .select('numero, status')
          .in('numero', selectedNumbers);

        if (error) throw error;

        const soldNumbers = numbersData?.filter(n => n.status === 'vendido').map(n => n.numero) || [];
        
        if (soldNumbers.length > 0) {
          console.log('❌ CRÍTICO: Números vendidos detectados no checkout:', soldNumbers);
          toast({
            title: "Números indisponíveis detectados",
            description: `Os números ${soldNumbers.join(', ')} foram vendidos. Voltando para seleção.`,
            variant: "destructive"
          });
          
          // Voltar para a tela de seleção
          setTimeout(() => {
            onBack();
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Erro ao validar números:', error);
        toast({
          title: "Erro de validação",
          description: "Erro ao verificar disponibilidade dos números",
          variant: "destructive"
        });
      }
    };

    validateSelectedNumbers();
  }, [selectedNumbers, toast, onBack]);

  const basePrice = selectedNumbers.length * 100;
  const pixTotal = basePrice;
  const cardTotal = Math.round(basePrice * 1.05); // 5% taxa cartão
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

    if (selectedNumbers.length === 0) {
      toast({
        title: "Nenhum número selecionado",
        description: "Selecione números antes de finalizar a compra",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // VALIDAÇÃO FINAL: Verificar disponibilidade antes do pagamento
      console.log('🔍 Validação final antes do pagamento...');
      
      const { data: numbersData, error: numbersError } = await supabase
        .from('raffle_numbers')
        .select('numero, status')
        .in('numero', selectedNumbers);

      if (numbersError) throw numbersError;

      const soldNumbers = numbersData?.filter(n => n.status === 'vendido').map(n => n.numero) || [];
      
      if (soldNumbers.length > 0) {
        throw new Error(`Os números ${soldNumbers.join(', ')} foram vendidos por outro usuário. Por favor, selecione outros números.`);
      }

      // Unificar chamada das funções - usar a mesma lógica para PIX e Cartão
      let functionName: string;
      let providerName: string;

      if (paymentMethod === 'pix') {
        functionName = 'create-mercadopago-payment';
        providerName = 'MercadoPago';
      } else {
        functionName = 'create-checkout-session';
        providerName = 'Stripe';
      }

      console.log(`Processando pagamento via ${providerName}...`);

      // Criar sessão de checkout
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          numeros: selectedNumbers,
          metodo_pagamento: paymentMethod,
          nome: formData.name,
          email: formData.email,
          telefone: formData.phone,
          user_id: user.id,
        }
      });

      if (error) {
        console.error(`Erro na função ${functionName}:`, error);
        throw new Error(error.message || `Erro ao processar pagamento via ${providerName}`);
      }

      if (!data.url) {
        throw new Error('URL de pagamento não recebida');
      }

      console.log(`✅ Sessão criada com sucesso:`, data);

      // UNIFICAR FLUXO: Ambos PIX e Cartão usam redirecionamento direto
      console.log(`Redirecionando para ${providerName}:`, data.url);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full mx-4">
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
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Finalizar Compra</h1>
              <p className="text-sm text-gray-600">{selectedNumbers.length} números selecionados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Números selecionados */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Números Selecionados</h3>
            <div className="grid grid-cols-10 gap-2 mb-4">
              {selectedNumbers.map(num => (
                <div
                  key={num}
                  className="bg-green-100 text-green-800 p-2 rounded text-center text-sm font-bold"
                >
                  {num.toString().padStart(3, '0')}
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {selectedNumbers.length} números × R$ 100,00 = R$ {basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Informações Pessoais */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
            
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
                  Telefone/WhatsApp
                  <span className="text-gray-500 text-xs ml-1">(opcional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="mt-4">
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

          {/* Método de Pagamento */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Método de Pagamento</h3>
            
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

          {/* Resumo do Pedido */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Resumo do Pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{selectedNumbers.length} números × R$ 100,00</span>
                <span className="text-gray-900">R$ {basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              {paymentMethod === 'cartao' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de processamento (5%)</span>
                  <span className="text-gray-900">R$ {(cardTotal - pixTotal).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-green-600">R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
                <span>Validando e processando...</span>
              </>
            ) : (
              <span>
                Pagar com {paymentMethod === 'pix' ? 'Pix' : 'Cartão'} - R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500 text-center">
          ✓ Dados seguros e criptografados • ✓ Processamento via {paymentMethod === 'pix' ? 'MercadoPago' : 'Stripe'}
        </div>
      </div>
    </div>
  );
};

export default RaffleCheckout;
