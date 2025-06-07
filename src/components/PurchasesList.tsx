import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, X, Download, Eye, EyeOff, Receipt } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Purchase | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
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
    console.log('Dados do comprovante:', purchase.dados_comprovante);
    console.log('QR Code Base64:', purchase.qr_code_base64);
    console.log('Comprovante URL:', purchase.comprovante_url);
    setSelectedTransaction(purchase);
    setShowProofModal(true);
  };

  const exportToCSV = () => {
    const csvContent = [
      "Nome,Email,Telefone,Números,Valor Total,Método,Status,Data,Comprovante URL,MP Payment ID",
      ...purchases.map(p => 
        `"${p.nome}","${p.email}","${p.telefone || ''}","${p.numeros_comprados.join(', ')}","${p.valor_total}","${p.metodo_pagamento}","${p.status}","${new Date(p.data_transacao).toLocaleString('pt-BR')}","${p.comprovante_url || ''}","${p.mercadopago_payment_id || ''}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `compras_rifa_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchPurchases();

    // Configurar realtime updates
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
    
    console.log(`Verificando comprovante para ${purchase.id}:`, {
      status: purchase.status,
      metodo: purchase.metodo_pagamento,
      isPaid,
      isPixPayment,
      mercadopago_payment_id: purchase.mercadopago_payment_id
    });
    
    return isPixPayment && isPaid;
  };

  const totalVendido = purchases
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + Number(p.valor_total), 0);

  const totalPix = purchases
    .filter(p => p.status === 'pago' && p.metodo_pagamento === 'pix')
    .reduce((sum, p) => sum + Number(p.valor_total), 0);

  const totalCartao = purchases
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
          <div className="text-2xl font-bold text-blue-600">{purchases.length}</div>
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
            R$ {totalPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Lista de Compras ({purchases.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showSensitiveData ? 'Ocultar' : 'Mostrar'} Dados</span>
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
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
                <TableHead>Comprovante</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
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
                    {hasPixProof(purchase) ? (
                      <button
                        onClick={() => handleViewProof(purchase)}
                        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Ver</span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {purchase.status === 'pago' && purchase.metodo_pagamento === 'pix' ? 'Processando...' : 'N/A'}
                      </span>
                    )}
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
        
        {purchases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma compra encontrada.
          </div>
        )}
      </div>

      {/* PIX Proof Modal */}
      {selectedTransaction && (
        <PixProofModal
          isOpen={showProofModal}
          onClose={() => {
            console.log('Fechando modal de comprovante');
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
