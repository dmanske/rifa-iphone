
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
    
    // Configurar cores melhoradas para legibilidade
    const primaryColor = [59, 130, 246]; // blue-600
    const secondaryColor = [34, 197, 94]; // green-500
    const textColor = [31, 41, 55]; // gray-800
    const lightGray = [248, 250, 252]; // gray-100
    
    // Cabeçalho melhorado
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Título maior e mais visível
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Vendas', 105, 25, { align: 'center' });
    
    // Data em fonte maior
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 40, { align: 'center' });
    
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

    // Seção de estatísticas com layout melhorado
    const statsY = 60;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(10, statsY, 190, 70, 'F');
    
    // Título da seção maior
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('📊 Resumo Executivo', 20, statsY + 20);
    
    // Estatísticas em fonte maior e melhor organizadas
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Coluna da esquerda
    doc.text(`Total de Compras: ${totalCompras}`, 20, statsY + 35);
    doc.text(`Pagamentos Confirmados: ${totalPago.length}`, 20, statsY + 48);
    doc.text(`Pendentes: ${totalPendente.length}`, 20, statsY + 61);
    
    // Coluna da direita
    doc.setFont('helvetica', 'bold');
    doc.text(`💰 Total Arrecadado: R$ ${totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 110, statsY + 35);
    doc.setFont('helvetica', 'normal');
    doc.text(`💳 PIX: R$ ${totalPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 110, statsY + 48);
    doc.text(`🏦 Cartão: R$ ${totalCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 110, statsY + 61);

    // Título da tabela
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('📋 Detalhamento das Transações', 20, 145);

    // Preparar dados da tabela com melhor formatação
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

    // Tabela com design melhorado e mais legível
    autoTable(doc, {
      head: [['Nome', 'Email', 'Números', 'Valor', 'Método', 'Status', 'Data']],
      body: tableData,
      startY: 155,
      styles: { 
        fontSize: 12, // Fonte maior
        cellPadding: 5, // Mais espaçamento
        textColor: textColor,
        lineColor: [200, 200, 200],
        lineWidth: 0.2
      },
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 13
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Nome
        1: { cellWidth: 45 }, // Email
        2: { cellWidth: 25 }, // Números
        3: { cellWidth: 22 }, // Valor
        4: { cellWidth: 18 }, // Método
        5: { cellWidth: 20 }, // Status
        6: { cellWidth: 25 }  // Data
      },
      didParseCell: function(data: any) {
        // Colorir status com cores mais vibrantes
        if (data.column.index === 5) { // coluna status
          if (data.cell.text[0] === 'PAGO') {
            data.cell.styles.textColor = [22, 163, 74]; // green-600
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'PENDENTE') {
            data.cell.styles.textColor = [217, 119, 6]; // yellow-600
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0] === 'CANCELADO') {
            data.cell.styles.textColor = [220, 38, 38]; // red-600
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Rodapé melhorado
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 285, 190, 285);
      
      doc.text(`Página ${i} de ${pageCount}`, 105, 292, { align: 'center' });
      doc.text('Sistema de Rifas - Relatório Gerado Automaticamente', 105, 297, { align: 'center' });
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
