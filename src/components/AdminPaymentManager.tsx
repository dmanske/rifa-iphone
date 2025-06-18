
import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingTransaction {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  numeros_comprados: number[];
  valor_total: number;
  data_transacao: string;
  status: string;
}

const AdminPaymentManager: React.FC = () => {
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'pendente')
        .order('data_transacao', { ascending: false });

      if (error) throw error;

      setPendingTransactions(data || []);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações pendentes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (transactionId: string, numeros: number[]) => {
    try {
      // 1. Atualizar status da transação para 'pago'
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: 'pago',
          data_pagamento: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // 2. Finalizar venda dos números (muda status de reservado para vendido)
      const { error: finalizeError } = await supabase.rpc('finalize_sale', {
        _user_id: pendingTransactions.find(t => t.id === transactionId)?.id,
        _numeros: numeros,
        _transaction_id: transactionId
      });

      if (finalizeError) {
        console.warn('Erro no RPC finalize_sale, usando método direto:', finalizeError);
        
        // Fallback: atualizar diretamente
        const { error: directUpdateError } = await supabase
          .from('raffle_numbers')
          .update({
            status: 'vendido',
            sold_at: new Date().toISOString(),
            reserved_by: null,
            reserved_at: null,
            reservation_expires_at: null
          })
          .in('numero', numeros);

        if (directUpdateError) throw directUpdateError;
      }

      toast({
        title: "Pagamento confirmado!",
        description: `Números ${numeros.join(', ')} foram marcados como vendidos`,
      });

      // Atualizar lista
      fetchPendingTransactions();

    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o pagamento",
        variant: "destructive"
      });
    }
  };

  const handleRejectPayment = async (transactionId: string, numeros: number[]) => {
    try {
      // 1. Atualizar status da transação para 'cancelado'
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'cancelado' })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // 2. Liberar os números (voltar para disponível)
      const { error: releaseError } = await supabase
        .from('raffle_numbers')
        .update({
          status: 'disponivel',
          reserved_by: null,
          reserved_at: null,
          reservation_expires_at: null,
          sold_to: null,
          sold_at: null
        })
        .in('numero', numeros);

      if (releaseError) throw releaseError;

      toast({
        title: "Pagamento rejeitado",
        description: `Números ${numeros.join(', ')} foram liberados`,
      });

      // Atualizar lista
      fetchPendingTransactions();

    } catch (error) {
      console.error('Erro ao rejeitar pagamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o pagamento",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchPendingTransactions();

    // Realtime subscription para atualizações
    const channel = supabase
      .channel('admin_transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          fetchPendingTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Confirmação Manual de Pagamentos
        </h2>
        <button
          onClick={fetchPendingTransactions}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {pendingTransactions.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900">Tudo em dia!</h3>
          <p className="text-green-700">Não há pagamentos pendentes para confirmar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTransactions.map((transaction) => (
            <div key={transaction.id} className="bg-white border border-gray-200 rounded-xl p-6">
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-gray-900">{transaction.nome}</span>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  Pendente
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">E-mail:</p>
                  <p className="font-medium">{transaction.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telefone:</p>
                  <p className="font-medium">{transaction.telefone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Total:</p>
                  <p className="font-bold text-green-600">
                    R$ {Number(transaction.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data:</p>
                  <p className="font-medium">
                    {new Date(transaction.data_transacao).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Números Reservados:</p>
                <div className="flex flex-wrap gap-2">
                  {transaction.numeros_comprados.map(numero => (
                    <span
                      key={numero}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-medium"
                    >
                      {numero.toString().padStart(3, '0')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>PIX:</strong> 47 9 8833-6386
                </p>
                <p className="text-sm text-gray-600">
                  Cliente deve fazer PIX no valor de R$ {Number(transaction.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleConfirmPayment(transaction.id, transaction.numeros_comprados)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirmar Pagamento</span>
                </button>
                <button
                  onClick={() => handleRejectPayment(transaction.id, transaction.numeros_comprados)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Rejeitar/Liberar</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default AdminPaymentManager;
