
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PixProofModal from './PixProofModal';
import PurchasesStats from './purchases/PurchasesStats';
import PurchasesControls from './purchases/PurchasesControls';
import PurchasesTable from './purchases/PurchasesTable';
import { generateModernPDFReport } from '@/utils/pdfGenerator';
import { searchPurchases } from '@/utils/purchaseSearch';

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
    const filtered = searchPurchases(purchases, term);
    setFilteredPurchases(filtered);
  };

  const handleGeneratePDF = () => {
    generateModernPDFReport(filteredPurchases);
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
      <PurchasesStats
        totalPurchases={filteredPurchases.length}
        totalVendido={totalVendido}
        totalPix={totalPix}
        totalCartao={totalCartao}
      />

      <PurchasesControls
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        showSensitiveData={showSensitiveData}
        onToggleSensitiveData={() => setShowSensitiveData(!showSensitiveData)}
        onGeneratePDF={handleGeneratePDF}
      />

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lista de Compras ({filteredPurchases.length} {searchTerm ? 'filtradas' : 'total'})
        </h3>
      </div>

      <PurchasesTable
        purchases={filteredPurchases}
        showSensitiveData={showSensitiveData}
        onViewProof={handleViewProof}
        onViewOriginalProof={handleViewOriginalProof}
        onUpdatePaymentStatus={updatePaymentStatus}
      />

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
