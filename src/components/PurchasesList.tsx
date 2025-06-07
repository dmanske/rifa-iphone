import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, X, Download, Eye, EyeOff, Receipt, Search, FileText, ExternalLink } from 'lucide-react';
import { Input } from "@/components/ui/input";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PixProofModal from './PixProofModal';

interface Purchase {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  numeros_comprados: number[];
  valor_total: number;
  metodo_pagamento: string;
  data_transacao: string;
  data_pagamento: string | null;
  data_aprovacao_pix: string | null;
  status: 'pago' | 'pendente' | 'processando' | 'cancelado' | 'expirado';
  comprovante_url: string | null;
  qr_code_pix: string | null;
  qr_code_base64: string | null;
  mercadopago_payment_id: string | null;
  dados_comprovante: any;
}

const PurchasesList: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Purchase | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('data_transacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar compras:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as compras.",
          variant: "destructive"
        });
        return;
      }

      setPurchases(data || []);
      setFilteredPurchases(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar as compras.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (purchaseId: string, newStatus: 'pago' | 'cancelado') => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', purchaseId);

      if (error) {
        throw error;
      }

      setPurchases(prev => 
        prev.map(purchase => 
          purchase.id === purchaseId 
            ? { ...purchase, status: newStatus }
            : purchase
        )
      );

      setFilteredPurchases(prev => 
        prev.map(purchase => 
          purchase.id === purchaseId 
            ? { ...purchase, status: newStatus }
            : purchase
        )
      );

      toast({
        title: "Status atualizado",
        description: `Pagamento marcado como ${newStatus}.`,
      });

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pagamento.",
        variant: "destructive"
      });
    }
  };

  const handleViewProof = (purchase: Purchase) => {
    console.log('Visualizando comprovante para:', purchase);
    setSelectedTransaction(purchase);
    setShowProofModal(true);
  };

  const handleViewOriginalProof = (purchase: Purchase) => {
    if (purchase.mercadopago_payment_id) {
      const originalProofUrl = `https://www.mercadopago.com.br/activities/payment?id=${purchase.mercadopago_payment_id}`;
      window.open(originalProofUrl, '_blank');
      
      toast({
        title: "Comprovante Original",
        description: "Abrindo comprovante oficial do MercadoPago.",
      });
    } else {
      toast({
        title: "Comprovante não disponível",
        description: "ID do pagamento MercadoPago não encontrado.",
        variant: "destructive"
      });
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredPurchases(purchases);
      return;
    }

    const searchLower = term.toLowerCase().trim();
    
    const filtered = purchases.filter(purchase => {
      // Busca no nome
      if (purchase.nome?.toLowerCase().includes(searchLower)) return true;
      
      // Busca no email
      if (purchase.email?.toLowerCase().includes(searchLower)) return true;
      
      // Busca no telefone
      if (purchase.telefone && purchase.telefone.toLowerCase().includes(searchLower)) return true;
      
      // Busca nos números comprados
      if (purchase.numeros_comprados && purchase.numeros_comprados.some(num => 
        num.toString().includes(term) || 
        num.toString().padStart(3, '0').includes(term)
      )) return true;
      
      // Busca no status
      if (purchase.status?.toLowerCase().includes(searchLower)) return true;
      
      // Busca no método de pagamento
      if (purchase.metodo_pagamento?.toLowerCase().includes(searchLower)) return true;
      
      // Busca no valor
      if (purchase.valor_total?.toString().includes(term)) return true;
      
      // Busca no ID da transação
      if (purchase.id?.toLowerCase().includes(searchLower)) return true;
      
      // Busca no ID do MercadoPago
      if (purchase.mercadopago_payment_id && purchase.mercadopago_payment_id.includes(term)) return true;
      
      return false;
    });
    
    setFilteredPurchases(filtered);
  };

  const generateModernPDFReport = () => {
    const doc = new jsPDF();
    
    // Configurar cores (RGB values)
    const primaryColor = [59, 130, 246]; // blue-600
    const secondaryColor = [34, 197, 94]; // green-500
    const textColor = [31, 41, 55]; // gray-800
    const lightGray = [249, 250, 251]; // gray-50
    
    // Cabeçalho com cores
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Título em branco
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Completo de Vendas', 20, 25);
    
    // Data em branco menor
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 35);
    
    // Resetar cor do texto
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Calcular estatísticas
    const totalCompras = filteredPurchases.length;
    const totalPago = filteredPurchases.filter(p => p.status === 'pago');
    const totalPendente = filteredPurchases.filter(p => p.status === 'pendente');
    const totalCancelado = filteredPurchases.filter(p => p.status === 'cancelado');
    
    const totalVendido = totalPago.reduce((sum, p) => sum + Number(p.valor_total), 0);
    const totalPix = filteredPurchases
      .filter(p => p.status === 'pago' && p.metodo_pagamento === 'pix')
      .reduce((sum, p) => sum + Number(p.valor_total), 0);
    const totalCartao = filteredPurchases
      .filter(p => p.status === 'pago' && p.metodo_pagamento === 'cartao')
      .reduce((sum, p) => sum + Number(p.valor_total), 0);

    // Seção de estatísticas com fundo colorido
    const statsY = 50;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(10, statsY, 190, 50, 'F');
    
    // Título da seção
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('📊 Resumo Executivo', 20, statsY + 15);
    
    // Estatísticas
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    const stats = [
      `Total de Compras: ${totalCompras}`,
      `Pagamentos Confirmados: ${totalPago.length}`,
      `Pendentes: ${totalPendente.length}`,
      `Cancelados: ${totalCancelado.length}`,
      `💰 Total Arrecadado: R$ ${totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `💳 PIX: R$ ${totalPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `🏦 Cartão: R$ ${totalCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ];
    
    stats.forEach((stat, index) => {
      const x = index < 4 ? 20 : 110;
      const y = statsY + 25 + ((index % 4) * 7);
      doc.text(stat, x, y);
    });

    // Tabela de transações moderna
    const tableData = filteredPurchases.map(p => [
      p.nome,
      p.email,
      p.numeros_comprados.slice(0, 3).join(', ') + (p.numeros_comprados.length > 3 ? '...' : ''),
      `R$ ${Number(p.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      p.metodo_pagamento === 'pix' ? 'PIX' : 'Cartão',
      p.status.toUpperCase(),
      new Date(p.data_transacao).toLocaleDateString('pt-BR')
    ]);

    (doc as any).autoTable({
      head: [['Nome', 'Email', 'Números', 'Valor', 'Método', 'Status', 'Data']],
      body: tableData,
      startY: 110,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        textColor: textColor
      },
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      didParseCell: function(data: any) {
        // Colorir status
        if (data.column.index === 5) { // coluna status
          if (data.cell.text[0] === 'PAGO') {
            data.cell.styles.textColor = secondaryColor;
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'PENDENTE') {
            data.cell.styles.textColor = [234, 179, 8]; // yellow-500
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'CANCELADO') {
            data.cell.styles.textColor = [239, 68, 68]; // red-500
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('Gerado automaticamente pelo Sistema de Rifas', 105, 295, { align: 'center' });
    }

    doc.save(`relatorio_vendas_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF Gerado com Sucesso! 🎉",
      description: "Relatório moderno e colorido foi baixado.",
    });
  };

  useEffect(() => {
    fetchPurchases();

    const channel = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          fetchPurchases();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [purchases, searchTerm]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pendente':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'cancelado':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasPixProof = (purchase: Purchase) => {
    const isPixPayment = purchase.metodo_pagamento === 'pix';
    const isPaid = purchase.status === 'pago';
    return isPixPayment && isPaid;
  };

  const hasOriginalProof = (purchase: Purchase) => {
    return purchase.mercadopago_payment_id && purchase.status === 'pago';
  };

  const totalVendido = filteredPurchases
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + Number(p.valor_total), 0);

  const totalPix = filteredPurchases
    .filter(p => p.status === 'pago' && p.metodo_pagamento === 'pix')
    .reduce((sum, p) => sum + Number(p.valor_total), 0);

  const totalCartao = filteredPurchases
    .filter(p => p.status === 'pago' && p.metodo_pagamento === 'cartao')
    .reduce((sum, p) => sum + Number(p.valor_total), 0);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Carregando compras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{filteredPurchases.length}</div>
          <div className="text-sm text-gray-600">Total de Compras</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-green-600">
            R$ {totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-gray-600">Total Arrecadado</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-green-600">
            R$ {totalPix.toLocaleString('pt-BR', { minimumFraction Digits: 2 })}
          </div>
          <div className="text-sm text-gray-600">Total Pix</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">
            R$ {totalCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-gray-600">Total Cartão</div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por nome, email, telefone, números, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showSensitiveData ? 'Ocultar' : 'Mostrar'} Dados</span>
          </button>
          
          <button
            onClick={generateModernPDFReport}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Moderno</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lista de Compras ({filteredPurchases.length} {searchTerm ? 'filtradas' : 'total'})
        </h3>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprador</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Números</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Comprovantes</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {showSensitiveData ? purchase.nome : '***'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-gray-900">
                        {showSensitiveData ? purchase.email : '***@***.com'}
                      </div>
                      {purchase.telefone && (
                        <div className="text-gray-600">
                          {showSensitiveData ? purchase.telefone : '(**) ****-****'}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {purchase.numeros_comprados.map((numero) => (
                        <span
                          key={numero}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                        >
                          {numero.toString().padStart(3, '0')}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      R$ {Number(purchase.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      purchase.metodo_pagamento === 'pix' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {purchase.metodo_pagamento === 'pix' ? 'Pix' : 'Cartão'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(purchase.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                        {purchase.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">
                      {new Date(purchase.data_transacao).toLocaleString('pt-BR')}
                    </div>
                    {purchase.data_aprovacao_pix && (
                      <div className="text-xs text-green-600">
                        Aprovado: {new Date(purchase.data_aprovacao_pix).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {hasPixProof(purchase) && (
                        <button
                          onClick={() => handleViewProof(purchase)}
                          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>PIX</span>
                        </button>
                      )}
                      {hasOriginalProof(purchase) && (
                        <button
                          onClick={() => handleViewOriginalProof(purchase)}
                          className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Original</span>
                        </button>
                      )}
                      {!hasPixProof(purchase) && !hasOriginalProof(purchase) && (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {purchase.status === 'pendente' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => updatePaymentStatus(purchase.id, 'pago')}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => updatePaymentStatus(purchase.id, 'cancelado')}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredPurchases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Nenhuma compra encontrada para a busca.' : 'Nenhuma compra encontrada.'}
          </div>
        )}
      </div>

      {/* PIX Proof Modal */}
      {selectedTransaction && (
        <PixProofModal
          isOpen={showProofModal}
          onClose={() => {
            setShowProofModal(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
};

export default PurchasesList;
