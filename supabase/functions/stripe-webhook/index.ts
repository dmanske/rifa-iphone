import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    if (!signature) {
      throw new Error("Assinatura do webhook não encontrada");
    }

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("Webhook secret não configurado");
    }

    // Verificar assinatura do webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Erro na verificação do webhook:", err);
      throw new Error("Assinatura inválida");
    }

    console.log("Webhook recebido:", event.type);

    // Processar apenas eventos de checkout completado
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processando checkout completado:", session.id);

      // Cliente Supabase com service role para bypass RLS
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const metadata = session.metadata!;
      const numeros = JSON.parse(metadata.numeros);
      const valorPago = session.amount_total! / 100; // Converter de centavos para reais

      // Verificar se o pagamento já foi processado
      const { data: existingTransaction } = await supabaseService
        .from('transactions')
        .select('id, status, confirmacao_enviada')
        .eq('stripe_session_id', session.id)
        .single();

      if (existingTransaction) {
        if (existingTransaction.status === 'pago' && existingTransaction.confirmacao_enviada) {
          console.log("Pagamento já processado:", session.id);
          return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Atualizar transação existente
        const { error: updateError } = await supabaseService
          .from('transactions')
          .update({
            status: 'pago',
            data_pagamento: new Date().toISOString(),
            confirmacao_enviada: true,
            data_confirmacao: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingTransaction.id)
          .eq('confirmacao_enviada', false); // Condição para evitar dupla atualização

        if (updateError) {
          console.error("Erro ao atualizar transação:", updateError);
          throw new Error("Erro ao confirmar pagamento");
        }

        // Finalizar venda dos números
        const { error: saleError } = await supabaseService.rpc('finalize_sale', {
          _user_id: metadata.user_id,
          _numeros: numeros,
          _transaction_id: existingTransaction.id
        });

        if (saleError) {
          console.error("Erro ao finalizar venda via RPC:", saleError);
          
          // Fallback: Atualizar números diretamente
          console.log("Tentando atualização direta dos números...");
          const { error: updateError } = await supabaseService
            .from('raffle_numbers')
            .update({
              status: 'vendido',
              sold_to: metadata.user_id,
              sold_at: new Date().toISOString(),
              reserved_by: null,
              reserved_at: null,
              reservation_expires_at: null,
              updated_at: new Date().toISOString()
            })
            .in('numero', numeros);
            
          if (updateError) {
            console.error("Erro na atualização direta:", updateError);
            throw new Error("Erro ao confirmar números vendidos");
          }
          
          console.log("Números atualizados diretamente:", numeros);
        }

        // Log do pagamento processado
        await supabaseService
          .from('payment_logs')
          .insert({
            payment_id: session.id,
            transaction_id: existingTransaction.id,
            payload_raw: event,
            fonte: 'stripe_webhook',
            processado: true,
          });

        console.log("Pagamento confirmado automaticamente via webhook:", session.id);
        console.log("Números vendidos:", numeros);

      } else {
        // Criar nova transação se não existir
        const { data: newTransaction, error: insertError } = await supabaseService
          .from('transactions')
          .insert({
            user_id: metadata.user_id,
            stripe_session_id: session.id,
            payment_id: session.id,
            numeros_comprados: numeros,
            valor_total: valorPago,
            metodo_pagamento: metadata.metodo_pagamento,
            status: 'pago',
            nome: metadata.nome,
            email: metadata.email,
            telefone: metadata.telefone || null,
            data_pagamento: new Date().toISOString(),
            confirmacao_enviada: true,
            data_confirmacao: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertError) {
          console.error("Erro ao criar transação:", insertError);
          throw new Error("Erro ao registrar pagamento");
        }

        // Finalizar venda dos números
        const { error: saleError } = await supabaseService.rpc('finalize_sale', {
          _user_id: metadata.user_id,
          _numeros: numeros,
          _transaction_id: newTransaction.id
        });

        if (saleError) {
          console.error("Erro ao finalizar venda via RPC:", saleError);
          
          // Fallback: Atualizar números diretamente
          console.log("Tentando atualização direta dos números...");
          const { error: updateError } = await supabaseService
            .from('raffle_numbers')
            .update({
              status: 'vendido',
              sold_to: metadata.user_id,
              sold_at: new Date().toISOString(),
              reserved_by: null,
              reserved_at: null,
              reservation_expires_at: null,
              updated_at: new Date().toISOString()
            })
            .in('numero', numeros);
            
          if (updateError) {
            console.error("Erro na atualização direta:", updateError);
            throw new Error("Erro ao confirmar números vendidos");
          }
          
          console.log("Números atualizados diretamente:", numeros);
        }

        // Log do pagamento processado
        await supabaseService
          .from('payment_logs')
          .insert({
            payment_id: session.id,
            transaction_id: newTransaction.id,
            payload_raw: event,
            fonte: 'stripe_webhook',
            processado: true,
          });

        console.log("Novo pagamento confirmado automaticamente via webhook:", session.id);
        console.log("Números vendidos:", numeros);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro no webhook:", error);
    
    // Log do erro
    if (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      try {
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        await supabaseService
          .from('payment_logs')
          .insert({
            payment_id: 'webhook_error',
            payload_raw: { error: error.message },
            fonte: 'stripe_webhook',
            processado: false,
            erro: error.message,
          });
      } catch (logError) {
        console.error("Erro ao registrar log:", logError);
      }
    }

    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}); 