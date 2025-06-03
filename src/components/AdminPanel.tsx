
import React, { useState } from 'react';
import { ArrowLeft, Users, DollarSign, Trophy, Shuffle, Download, Mail } from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  // Dados simulados (integrar com Supabase depois)
  const soldNumbers = [1, 5, 12, 23, 34, 45, 67, 89, 100, 115];
  const totalRevenue = soldNumbers.length * 100;
  const participants = [
    { number: 1, name: 'João Silva', email: 'joao@email.com', phone: '(11) 99999-9999', paymentMethod: 'pix' },
    { number: 5, name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 88888-8888', paymentMethod: 'card' },
    { number: 12, name: 'Pedro Costa', email: 'pedro@email.com', phone: '(11) 77777-7777', paymentMethod: 'pix' },
    // ... mais participantes
  ];

  const handleDraw = async () => {
    if (soldNumbers.length === 0) return;
    
    setIsDrawing(true);
    setWinner(null);

    // Simular sorteio com animação
    let counter = 0;
    const interval = setInterval(() => {
      const randomNumber = soldNumbers[Math.floor(Math.random() * soldNumbers.length)];
      setWinner(randomNumber);
      counter++;
      
      if (counter >= 20) { // Animar por 2 segundos
        clearInterval(interval);
        setIsDrawing(false);
        // Aqui você salvaria o resultado no Supabase
      }
    }, 100);
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Número,Nome,Email,Telefone,Método Pagamento\n"
      + participants.map(p => `${p.number},${p.name},${p.email},${p.phone},${p.paymentMethod}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "participantes_rifa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                onClick={exportData}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
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
                  R$ {totalRevenue.toLocaleString('pt-BR')}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Numbers Grid */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Números</h3>
            <div className="grid grid-cols-10 gap-1 max-h-64 overflow-y-auto">
              {Array.from({ length: 130 }, (_, i) => i + 1).map((number) => {
                const isSold = soldNumbers.includes(number);
                const isWinner = winner === number;
                
                return (
                  <div
                    key={number}
                    className={`
                      aspect-square rounded text-xs font-semibold flex items-center justify-center
                      ${isWinner ? 'bg-purple-600 text-white animate-pulse' : 
                        isSold ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}
                    `}
                  >
                    {number}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Vendido</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                  <span>Disponível</span>
                </div>
                {winner && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-600 rounded"></div>
                    <span>Vencedor</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Participants List */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Participantes</h3>
              <span className="text-sm text-gray-600">{participants.length} pessoas</span>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {participants.map((participant, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`
                        w-8 h-8 rounded-lg font-semibold text-sm flex items-center justify-center text-white
                        ${participant.number === winner ? 'bg-purple-600' : 'bg-blue-600'}
                      `}>
                        {participant.number}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{participant.name}</div>
                        <div className="text-sm text-gray-600">{participant.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${participant.paymentMethod === 'pix' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                      `}>
                        {participant.paymentMethod === 'pix' ? 'Pix' : 'Cartão'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{participant.phone}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

export default AdminPanel;
