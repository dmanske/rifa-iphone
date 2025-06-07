
import React from 'react';
import { CheckCircle, Clock, X, Receipt, ExternalLink } from 'lucide-react';
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

interface PurchasesTableProps {
  purchases: Purchase[];
  showSensitiveData: boolean;
  onViewProof: (purchase: Purchase) => void;
  onViewOriginalProof: (purchase: Purchase) => void;
  onUpdatePaymentStatus: (purchaseId: string, status: 'pago' | 'cancelado') => void;
}

const PurchasesTable: React.FC<PurchasesTableProps> = ({
  purchases,
  showSensitiveData,
  onViewProof,
  onViewOriginalProof,
  onUpdatePaymentStatus
}) => {
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

  return (
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
                  <div className="flex gap-1">
                    {hasPixProof(purchase) && (
                      <button
                        onClick={() => onViewProof(purchase)}
                        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>PIX</span>
                      </button>
                    )}
                    {hasOriginalProof(purchase) && (
                      <button
                        onClick={() => onViewOriginalProof(purchase)}
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
                        onClick={() => onUpdatePaymentStatus(purchase.id, 'pago')}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => onUpdatePaymentStatus(purchase.id, 'cancelado')}
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
  );
};

export default PurchasesTable;
