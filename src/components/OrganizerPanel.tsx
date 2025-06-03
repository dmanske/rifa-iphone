
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, DollarSign, Trophy, Download, Mail, FileText, Filter, CreditCard, Smartphone, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  const confirmPayment = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ status: 'confirmed' })
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: "Pagamento confirmado",
        description: "O pagamento foi confirmado com sucesso"
      });

      fetchPurchases();
    } catch (error) {
      toast({
        title: "Erro ao confirmar pagamento",
        description: "Não foi possível confirmar o pagamento",
        variant: "destructive"
      });
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.text('Relatório de Compras - Rifa iPhone 16 Pro Max', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45);
    
    // Estatísticas
    const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.total_amount), 0);
    const totalNumbers = purchases.reduce((sum, p) => sum + p.numbers.length, 0);
    const pixPayments = purchases.filter(p => p.payment_method === 'pix');
    const cardPayments = purchases.filter(p => p.payment_method === 'card');
    
    doc.text(`Total de Compras: ${purchases.length}`, 20, 60);
    doc.text(`Total de Números Vendidos: ${totalNumbers}`, 20, 70);
    doc.text(`Receita Total: R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 80);
    doc.text(`Pagamentos Pix: ${pixPayments.length} (R$ ${pixPayments.reduce((sum, p) => sum + Number(p.total_amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`, 20, 90);
    doc.text(`Pagamentos Cartão: ${cardPayments.length} (R$ ${cardPayments.reduce((sum, p) => sum + Number(p.total_amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`, 20, 100);

    // Tabela de compras
    const tableData = purchases.map(purchase => [
      purchase.full_name,
      purchase.email,
      purchase.phone || '-',
      purchase.numbers.map(n => n.toString().padStart(3, '0')).join(', '),
      `R$ ${Number(purchase.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      purchase.payment_method === 'pix' ? 'Pix' : 'Cartão',
      new Date(purchase.purchase_date).toLocaleDateString('pt-BR'),
      purchase.status === 'confirmed' ? 'Confirmado' : 'Pendente'
    ]);

    autoTable(doc, {
      head: [['Nome', 'E-mail', 'Telefone', 'Números', 'Valor', 'Pagamento', 'Data', 'Status']],
      body: tableData,
      startY: 120,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`relatorio-rifa-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);

    toast({
      title: "PDF gerado com sucesso",
      description: "O relatório foi baixado para seu dispositivo"
    });
  };

  const exportData = () => {
    const filteredPurchases = filter === 'all' 
      ? purchases 
      : purchases.filter(p => p.payment_method === filter);

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Nome,Email,Telefone,Números,Valor Pago,Método Pagamento,Data Compra,Status\n"
      + filteredPurchases.map(p => 
          `"${p.full_name}","${p.email}","${p.phone || ''}","${p.numbers.join(', ')}","R$ ${p.total_amount}","${p.payment_method === 'pix' ? 'Pix' : 'Cartão'}","${new Date(p.purchase_date).toLocaleDateString('pt-BR')}","${p.status === 'confirmed' ? 'Confirmado' : 'Pendente'}"`
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta área</p>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const filteredPurchases = filter === 'all' 
    ? purchases 
    : purchases.filter(p => p.payment_method === filter);

  const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.total_amount), 0);
  const totalNumbers = purchases.reduce((sum, p) => sum + p.numbers.length, 0);
  const pixPayments = purchases.filter(p => p.payment_method === 'pix');
  const cardPayments = purchases.filter(p => p.payment_method === 'card');
  const pixRevenue = pixPayments.reduce((sum, p) => sum + Number(p.total_amount), 0);
  const cardRevenue = cardPayments.reduce((sum, p) => sum + Number(p.total_amount), 0);
  const pendingPayments = purchases.filter(p => p.status === 'completed' && p.payment_method === 'pix').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Moderno */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard do Organizador</h1>
                <p className="text-gray-600 mt-1">Gerencie sua rifa do iPhone 16 Pro Max</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'pix' | 'card')}
                  className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">Todos os pagamentos</option>
                  <option value="pix">Apenas Pix</option>
                  <option value="card">Apenas Cartão</option>
                </select>
              </div>
              <button
                onClick={generatePDF}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors font-semibold"
              >
                <FileText className="w-4 h-4" />
                <span>Gerar PDF</span>
              </button>
              <button
                onClick={exportData}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Cards de Estatísticas Modernos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total de Compras</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{purchases.length}</p>
                <p className="text-xs text-gray-500 mt-1">{totalNumbers} números vendidos</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Receita Total</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">Valor bruto arrecadado</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pagamentos Pix</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{pixPayments.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  R$ {pixRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pagamentos Cartão</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{cardPayments.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  R$ {cardRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerta de Pagamentos Pendentes */}
        {pendingPayments > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">
                  {pendingPayments} pagamento(s) Pix aguardando confirmação
                </p>
                <p className="text-yellow-700 text-sm">
                  Confirme os pagamentos recebidos para atualizar o status
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Compras Moderna */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
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
                <TableRow className="border-gray-100">
                  <TableHead className="font-semibold">Comprador</TableHead>
                  <TableHead className="font-semibold">Contato</TableHead>
                  <TableHead className="font-semibold">Números</TableHead>
                  <TableHead className="font-semibold">Pagamento</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      {filter === 'all' 
                        ? 'Nenhuma compra realizada ainda' 
                        : `Nenhuma compra com ${filter === 'pix' ? 'Pix' : 'Cartão'} encontrada`
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id} className="border-gray-50 hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-semibold text-gray-900">{purchase.full_name}</div>
                          <div className="text-sm text-gray-600">{purchase.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {purchase.phone ? (
                            <span className="text-gray-900">{purchase.phone}</span>
                          ) : (
                            <span className="text-gray-400">Não informado</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {purchase.numbers.map((number) => (
                            <span
                              key={number}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium"
                            >
                              {number.toString().padStart(3, '0')}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                            purchase.payment_method === 'pix' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {purchase.payment_method === 'pix' ? (
                              <Smartphone className="w-3 h-3" />
                            ) : (
                              <CreditCard className="w-3 h-3" />
                            )}
                            <span>{purchase.payment_method === 'pix' ? 'Pix' : 'Cartão'}</span>
                          </span>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              R$ {Number(purchase.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(purchase.purchase_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                          purchase.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {purchase.status === 'confirmed' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{purchase.status === 'confirmed' ? 'Confirmado' : 'Pendente'}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        {purchase.status === 'completed' && purchase.payment_method === 'pix' && (
                          <button
                            onClick={() => confirmPayment(purchase.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                          >
                            Confirmar Pix
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={generatePDF}
              className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-colors font-semibold"
            >
              <FileText className="w-4 h-4" />
              <span>Gerar Relatório PDF</span>
            </button>
            
            <button 
              onClick={exportData}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-colors font-semibold"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors font-semibold">
              <Mail className="w-4 h-4" />
              <span>Enviar Comunicado</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerPanel;
