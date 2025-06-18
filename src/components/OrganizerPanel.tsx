
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, DollarSign, Trophy, Shuffle, Download, Mail, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PurchasesList from './PurchasesList';
import AdminPaymentManager from './AdminPaymentManager';

interface OrganizerPanelProps {
  onBack: () => void;
}

type TabType = 'overview' | 'payments' | 'purchases';

const OrganizerPanel: React.FC<OrganizerPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [soldNumbers, setSoldNumbers] = useState<number[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Buscar transações confirmadas (vendas)
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('numeros_comprados, valor_total, status');

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return;
      }

      const allSoldNumbers: number[] = [];
      let revenue = 0;
      let pending = 0;

      transactions?.forEach(transaction => {
        if (transaction.status === 'pago' && transaction.numeros_comprados) {
          allSoldNumbers.push(...transaction.numeros_comprados);
          revenue += Number(transaction.valor_total);
        } else if (transaction.status === 'pendente') {
          pending++;
        }
      });

      setSoldNumbers(allSoldNumbers);
      setTotalRevenue(revenue);
      setPendingCount(pending);
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDraw = async () => {
    if (soldNumbers.length === 0) {
      toast({
        title: "Erro",
        description: "Não há números vendidos para realizar o sorteio.",
        variant: "destructive"
      });
      return;
    }
    
    setIsDrawing(true);
    setWinner(null);

    // Simular sorteio com animação
    let counter = 0;
    const interval = setInterval(() => {
      const randomNumber = soldNumbers[Math.floor(Math.random() * soldNumbers.length)];
      setWinner(randomNumber);
      counter++;
      
      if (counter >= 20) {
        clearInterval(interval);
        setIsDrawing(false);
        
        toast({
          title: "Sorteio realizado!",
          description: `O número vencedor é ${randomNumber.toString().padStart(3, '0')}!`,
        });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando painel...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Painel do Organizador</h1>
                <p className="text-gray-600">Sistema de reserva manual - PIX: 47 9 8833-6386</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDraw}
                disabled={isDrawing || soldNumbers.length === 0}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors font-semibold disabled:cursor-not-allowed"
              >
                <Shuffle className="w-4 h-4" />
                <span>{isDrawing ? 'Sorteando...' : 'Realizar Sorteio'}</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Confirmação de Pagamentos</span>
                {pendingCount > 0 && (
                  <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'purchases'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Histórico Completo
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Números Vendidos</p>
                    <p className="text-2xl font-bold text-blue-600">{soldNumbers.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  de 130 disponíveis ({((soldNumbers.length / 130) * 100).toFixed(1)}%)
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Receita Confirmada</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Meta: R$ 13.000 (100%)
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pagamentos Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  aguardando confirmação
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-bold text-purple-600">
                      {winner ? 'Sorteado' : 'Ativa'}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full ${winner ? 'bg-purple-600' : 'bg-green-500'} flex items-center justify-center`}>
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Winner Display */}
            {(winner || isDrawing) && (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-2xl mb-8 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">
                  {isDrawing ? 'Sorteando...' : 'Número Vencedor!'}
                </h2>
                <div className={`text-6xl font-bold mb-4 ${isDrawing ? 'animate-pulse' : ''}`}>
                  {winner ? winner.toString().padStart(3, '0') : '000'}
                </div>
                {!isDrawing && winner && (
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 inline-block">
                    <p className="text-lg">
                      Parabéns ao portador do número {winner}!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistema PIX Manual</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-blue-800 font-medium">PIX: 47 9 8833-6386</p>
                <p className="text-blue-600 text-sm">
                  Clientes fazem PIX para esta chave e você confirma manualmente na aba "Confirmação de Pagamentos"
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setActiveTab('payments')}
                  className="flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Confirmar Pagamentos ({pendingCount})</span>
                </button>
                
                <button className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Relatório Completo</span>
                </button>
                
                <button className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
                  <Trophy className="w-4 h-4" />
                  <span>Finalizar Rifa</span>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'payments' && (
          <AdminPaymentManager />
        )}

        {activeTab === 'purchases' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <PurchasesList />
          </div>
        )}

      </div>
    </div>
  );
};

export default OrganizerPanel;
