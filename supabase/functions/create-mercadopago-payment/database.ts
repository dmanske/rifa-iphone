
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export async function createTransaction(
  paymentData: {
    user_id: string;
    numeros: number[];
    valor_total: number;
    metodo_pagamento: string;
    nome: string;
    email: string;
    telefone: string;
  }
) {
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const { data: transaction, error: transactionError } = await supabaseService
    .from('transactions')
    .insert({
      user_id: paymentData.user_id,
      payment_id: 'temp-' + Date.now(),
      numeros_comprados: paymentData.numeros,
      valor_total: paymentData.valor_total,
      metodo_pagamento: paymentData.metodo_pagamento,
      status: 'pendente',
      nome: paymentData.nome,
      email: paymentData.email,
      telefone: paymentData.telefone || '',
      data_transacao: new Date().toISOString(),
      confirmacao_enviada: false,
      tentativas_pagamento: 0
    })
    .select()
    .single();

  if (transactionError) {
    console.error("❌ Erro ao salvar transação:", transactionError);
    throw new Error(`Erro ao salvar transação: ${transactionError.message}`);
  }

  console.log("✅ Transação salva no banco:", transaction.id);
  return transaction;
}

export async function updateTransactionPaymentId(transactionId: string, paymentId: string) {
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const { error: updateError } = await supabaseService
    .from('transactions')
    .update({ payment_id: paymentId })
    .eq('id', transactionId);

  if (updateError) {
    console.error("⚠️ Erro ao atualizar payment_id:", updateError);
    throw new Error(`Erro ao atualizar payment_id: ${updateError.message}`);
  }

  console.log("✅ Payment ID atualizado:", paymentId);
}
