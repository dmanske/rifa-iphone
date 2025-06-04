
import React, { useEffect, useState } from 'react';
import { CheckCircle, Download, Home, Loader2 } from 'lucide-react';
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

        if (!sessionId) {
          throw new Error('Session ID não encontrado');
        }

        // Confirmar pagamento
        const { data, error } = await supabase.functions.invoke('confirm-payment', {
          body: { session_id: sessionId }
        });

        if (error) {
          throw new Error(error.message);
        }

        setPurchaseData(data.purchase);
        clearCart();
        
        toast({
          title: "Pagamento confirmado!",
          description: "Seus números foram reservados com sucesso.",
        });

      } catch (error) {
        console.error('Erro ao confirmar pagamento:', error);
        toast({
          title: "Erro",
          description: "Houve um problema ao confirmar seu pagamento. Entre em contato conosco.",
          variant: "destructive"
        });
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();
  }, [clearCart, toast]);

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
                <strong>Números:</strong> {purchaseData.numeros.map((n: number) => 
                  n.toString().padStart(3, '0')
                ).join(', ')}
              </div>
              <div>
                <strong>Valor Pago:</strong> R$ {purchaseData.valor_pago.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2 
                })}
              </div>
              <div>
                <strong>Método:</strong> {purchaseData.metodo_pagamento === 'pix' ? 'Pix' : 'Cartão de Crédito'}
              </div>
            </div>
          </div>
        )}

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
