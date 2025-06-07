
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

export const searchPurchases = (purchases: Purchase[], searchTerm: string): Purchase[] => {
  if (!searchTerm.trim()) {
    return purchases;
  }

  const searchLower = searchTerm.toLowerCase().trim();
  
  return purchases.filter(purchase => {
    // Busca no nome
    if (purchase.nome?.toLowerCase().includes(searchLower)) return true;
    
    // Busca no email
    if (purchase.email?.toLowerCase().includes(searchLower)) return true;
    
    // Busca no telefone
    if (purchase.telefone && purchase.telefone.toLowerCase().includes(searchLower)) return true;
    
    // Busca nos números comprados
    if (purchase.numeros_comprados && purchase.numeros_comprados.some(num => 
      num.toString().includes(searchTerm) || 
      num.toString().padStart(3, '0').includes(searchTerm)
    )) return true;
    
    // Busca no status
    if (purchase.status?.toLowerCase().includes(searchLower)) return true;
    
    // Busca no método de pagamento
    if (purchase.metodo_pagamento?.toLowerCase().includes(searchLower)) return true;
    
    // Busca no valor
    if (purchase.valor_total?.toString().includes(searchTerm)) return true;
    
    // Busca no ID da transação
    if (purchase.id?.toLowerCase().includes(searchLower)) return true;
    
    // Busca no ID do MercadoPago
    if (purchase.mercadopago_payment_id && purchase.mercadopago_payment_id.includes(searchTerm)) return true;
    
    return false;
  });
};
