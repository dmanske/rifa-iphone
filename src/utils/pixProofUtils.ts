
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDateTime = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('pt-BR');
};

export const copyPixCode = (qrCodePix: string | null) => {
  if (qrCodePix) {
    navigator.clipboard.writeText(qrCodePix);
  }
};

export const handleDownloadProof = (comprovanteUrl: string | null) => {
  if (comprovanteUrl) {
    window.open(comprovanteUrl, '_blank');
  }
};

export const handleDownloadMercadoPagoProof = (mercadopagoPaymentId: string | null) => {
  if (mercadopagoPaymentId) {
    const proofUrl = `https://www.mercadopago.com.br/comprovantes/${mercadopagoPaymentId}`;
    window.open(proofUrl, '_blank');
  }
};
