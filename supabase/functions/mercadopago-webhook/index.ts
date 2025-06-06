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

    console.log("MercadoPago webhook recebido:", JSON.stringify(data, null, 2));

    // Salvar webhook para auditoria
    await supabase
      .from("webhooks")
      .insert({
        payment_id: data.data?.id?.toString() || "unknown",
        payload_raw: data,
        fonte: "mercadopago_webhook_completo",
        processado: false,
      });

    // Verificar se é um evento de pagamento
    if (data.type === "payment" && data.action === "payment.updated") {
      const paymentId = data.data?.id;

      if (paymentId) {
        console.log("Processando pagamento MercadoPago:", paymentId);

        // Buscar detalhes do pagamento no MercadoPago
        const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
        
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            "Authorization": `Bearer ${mpAccessToken}`
          }
        });

        if (!paymentResponse.ok) {
          console.error("Erro ao buscar pagamento no MercadoPago:", paymentResponse.status);
          return new Response("Erro ao buscar pagamento", { status: 500, headers: corsHeaders });
        }

        const paymentData = await paymentResponse.json();
        console.log("Dados do pagamento:", JSON.stringify(paymentData, null, 2));

        // Verificar se o pagamento foi aprovado
        if (paymentData.status === "approved") {
          console.log("Pagamento aprovado, processando...");

          // Buscar a transação correspondente pelo external_reference
          const externalReference = paymentData.external_reference;
          
          if (externalReference) {
            const { data: transaction, error } = await supabase
              .from("transactions")
              .select("*")
              .eq("id", externalReference)
              .single();

            if (error) {
              console.error("Erro ao buscar transação:", error);
              return new Response("Transação não encontrada", { status: 404, headers: corsHeaders });
            }

            console.log("Transação encontrada:", transaction);

            // Verificar se a transação ainda não foi processada
            if (transaction.status !== "completed") {
              // Finalizar a venda
              const { error: finalizeError } = await supabase
                .rpc("finalize_sale", {
                  p_transaction_id: transaction.id,
                  p_payment_id: paymentId.toString(),
                  p_payment_method: "mercadopago_pix"
                });

              if (finalizeError) {
                console.error("Erro ao finalizar venda:", finalizeError);
                return new Response("Erro ao finalizar venda", { status: 500, headers: corsHeaders });
              }

              console.log("Venda finalizada com sucesso!");

              // Marcar webhook como processado
              await supabase
                .from("webhooks")
                .update({ processado: true })
                .eq("payment_id", paymentId.toString())
                .eq("fonte", "mercadopago_webhook_completo");

              return new Response("Pagamento processado com sucesso", { status: 200, headers: corsHeaders });
            } else {
              console.log("Transação já processada anteriormente");
              return new Response("Transação já processada", { status: 200, headers: corsHeaders });
            }
          } else {
            console.log("External reference não encontrado no pagamento");
            return new Response("Reference não encontrado", { status: 400, headers: corsHeaders });
          }
        } else {
          console.log("Pagamento não aprovado, status:", paymentData.status);
          return new Response("Pagamento não aprovado", { status: 200, headers: corsHeaders });
        }
      }
    }

    // Para outros tipos de eventos, apenas retornar sucesso
    return new Response("Webhook recebido", { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("Erro no webhook MercadoPago:", error);
    
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
          fonte: "mercadopago_webhook_completo",
          processado: false,
          erro: error.message
        });
    } catch (e) {
      console.error("Erro ao salvar erro no banco:", e);
    }

    return new Response("Erro interno", { status: 500, headers: corsHeaders });
  }
}); 