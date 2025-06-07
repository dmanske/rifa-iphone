
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Receber o payload do webhook
    const body = await req.text();
    const data = JSON.parse(body);

    console.log("🔔 MercadoPago webhook recebido:", JSON.stringify(data, null, 2));

    // Salvar webhook para auditoria
    await supabase
      .from("webhooks")
      .insert({
        payment_id: data.data?.id?.toString() || "unknown",
        payload_raw: data,
        fonte: "mercadopago_webhook",
        processado: false,
      });

    // Verificar se é um evento de pagamento
    if (data.type === "payment") {
      const paymentId = data.data?.id;

      if (paymentId) {
        console.log("💳 Processando pagamento MercadoPago ID:", paymentId);

        // Buscar detalhes do pagamento no MercadoPago
        const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
        
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            "Authorization": `Bearer ${mpAccessToken}`
          }
        });

        if (!paymentResponse.ok) {
          console.error("❌ Erro ao buscar pagamento no MercadoPago:", paymentResponse.status);
          return new Response("Erro ao buscar pagamento", { status: 500, headers: corsHeaders });
        }

        const paymentData = await paymentResponse.json();
        console.log("📋 Dados do pagamento:", JSON.stringify(paymentData, null, 2));

        // Verificar se o pagamento foi aprovado
        if (paymentData.status === "approved") {
          console.log("✅ Pagamento aprovado, processando...");

          // Buscar a transação correspondente pelo external_reference
          const externalReference = paymentData.external_reference;
          
          if (externalReference) {
            console.log("🔍 Buscando transação com ID:", externalReference);

            const { data: transaction, error } = await supabase
              .from("transactions")
              .select("*")
              .eq("id", externalReference)
              .single();

            if (error) {
              console.error("❌ Erro ao buscar transação:", error);
              return new Response("Transação não encontrada", { status: 404, headers: corsHeaders });
            }

            console.log("📦 Transação encontrada:", transaction);

            // Verificar se a transação ainda não foi processada
            if (transaction.status !== "completed" && transaction.status !== "pago") {
              console.log("🔄 Finalizando venda...");

              // Extrair dados do comprovante PIX
              const comprovanteData = {
                ticket_url: paymentData.point_of_interaction?.transaction_data?.ticket_url || null,
                qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code || null,
                qr_code_base64: paymentData.point_of_interaction?.transaction_data?.qr_code_base64 || null,
                transaction_id: paymentData.point_of_interaction?.transaction_data?.transaction_id || null,
                bank_info: paymentData.point_of_interaction?.transaction_data?.bank_info || null,
                e2e_id: paymentData.point_of_interaction?.transaction_data?.e2e_id || null,
              };

              console.log("📄 Dados do comprovante PIX:", comprovanteData);

              // Atualizar números para vendido
              const { error: updateNumbersError } = await supabase
                .from('raffle_numbers')
                .update({
                  status: 'vendido',
                  sold_to: transaction.user_id,
                  sold_at: new Date().toISOString(),
                  reserved_by: null,
                  reserved_at: null,
                  reservation_expires_at: null,
                  updated_at: new Date().toISOString()
                })
                .in('numero', transaction.numeros_comprados);

              if (updateNumbersError) {
                console.error("❌ Erro ao atualizar números:", updateNumbersError);
              }

              // Atualizar transação com dados do comprovante PIX
              const { error: updateTransactionError } = await supabase
                .from('transactions')
                .update({
                  status: 'pago',
                  data_pagamento: new Date().toISOString(),
                  data_aprovacao_pix: paymentData.date_approved,
                  confirmacao_enviada: true,
                  data_confirmacao: new Date().toISOString(),
                  mercadopago_payment_id: paymentId.toString(),
                  comprovante_url: comprovanteData.ticket_url,
                  qr_code_pix: comprovanteData.qr_code,
                  qr_code_base64: comprovanteData.qr_code_base64,
                  dados_comprovante: {
                    ...comprovanteData,
                    payment_data: {
                      id: paymentData.id,
                      status: paymentData.status,
                      status_detail: paymentData.status_detail,
                      transaction_amount: paymentData.transaction_amount,
                      currency_id: paymentData.currency_id,
                      date_approved: paymentData.date_approved,
                      date_created: paymentData.date_created,
                      description: paymentData.description,
                      external_reference: paymentData.external_reference,
                      fee_details: paymentData.fee_details,
                      money_release_date: paymentData.money_release_date,
                      payer: paymentData.payer,
                      payment_method: paymentData.payment_method,
                    }
                  }
                })
                .eq('id', transaction.id);

              if (updateTransactionError) {
                console.error("❌ Erro ao atualizar transação:", updateTransactionError);
              } else {
                console.log("✅ Transação atualizada com dados do comprovante PIX!");
              }

              console.log("✅ Venda finalizada com sucesso!");

              // Marcar webhook como processado
              await supabase
                .from("webhooks")
                .update({ processado: true })
                .eq("payment_id", paymentId.toString())
                .eq("fonte", "mercadopago_webhook");

              return new Response("Pagamento processado com sucesso", { status: 200, headers: corsHeaders });
            } else {
              console.log("⚠️ Transação já processada anteriormente");
              return new Response("Transação já processada", { status: 200, headers: corsHeaders });
            }
          } else {
            console.log("❌ External reference não encontrado no pagamento");
            return new Response("Reference não encontrado", { status: 400, headers: corsHeaders });
          }
        } else {
          console.log("⏳ Pagamento não aprovado ainda, status:", paymentData.status);
          return new Response("Pagamento não aprovado", { status: 200, headers: corsHeaders });
        }
      } else {
        console.log("❌ Payment ID não encontrado no webhook");
        return new Response("Payment ID não encontrado", { status: 400, headers: corsHeaders });
      }
    }

    // Para outros tipos de eventos, apenas retornar sucesso
    console.log("ℹ️ Evento não relacionado a pagamento:", data.type);
    return new Response("Webhook recebido", { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("💥 Erro no webhook MercadoPago:", error);
    
    // Tentar salvar o erro no banco
    try {
      const supabaseError = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      await supabaseError
        .from("webhooks")
        .insert({
          payment_id: "error",
          payload_raw: { error: error.message },
          fonte: "mercadopago_webhook",
          processado: false,
          erro: error.message
        });
    } catch (e) {
      console.error("❌ Erro ao salvar erro no banco:", e);
    }

    return new Response("Erro interno", { status: 500, headers: corsHeaders });
  }
});
