
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, X, Download, Eye, EyeOff } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Purchase {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  numeros_comprados: number[];
  valor_pago: number;
  metodo_pagamento: 'pix' | 'cartao';
  data_compra: string;
  status_pagamento: 'pago' | 'pendente' | 'cancelado';
}

const PurchasesList: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const { toast } = useToast();

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('raffle_purchases')
        .select('*')
        .order('data_compra', { ascending: false });

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

  const updatePaymentStatus = async (purchaseId: string, newStatus: 'pago' | 'pendente' | 'cancelado') => {
    try {
      const { error } = await supabase
        .from('raffle_purchases')
        .update({ status_pagamento: newStatus })
        .eq('id', purchaseId);

      if (error) {
        throw error;
      }

      setPurchases(prev => 
        prev.map(purchase => 
          purchase.id === purchaseId 
            ? { ...purchase, status_pagamento: newStatus }
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

  const exportToCSV = () => {
    const csvContent = [
      "Nome,Email,Telefone,Números,Valor Pago,Método,Status,Data",
      ...purchases.map(p => 
        `"${p.nome}","${p.email}","${p.telefone || ''}","${p.numeros_comprados.join(', ')}","${p.valor_pago}","${p.metodo_pagamento}","${p.status_pagamento}","${new Date(p.data_compra).toLocaleString('pt-BR')}"`
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
      .channel('raffle_purchases_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'raffle_purchases'
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

  const totalVendido = purchases
    .filter(p => p.status_pagamento === 'pago')
    .reduce((sum, p) => sum + p.valor_pago, 0);

  const totalPix = purchases
    .filter(p => p.status_pagamento === 'pago' && p.metodo_pagamento === 'pix')
    .reduce((sum, p) => sum + p.valor_pago, 0);

  const totalCartao = purchases
    .filter(p => p.status_pagamento === 'pago' && p.metodo_pagamento === 'cartao')
    .reduce((sum, p) => sum + p.valor_pago, 0);

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
                      R$ {purchase.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                      {getStatusIcon(purchase.status_pagamento)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status_pagamento)}`}>
                        {purchase.status_pagamento}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">
                      {new Date(purchase.data_compra).toLocaleString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {purchase.status_pagamento === 'pendente' && (
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
    </div>
  );
};

export default PurchasesList;
