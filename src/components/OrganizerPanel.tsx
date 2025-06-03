
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, DollarSign, Trophy, Download, Mail, FileText, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrganizerPanelProps {
  onBack: () => void;
}

interface Purchase {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  numbers: number[];
  total_amount: number;
  payment_method: string;
  purchase_date: string;
  status: string;
}

const OrganizerPanel: React.FC<OrganizerPanelProps> = ({ onBack }) => {
  const { isOrganizer } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pix' | 'card'>('all');

  useEffect(() => {
    if (!isOrganizer) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar o painel do organizador",
        variant: "destructive"
      });
      onBack();
      return;
    }

    fetchPurchases();
  }, [isOrganizer, onBack, toast]);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar compras:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as informações das compras",
          variant: "destructive"
        });
        return;
      }

      setPurchases(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const filteredPurchases = filter === 'all' 
      ? purchases 
      : purchases.filter(p => p.payment_method === filter);

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Nome,Email,Telefone,Números,Valor Pago,Método Pagamento,Data Compra\n"
      + filteredPurchases.map(p => 
          `"${p.full_name}","${p.email}","${p.phone || ''}","${p.numbers.join(', ')}","R$ ${p.total_amount}","${p.payment_method === 'pix' ? 'Pix' : 'Cartão'}","${new Date(p.purchase_date).toLocaleDateString('pt-BR')}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_rifa_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório exportado",
      description: "O arquivo CSV foi baixado com sucesso"
    });
  };

  if (!isOrganizer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta área</p>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const filteredPurchases = filter === 'all' 
    ? purchases 
    : purchases.filter(p => p.payment_method === filter);

  const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.total_amount), 0);
  const totalNumbers = purchases.reduce((sum, p) => sum + p.numbers.length, 0);
  const pixPayments = purchases.filter(p => p.payment_method === 'pix').length;
  const cardPayments = purchases.filter(p => p.payment_method === 'card').length;

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
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'pix' | 'card')}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos os pagamentos</option>
                  <option value="pix">Apenas Pix</option>
                  <option value="card">Apenas Cartão</option>
                </select>
              </div>
              <button
                onClick={exportData}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exportar CSV</span>
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
                <p className="text-sm text-gray-600">Total de Compras</p>
                <p className="text-2xl font-bold text-blue-600">{purchases.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {totalNumbers} números vendidos
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
              Valor bruto arrecadado
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pagamentos Pix</p>
                <p className="text-2xl font-bold text-green-600">{pixPayments}</p>
              </div>
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">PIX</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {((pixPayments / purchases.length) * 100 || 0).toFixed(1)}% do total
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pagamentos Cartão</p>
                <p className="text-2xl font-bold text-blue-600">{cardPayments}</p>
              </div>
              <Trophy className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {((cardPayments / purchases.length) * 100 || 0).toFixed(1)}% do total
            </div>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Compradores ({filteredPurchases.length})
              </h3>
              <div className="text-sm text-gray-600">
                Total mostrado: R$ {filteredPurchases.reduce((sum, p) => sum + Number(p.total_amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Números</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {filter === 'all' 
                        ? 'Nenhuma compra realizada ainda' 
                        : `Nenhuma compra com ${filter === 'pix' ? 'Pix' : 'Cartão'} encontrada`
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.full_name}</TableCell>
                      <TableCell>{purchase.email}</TableCell>
                      <TableCell>{purchase.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {purchase.numbers.map((number) => (
                            <span
                              key={number}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                            >
                              {number.toString().padStart(3, '0')}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {Number(purchase.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          purchase.payment_method === 'pix' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {purchase.payment_method === 'pix' ? 'Pix' : 'Cartão'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(purchase.purchase_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={exportData}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Relatório Detalhado</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
              <Mail className="w-4 h-4" />
              <span>Enviar Comunicado</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
              <Trophy className="w-4 h-4" />
              <span>Gerenciar Rifa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerPanel;
