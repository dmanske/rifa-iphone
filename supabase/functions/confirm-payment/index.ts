
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    
    if (!session_id) {
      throw new Error("Session ID é obrigatório");
    }

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Buscar sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      throw new Error("Pagamento não foi confirmado");
    }

    // Cliente Supabase com service role para bypass RLS
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const metadata = session.metadata!;
    const numeros = JSON.parse(metadata.numeros);
    const valorPago = session.amount_total! / 100; // Converter de centavos para reais

    // Verificar se a compra já foi registrada
    const { data: existingPurchase } = await supabaseService
      .from('raffle_purchases')
      .select('id')
      .eq('stripe_session_id', session_id)
      .single();

    if (existingPurchase) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Compra já registrada" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Registrar compra no banco
    const { error: insertError } = await supabaseService
      .from('raffle_purchases')
      .insert({
        user_id: metadata.user_id,
        nome: metadata.nome,
        email: metadata.email,
        telefone: metadata.telefone || null,
        numeros_comprados: numeros,
        valor_pago: valorPago,
        metodo_pagamento: metadata.metodo_pagamento,
        status_pagamento: 'pago',
        stripe_session_id: session_id,
      });

    if (insertError) {
      console.error("Erro ao inserir compra:", insertError);
      throw new Error("Erro ao registrar compra");
    }

    console.log("Compra registrada com sucesso para session:", session_id);

    return new Response(JSON.stringify({ 
      success: true,
      purchase: {
        numeros,
        valor_pago: valorPago,
        metodo_pagamento: metadata.metodo_pagamento,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro ao confirmar pagamento:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
