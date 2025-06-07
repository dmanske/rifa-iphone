
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export const generateModernPDFReport = (filteredPurchases: Purchase[]) => {
  try {
    console.log('Iniciando geração do PDF com', filteredPurchases.length, 'compras');
    
    const doc = new jsPDF();
    
    // Configurar cores (RGB values)
    const primaryColor = [59, 130, 246] as const; // blue-600
    const secondaryColor = [34, 197, 94] as const; // green-500
    const textColor = [31, 41, 55] as const; // gray-800
    const lightGray = [249, 250, 251] as const; // gray-50
    
    // Cabeçalho com cores
    doc.setFillColor(...primaryColor);
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
    doc.setTextColor(...textColor);
    
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
    doc.setFillColor(...lightGray);
    doc.rect(10, statsY, 190, 50, 'F');
    
    // Título da seção
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('📊 Resumo Executivo', 20, statsY + 15);
    
    // Estatísticas
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    
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
      p.nome || 'N/A',
      p.email || 'N/A',
      p.numeros_comprados?.slice(0, 3).join(', ') + (p.numeros_comprados?.length > 3 ? '...' : '') || 'N/A',
      `R$ ${Number(p.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      p.metodo_pagamento === 'pix' ? 'PIX' : 'Cartão',
      (p.status || 'N/A').toUpperCase(),
      new Date(p.data_transacao).toLocaleDateString('pt-BR')
    ]);

    console.log('Dados da tabela preparados:', tableData.length, 'linhas');

    // Usar autoTable corretamente
    autoTable(doc, {
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

    const fileName = `relatorio_vendas_${new Date().toISOString().split('T')[0]}.pdf`;
    console.log('Salvando PDF:', fileName);
    doc.save(fileName);
    
    console.log('PDF gerado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};
