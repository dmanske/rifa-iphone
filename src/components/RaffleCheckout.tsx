import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface RaffleCheckoutProps {
  onClose: () => void;
}

const RaffleCheckout: React.FC<RaffleCheckoutProps> = ({ onClose }) => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: user?.user_metadata?.name || '',
    email: user?.email || '',
    telefone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMercadoPagoPayment = async () => {
    try {
      setIsProcessing(true);
      console.log('🔄 Iniciando pagamento MercadoPago...');

      const { data, error } = await supabase.functions.invoke('create-mercadopago-payment', {
        body: {
          numeros: cartItems,
          metodo_pagamento: paymentMethod,
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          user_id: user.id
        }
      });

      if (error) {
        console.error('❌ Erro ao criar pagamento:', error);
        toast({
          title: "Erro no pagamento",
          description: error.message || "Erro ao processar pagamento",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Pagamento criado:', data);

      if (data?.url) {
        // Abrir em nova janela
        const paymentWindow = window.open(data.url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        
        if (!paymentWindow) {
          // Fallback se popup foi bloqueado
          window.location.href = data.url;
          return;
        }

        // Monitorar se a janela foi fechada ou se houve redirecionamento
        const checkPayment = setInterval(async () => {
          try {
            // Verificar se a janela ainda está aberta
            if (paymentWindow.closed) {
              clearInterval(checkPayment);
              console.log('🔍 Janela de pagamento fechada, verificando status...');
              
              // Verificar se o pagamento foi processado
              await checkPaymentStatus(data.transaction_id);
              return;
            }

            // Tentar acessar a URL da janela (funciona se estiver no mesmo domínio)
            try {
              const currentUrl = paymentWindow.location.href;
              if (currentUrl && (currentUrl.includes('payment_success=true') || currentUrl.includes('payment_pending=true'))) {
                clearInterval(checkPayment);
                paymentWindow.close();
                console.log('✅ Redirecionamento detectado:', currentUrl);
                
                // Redirecionar para a página de sucesso
                if (currentUrl.includes('payment_success=true')) {
                  window.location.href = '/?payment_success=true&transaction_id=' + data.transaction_id;
                } else {
                  window.location.href = '/?payment_pending=true&transaction_id=' + data.transaction_id;
                }
                return;
              }
            } catch (e) {
              // Erro de CORS é esperado quando está em domínio diferente
            }
          } catch (error) {
            console.error('Erro ao verificar janela:', error);
          }
        }, 1000);

        // Timeout após 5 minutos
        setTimeout(() => {
          if (!paymentWindow.closed) {
            clearInterval(checkPayment);
            console.log('⏰ Timeout na verificação de pagamento');
          }
        }, 300000);

      } else {
        throw new Error('URL de pagamento não retornada');
      }

    } catch (error) {
      console.error('❌ Erro:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para verificar o status do pagamento no banco
  const checkPaymentStatus = async (transactionId: string) => {
    try {
      console.log('🔍 Verificando status da transação:', transactionId);
      
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar transação:', error);
        return;
      }

      console.log('📋 Status da transação:', transaction?.status);

      if (transaction?.status === 'pago') {
        // Pagamento confirmado, redirecionar para sucesso
        window.location.href = '/?payment_success=true&transaction_id=' + transactionId;
      } else if (transaction?.status === 'pendente') {
        // Pagamento ainda pendente
        window.location.href = '/?payment_pending=true&transaction_id=' + transactionId;
      } else {
        // Voltar para o checkout
        toast({
          title: "Status do pagamento",
          description: "Verifique o status do seu pagamento. Se já foi pago, aguarde alguns minutos.",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao verificar pagamento:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Checkout
          </h3>
          <div className="mt-2 px-7 py-3">
            <Input
              type="text"
              name="nome"
              placeholder="Nome Completo"
              value={formData.nome}
              onChange={handleChange}
              className="mb-4"
            />
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="mb-4"
            />
            <Input
              type="tel"
              name="telefone"
              placeholder="Telefone (opcional)"
              value={formData.telefone}
              onChange={handleChange}
              className="mb-4"
            />

            <div className="mb-4">
              <Label className="block text-gray-700 text-sm font-bold mb-2">
                Método de Pagamento
              </Label>
              <RadioGroup defaultValue="pix" className="flex space-x-2" onValueChange={value => setPaymentMethod(value === 'pix' ? 'pix' : 'cartao')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="r1" className="peer h-4 w-4 border border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800" />
                  <Label htmlFor="r1" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                    PIX
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cartao" id="r2" className="peer h-4 w-4 border border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800" />
                  <Label htmlFor="r2" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                    Cartão de Crédito
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div className="items-center px-4 py-3">
            <Button
              onClick={handleMercadoPagoPayment}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {isProcessing ? 'Processando...' : 'Pagar com Mercado Pago'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaffleCheckout;
