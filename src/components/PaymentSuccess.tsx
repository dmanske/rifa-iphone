
import React, { useEffect, useState } from 'react';
import { CheckCircle, Download, Home, Loader2, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentSuccessProps {
  onGoHome: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onGoHome }) => {
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(true);
  const [purchaseData, setPurchaseData] = useState<any>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        // Buscar session_id da URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        console.log('PaymentSuccess - session_id:', sessionId);

        if (!sessionId) {
          console.log('No session_id found, redirecting to home');
          setIsConfirming(false);
          onGoHome();
          return;
        }

        console.log('Confirming payment with session_id:', sessionId);

        // Confirmar pagamento
        const { data, error } = await supabase.functions.invoke('confirm-payment', {
          body: { session_id: sessionId }
        });

        console.log('Confirm payment response:', { data, error });

        if (error) {
          console.error('Error confirming payment:', error);
          throw new Error(error.message);
        }

        console.log('Payment confirmed successfully:', data);

        if (data?.purchase) {
          setPurchaseData(data.purchase);
          clearCart();
          
          toast({
            title: "Pagamento confirmado!",
            description: "Seus números foram reservados com sucesso.",
          });
        } else {
          throw new Error('Dados da compra não encontrados');
        }

      } catch (error) {
        console.error('Erro ao confirmar pagamento:', error);
        toast({
          title: "Erro",
          description: "Houve um problema ao confirmar seu pagamento. Entre em contato conosco.",
          variant: "destructive"
        });
        // Não redirecionar automaticamente em caso de erro para permitir debug
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();
  }, [clearCart, toast, onGoHome]);

  if (isConfirming) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full mx-4">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Confirmando pagamento...
          </h2>
          <p className="text-gray-600">
            Aguarde enquanto processamos sua compra.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full mx-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Confirmado!
        </h2>
        
        <p className="text-gray-600 mb-6">
          Parabéns! Seus números foram reservados com sucesso.
        </p>

        {purchaseData && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-green-800 mb-2">Detalhes da Compra:</h3>
            <div className="text-sm text-green-700 space-y-1">
              <div>
                <strong>Números:</strong> {purchaseData.numeros?.map((n: number) => 
                  n.toString().padStart(3, '0')
                ).join(', ') || 'N/A'}
              </div>
              <div>
                <strong>Valor Pago:</strong> R$ {purchaseData.valor_pago?.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2 
                }) || '0,00'}
              </div>
              <div>
                <strong>Método:</strong> {purchaseData.metodo_pagamento === 'pix' ? 'Pix' : 'Cartão de Crédito'}
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Próximos Passos:</h3>
          <p className="text-sm text-blue-700 mb-3">
            Entre no grupo do WhatsApp para acompanhar o sorteio e receber atualizações:
          </p>
          
          {/* Espaço para o link do grupo WhatsApp */}
          <div className="bg-white p-3 rounded-lg border-2 border-dashed border-blue-300 mb-3">
            <p className="text-xs text-blue-600 mb-2">Link do Grupo WhatsApp:</p>
            <p className="text-sm text-gray-500">
              [Adicionar link do grupo aqui]
            </p>
          </div>
          
          <a 
            href="https://chat.whatsapp.com/LINK_DO_GRUPO" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Entrar no Grupo WhatsApp
          </a>
        </div>

        {/* Botão de contato direto */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Precisa de Ajuda?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Entre em contato direto comigo se tiver alguma dúvida:
          </p>
          <a 
            href="https://wa.me/5511999999999?text=Olá,%20fiz%20uma%20compra%20na%20rifa%20do%20iPhone%20e%20preciso%20de%20ajuda"
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contato Direto WhatsApp</span>
          </a>
          <p className="text-xs text-gray-500 mt-2">
            Clique para abrir o WhatsApp e falar comigo diretamente
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onGoHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Voltar ao Início</span>
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Você receberá um e-mail de confirmação em breve com todos os detalhes da sua compra.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
