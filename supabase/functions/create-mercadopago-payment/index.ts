
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    console.log("🔍 DEBUG - MercadoPago Function Start");

    // 1. Verificar token
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    console.log("Token presente:", !!accessToken);
    
    if (!accessToken) {
      return new Response(JSON.stringify({ 
        error: "Token MercadoPago não configurado",
        debug: "MERCADOPAGO_ACCESS_TOKEN não encontrado",
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 2. Ler body
    const bodyText = await req.text();
    console.log("Body recebido:", bodyText.substring(0, 100) + "...");
    
    if (!bodyText) {
      return new Response(JSON.stringify({ 
        error: "Body vazio",
        debug: "Requisição sem dados",
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const body = JSON.parse(bodyText);
    const { numeros, metodo_pagamento, nome, email, telefone, user_id } = body;

    // 3. Validações
    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Números inválidos",
        debug: `Recebido: ${JSON.stringify(numeros)}`,
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!metodo_pagamento || !['pix', 'cartao'].includes(metodo_pagamento)) {
      return new Response(JSON.stringify({ 
        error: "Método de pagamento inválido",
        debug: `Recebido: ${metodo_pagamento}`,
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!nome || !email) {
      return new Response(JSON.stringify({ 
        error: "Nome ou email faltando",
        debug: `Nome: ${!!nome}, Email: ${!!email}`,
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!user_id) {
      return new Response(JSON.stringify({ 
        error: "User ID obrigatório",
        debug: "user_id não fornecido",
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("✅ Validações passaram");

    // 4. Teste API MercadoPago
    console.log("🧪 Testando API MercadoPago...");
    
    const testResponse = await fetch("https://api.mercadopago.com/users/me", {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      return new Response(JSON.stringify({ 
        error: "Token MercadoPago inválido",
        debug: `API retornou ${testResponse.status}: ${errorText}`,
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const userInfo = await testResponse.json();
    console.log("✅ API MercadoPago OK, User ID:", userInfo.id);

    // 5. Calcular valores
    const quantidade = numeros.length;
    const precoBase = 100; // R$ 100,00
    let precoFinal = precoBase * quantidade;
    
    if (metodo_pagamento === 'cartao') {
      precoFinal = Math.round(precoFinal * 1.05);
    }

    // 6. Criar preferência MercadoPago
    const origin = req.headers.get("origin") || "https://rifaiphonecursor.vercel.app";
    
    // 🔧 CORRIGIR URLs - usar rotas que existem no app
    const successUrl = `${origin}/?payment_success=true`;  // Para página principal com parâmetro
    const failureUrl = `${origin}/`;                       // Página inicial
    const pendingUrl = `${origin}/?payment_pending=true`;  // Para PIX pendente
    
    console.log("URLs configuradas:", { origin, successUrl, failureUrl, pendingUrl });
    console.log("📍 Ambiente detectado:", origin.includes('localhost') ? 'DESENVOLVIMENTO' : 'PRODUÇÃO');
    
    // 7. SALVAR TRANSAÇÃO NO BANCO PRIMEIRO (para ter o ID)
    console.log("💾 Salvando transação no banco...");
    
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: transaction, error: transactionError } = await supabaseService
      .from('transactions')
      .insert({
        user_id: user_id,
        payment_id: 'temp-' + Date.now(), // Temporário, será atualizado depois
        numeros_comprados: numeros,
        valor_total: precoFinal,
        metodo_pagamento: metodo_pagamento,
        status: 'pendente',
        nome: nome,
        email: email,
        telefone: telefone || '',
        data_transacao: new Date().toISOString(),
        confirmacao_enviada: false,
        tentativas_pagamento: 0
      })
      .select()
      .single();

    if (transactionError) {
      console.error("❌ Erro ao salvar transação:", transactionError);
      return new Response(JSON.stringify({ 
        error: "Erro ao salvar transação",
        debug: transactionError.message,
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log("✅ Transação salva no banco:", transaction.id);

    const preference = {
      items: [
        {
          title: `Rifa iPhone - ${quantidade} número${quantidade > 1 ? 's' : ''}`,
          description: `Números: ${numeros.join(', ')}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: precoFinal
        }
      ],
      payer: {
        name: nome,
        email: email,
        phone: {
          number: telefone || ""
        }
      },
      payment_methods: {
        excluded_payment_types: metodo_pagamento === 'pix' ? 
          [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }] : 
          [{ id: "pix" }, { id: "ticket" }]
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl  // 🔧 Adicionar URL para PIX pendente
      },
      auto_return: "approved", // 🔧 Retornar automaticamente quando aprovado
      external_reference: transaction.id, // 🔑 CRITICAL: ID da transação para o webhook
      metadata: {
        numeros: JSON.stringify(numeros),
        metodo_pagamento,
        nome,
        email,
        telefone: telefone || "",
        user_id: user_id,
        transaction_id: transaction.id
      },
      notification_url: `https://pwhicfgtakcpiedtdiqn.supabase.co/functions/v1/mercadopago-webhook`
    };

    console.log("📤 Criando preferência...");
    
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preference)
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      return new Response(JSON.stringify({ 
        error: "Erro ao criar preferência",
        debug: `MercadoPago retornou ${mpResponse.status}: ${errorText}`,
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const mpData = await mpResponse.json();
    console.log("✅ Preferência criada:", mpData.id);

    if (!mpData.init_point) {
      return new Response(JSON.stringify({ 
        error: "URL de pagamento não criada",
        debug: "MercadoPago não retornou init_point",
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 8. ATUALIZAR PAYMENT_ID NA TRANSAÇÃO
    const { error: updateError } = await supabaseService
      .from('transactions')
      .update({ 
        payment_id: mpData.id // Atualizar com o ID real da preferência
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error("⚠️ Erro ao atualizar payment_id:", updateError);
      // Não falha aqui, continua
    }

    console.log("✅ Payment ID atualizado:", mpData.id);

    // 9. Sucesso!
    const response = { 
      url: mpData.init_point,
      payment_id: mpData.id,
      transaction_id: transaction.id,
      success: true,
      debug: "✅ Preferência e transação criadas com sucesso!",
      user_id: userInfo.id,
      quantidade: quantidade,
      preco: precoFinal
    };
    
    console.log("✅ Retornando sucesso");

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ ERRO:", error.message);
    console.error("Stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      debug: "Erro inesperado na função",
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
