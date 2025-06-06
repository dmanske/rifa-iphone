import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, Download, Home, Loader2, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNumbers } from '../context/NumbersContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentSuccessProps {
  onGoHome: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onGoHome }) => {
  const { clearCart } = useCart();
  const { refreshNumbers } = useNumbers();
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(true);
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const hasProcessed = useRef(false);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Evitar reprocessamento
    if (hasProcessed.current) return;

    const confirmPayment = async () => {
      try {
        hasProcessed.current = true;
        console.log('🔍 PaymentSuccess - Confirmando pagamento único...');

        // Buscar parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id'); // Stripe
        const paymentId = urlParams.get('payment_id'); // MercadoPago
        const collectionStatus = urlParams.get('collection_status'); // MercadoPago
        const preferenceId = urlParams.get('preference_id'); // MercadoPago
        const status = urlParams.get('status'); // MercadoPago
        const hasPaymentSuccess = urlParams.get('payment_success') === 'true'; // MercadoPago
        const hasPaymentPending = urlParams.get('payment_pending') === 'true'; // MercadoPago

        console.log('PaymentSuccess - Parâmetros:', { 
          sessionId, paymentId, collectionStatus, preferenceId, status, 
          hasPaymentSuccess, hasPaymentPending 
        });

        // Verificar se é Stripe ou MercadoPago
        if (sessionId) {
          // STRIPE - processo original
          console.log('Confirming payment with session_id:', sessionId);

          // Aguardar um pouco para dar tempo do webhook processar
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Confirmar pagamento
          const { data, error } = await supabase.functions.invoke('confirm-payment', {
            body: { session_id: sessionId }
          });

          console.log('Confirm payment response:', { data, error });

          if (error) {
            console.error('Error confirming payment:', error);
            
            // Se o erro for de pagamento não confirmado, tentar novamente após um tempo
            if (error.message?.includes('não foi confirmado')) {
              console.log('Payment not confirmed yet, retrying in 3 seconds...');
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Segunda tentativa
              const { data: retryData, error: retryError } = await supabase.functions.invoke('confirm-payment', {
                body: { session_id: sessionId }
              });
              
              if (retryError) {
                throw new Error(retryError.message);
              }
              
              if (retryData?.purchase) {
                setPurchaseData(retryData.purchase);
                clearCart();
                
                // Atualizar números apenas uma vez
                await refreshNumbers();
                
                toast({
                  title: "Pagamento confirmado!",
                  description: "Seus números foram reservados com sucesso.",
                });
                return;
              }
            }
            
            throw new Error(error.message);
          }

          console.log('Payment confirmed successfully:', data);

          if (data?.purchase) {
            setPurchaseData(data.purchase);
            clearCart();
            
            // Atualizar números apenas uma vez
            await refreshNumbers();
            
            toast({
              title: "Pagamento confirmado!",
              description: "Seus números foram reservados com sucesso.",
            });
          } else {
            throw new Error('Dados da compra não encontrados');
          }

        } else if (paymentId || preferenceId || hasPaymentSuccess || hasPaymentPending) {
          // MERCADOPAGO
          console.log('🔍 Processando MercadoPago payment:', { paymentId, status, collectionStatus, hasPaymentSuccess, hasPaymentPending });

          // Verificar transações no banco primeiro
          let transactionData = null;
          
          if (preferenceId || paymentId) {
            console.log('🔍 Buscando transação no banco...');
            
            const { data: transactions, error: txError } = await supabase
              .from('transactions')
              .select('*')
              .or(`payment_id.eq.${preferenceId || paymentId},payment_id.eq.${paymentId || preferenceId}`)
              .order('created_at', { ascending: false })
              .limit(1);

            if (!txError && transactions && transactions.length > 0) {
              transactionData = transactions[0];
              console.log('✅ Transação encontrada no banco:', transactionData);
              
              // SE A TRANSAÇÃO NO BANCO ESTÁ PAGA, MOSTRAR COMO APROVADO
              if (transactionData.status === 'pago') {
                console.log('✅ Transação já confirmada no banco - Status: PAGO');
                setPurchaseData({
                  status: 'approved',
                  payment_id: paymentId,
                  preference_id: preferenceId,
                  metodo_pagamento: transactionData.metodo_pagamento || 'pix',
                  numeros: transactionData.numeros_comprados || [],
                  valor_pago: transactionData.valor_total || 0,
                  nome: transactionData.nome || '',
                  email: transactionData.email || '',
                  ...transactionData
                });
                clearCart();
                
                // Atualizar números apenas uma vez
                await refreshNumbers();
                
                toast({
                  title: "Pagamento confirmado!",
                  description: "Seus números foram reservados com sucesso.",
                });
                return;
              }
            } else {
              console.log('⚠️ Transação não encontrada ou ainda não processada:', txError);
            }
          }
          
          // Se não encontrou transação paga no banco, verificar status dos parâmetros
          if (status === 'pending' || collectionStatus === 'pending' || hasPaymentPending) {
            // Pagamento PIX pendente - mas NÃO fazer polling aqui
            console.log('💳 Status: Pendente - mostrando status final');
            setPurchaseData({
              status: 'pending',
              payment_id: paymentId,
              preference_id: preferenceId,
              metodo_pagamento: 'pix',
              ...transactionData
            });
            clearCart();
            
            toast({
              title: "Pagamento PIX processando!",
              description: "Seu pagamento está sendo processado. Esta página será atualizada automaticamente.",
              variant: "default"
            });
          } else if (status === 'approved' || collectionStatus === 'approved' || hasPaymentSuccess) {
            // Pagamento aprovado
            console.log('✅ Status: Aprovado');
            setPurchaseData({
              status: 'approved',
              payment_id: paymentId,
              preference_id: preferenceId,
              metodo_pagamento: transactionData?.metodo_pagamento || 'pix',
              numeros: transactionData?.numeros_comprados || [],
              valor_pago: transactionData?.valor_total || 0,
              nome: transactionData?.nome || '',
              email: transactionData?.email || '',
              ...transactionData
            });
            clearCart();
            
            // Atualizar números apenas uma vez
            await refreshNumbers();
            
            toast({
              title: "Pagamento aprovado!",
              description: "Seus números foram reservados com sucesso.",
            });
          } else {
            // Outros status do MercadoPago
            console.log('⚠️ Status:', status || 'unknown');
            setPurchaseData({
              status: status || 'unknown',
              payment_id: paymentId,
              preference_id: preferenceId,
              error: status !== 'approved'
            });
            clearCart();
            
            toast({
              title: "Status do pagamento",
              description: `Status: ${status || 'Verificando...'}`,
              variant: "default"
            });
          }

        } else {
          // Nenhum parâmetro válido encontrado
          console.log('❌ No valid payment parameters found, redirecting to home');
          setIsConfirming(false);
          toast({
            title: "Erro",
            description: "Parâmetros de pagamento não encontrados. Redirecionando para a página inicial.",
            variant: "destructive"
          });
          setTimeout(() => onGoHome(), 2000);
          return;
        }

      } catch (error) {
        console.error('❌ Erro ao confirmar pagamento:', error);
        toast({
          title: "Erro na confirmação",
          description: "Houve um problema ao confirmar seu pagamento. Seus números podem já estar reservados. Entre em contato conosco se necessário.",
          variant: "destructive"
        });
        
        // Mostrar uma mensagem de erro mais amigável
        setPurchaseData({
          numeros: [],
          valor_pago: 0,
          metodo_pagamento: 'unknown',
          error: true
        });
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();

    // Cleanup function
    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
        checkInterval.current = null;
      }
    };
  }, []); // Dependências vazias para executar apenas uma vez

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

        {purchaseData && !purchaseData.error && purchaseData.status !== 'pending' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6 text-left">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-green-800 text-lg">Compra Confirmada!</h3>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-green-300 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2 bg-green-50 p-3 rounded-lg text-center">
                  <span className="font-semibold text-green-800">🎯 Seus números da sorte:</span>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {purchaseData.numeros?.map((n: number) => (
                      <span key={n} className="bg-green-600 text-white px-3 py-1 rounded-full font-bold text-lg">
                        {n.toString().padStart(3, '0')}
                      </span>
                    )) || <span className="text-gray-500">N/A</span>}
                  </div>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-700">💰 Valor Pago:</span>
                  <p className="text-green-600 font-bold text-lg">
                    R$ {purchaseData.valor_pago?.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2 
                    }) || '0,00'}
                  </p>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-700">💳 Método:</span>
                  <p className="text-green-600 font-semibold">
                    {purchaseData.metodo_pagamento === 'pix' ? '🔶 PIX' : '💳 Cartão de Crédito'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <span className="mr-2">🏆</span>
                Agora é torcer!
              </h4>
              <p className="text-sm text-blue-700">
                Seus números estão oficialmente registrados na rifa. 
                Boa sorte e que a fortuna esteja com você! 🍀
              </p>
            </div>
          </div>
        )}

        {purchaseData && purchaseData.status === 'pending' && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 mb-6 text-left">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <h3 className="font-bold text-blue-800 text-lg">PIX Processando</h3>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-blue-300 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Status:</span>
                  <p className="text-blue-600">🔄 Aguardando confirmação</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Método:</span>
                  <p className="text-blue-600">💳 PIX</p>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-gray-700">ID do Pagamento:</span>
                  <p className="text-blue-600 font-mono text-xs">{purchaseData.payment_id}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <span className="mr-2">✅</span>
                Verificação automática ativa
              </h4>
              <p className="text-sm text-green-700 mb-3">
                Estamos verificando seu pagamento automaticamente. A página será atualizada assim que o PIX for confirmado.
              </p>
              <div className="bg-white p-3 rounded-lg border border-green-300">
                <p className="font-semibold text-green-800 mb-2">🕐 Tempo de processamento:</p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• PIX instantâneo: 1-3 minutos</li>
                  <li>• PIX programado: até 30 minutos</li>
                  <li>• Confirmação automática no sistema</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {purchaseData && purchaseData.error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Atenção:</h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>
                Houve um problema na confirmação automática do seu pagamento, mas isso não significa que o pagamento falhou.
              </p>
              <p>
                <strong>O que fazer:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verifique seu e-mail para confirmação do pagamento</li>
                <li>Entre em contato conosco via WhatsApp</li>
                <li>Seus números podem já estar reservados</li>
              </ul>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">🎉 Próximos Passos:</h3>
          <p className="text-sm text-blue-700 mb-3">
            Entre no grupo do WhatsApp para acompanhar o sorteio e receber atualizações importantes:
          </p>
          
          <div className="bg-white p-4 rounded-lg border border-blue-300 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-600">✅</span>
              <span className="text-sm font-medium text-gray-800">Grupo Oficial da Rifa</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1 mb-3">
              <li>• Data e hora do sorteio</li>
              <li>• Transmissão ao vivo</li>
              <li>• Resultados em tempo real</li>
              <li>• Suporte e esclarecimentos</li>
            </ul>
          </div>
          
          <a 
            href="https://chat.whatsapp.com/Jhr9CxJc1VF6WEV0j4Xmj6" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors space-x-2 mb-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>📱 Entrar no Grupo Oficial</span>
          </a>
          <p className="text-xs text-green-700 text-center">
            👆 Clique aqui para entrar no grupo do WhatsApp
          </p>
        </div>

        {/* Informações importantes */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-purple-800 mb-3 flex items-center">
            <span className="mr-2">📋</span>
            Informações Importantes
          </h3>
          
          <div className="grid gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-700 mb-1">🗓️ Data do Sorteio:</h4>
              <p className="text-gray-700">Será anunciada no grupo do WhatsApp</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-700 mb-1">📺 Transmissão:</h4>
              <p className="text-gray-700">Ao vivo no Instagram e WhatsApp</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-700 mb-1">🎁 Prêmio:</h4>
              <p className="text-gray-700 font-semibold">iPhone 16 Pro Max 256GB</p>
            </div>
          </div>
        </div>

        {/* Botão de contato direto */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-orange-800 mb-2 flex items-center">
            <span className="mr-2">🆘</span>
            Precisa de Ajuda?
          </h3>
          <p className="text-sm text-orange-700 mb-3">
            Entre em contato direto se tiver alguma dúvida ou problema:
          </p>
          <a 
            href="https://wa.me/5511999999999?text=Olá!%20Fiz%20uma%20compra%20na%20rifa%20do%20iPhone%2016%20Pro%20Max%20e%20preciso%20de%20ajuda.%20Meu%20número%20de%20pedido%20é:%20"
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>💬 Suporte Direto</span>
          </a>
          <p className="text-xs text-orange-600 mt-2 text-center">
            Resposta rápida e personalizada
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
