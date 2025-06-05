
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, DollarSign, Trophy, Shuffle, Download, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PurchasesList from './PurchasesList';

interface OrganizerPanelProps {
  onBack: () => void;
}

const OrganizerPanel: React.FC<OrganizerPanelProps> = ({ onBack }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [soldNumbers, setSoldNumbers] = useState<number[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Buscar transações confirmadas
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('numeros_comprados, valor_total, status')
        .eq('status', 'pago');

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return;
      }

      const allSoldNumbers: number[] = [];
      let revenue = 0;

      transactions?.forEach(transaction => {
        if (transaction.numeros_comprados) {
          allSoldNumbers.push(...transaction.numeros_comprados);
        }
        revenue += Number(transaction.valor_total);
      });

      setSoldNumbers(allSoldNumbers);
      setTotalRevenue(revenue);
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
                <p className="text-gray-600">Gerencie sua rifa do iPhone 16 Pro Max</p>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
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
                <p className="text-sm text-gray-600">Receita Total</p>
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
                <p className="text-sm text-gray-600">Disponíveis</p>
                <p className="text-2xl font-bold text-orange-600">{130 - soldNumbers.length}</p>
              </div>
              <Trophy className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              números restantes
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

        {/* Purchases List */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <PurchasesList />
        </div>

        {/* Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
              <Mail className="w-4 h-4" />
              <span>Enviar Comunicado</span>
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
      </div>
    </div>
  );
};

export default OrganizerPanel;
