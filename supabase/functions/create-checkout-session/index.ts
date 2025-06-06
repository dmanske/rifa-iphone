
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("Usuário não autenticado");
    }

    const { 
      numeros, 
      metodo_pagamento, 
      nome, 
      email, 
      telefone 
    } = await req.json();

    // Validar dados
    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
      throw new Error("Números são obrigatórios");
    }

    if (!metodo_pagamento || !['pix', 'cartao'].includes(metodo_pagamento)) {
      throw new Error("Método de pagamento inválido");
    }

    // Verificar se algum número já foi vendido ANTES de prosseguir
    const { data: soldNumbers, error: soldCheckError } = await supabaseClient
      .from('raffle_numbers')
      .select('numero')
      .in('numero', numeros)
      .eq('status', 'vendido');

    if (soldCheckError) {
      throw new Error("Erro ao verificar números vendidos");
    }

    if (soldNumbers && soldNumbers.length > 0) {
      const soldNumbersList = soldNumbers.map(n => n.numero).join(', ');
      throw new Error(`Os seguintes números já foram vendidos: ${soldNumbersList}`);
    }

    // Verificar se os números estão reservados pelo usuário
    const { data: reservedNumbers, error: checkError } = await supabaseClient
      .from('raffle_numbers')
      .select('numero, status, reserved_by')
      .in('numero', numeros);

    if (checkError) {
      throw new Error("Erro ao verificar números");
    }

    // Validar se todos os números estão reservados pelo usuário
    const invalidNumbers = reservedNumbers?.filter(n => 
      n.status !== 'reservado' || n.reserved_by !== user.id
    );

    if (invalidNumbers && invalidNumbers.length > 0) {
      throw new Error(`Números não reservados ou inválidos: ${invalidNumbers.map(n => n.numero).join(', ')}`);
    }

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const quantidade = numeros.length;
    const precoBase = 10000; // R$ 100,00 em centavos
    let precoUnitario = precoBase;
    let productId = "";

    // Definir produto e preço baseado no método de pagamento
    if (metodo_pagamento === 'cartao') {
      productId = "prod_SQxA3dwkWmqC91"; // ID do produto para cartão
      precoUnitario = Math.round(precoBase * 1.05); // Adicionar 5% de taxa
    } else {
      productId = "prod_SQxAnSGF6Ly2D1"; // ID do produto para Pix
    }

    // Verificar se o cliente Stripe existe
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Obter a origem correta da requisição
    const origin = req.headers.get("origin") || req.headers.get("referer")?.split('/').slice(0, 3).join('/') || "http://localhost:3000";

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product: productId,
            unit_amount: precoUnitario,
          },
          quantity: quantidade,
        },
      ],
      mode: "payment",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: {
        user_id: user.id,
        numeros: JSON.stringify(numeros),
        metodo_pagamento,
        nome,
        email,
        telefone: telefone || "",
      },
    });

    // Usar service role para criar transação
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Criar registro da transação
    const valorTotal = (quantidade * precoUnitario) / 100; // Converter para reais
    
    const { error: transactionError } = await supabaseService
      .from('transactions')
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        payment_id: session.id, // Usar session ID como payment ID inicial
        numeros_comprados: numeros,
        valor_total: valorTotal,
        metodo_pagamento,
        status: 'pendente',
        nome,
        email,
        telefone: telefone || null,
      });

    if (transactionError) {
      console.error("Erro ao criar transação:", transactionError);
      // Não falhar o checkout por isso
    }

    console.log("Sessão criada:", session.id);
    console.log("Success URL:", `${origin}/success?session_id={CHECKOUT_SESSION_ID}`);
    console.log("Transação criada para números:", numeros);

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
