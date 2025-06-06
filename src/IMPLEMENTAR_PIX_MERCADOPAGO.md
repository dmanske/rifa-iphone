# 🚀 Implementar Pix com MercadoPago

## 📋 **Por que MercadoPago?**

- ✅ **Pix instantâneo** (gratuito)
- ✅ **Cartão de crédito** (~4% de taxa)
- ✅ **Webhooks confiáveis**
- ✅ **API brasileira** completa
- ✅ **Documentação em português**
- ✅ **Suporte local**

---

## 🛠️ **CONFIGURAÇÃO INICIAL:**

### **1. Criar conta MercadoPago:**
- Acesse: https://www.mercadopago.com.br/developers
- Crie conta de desenvolvedor
- Obtenha as credenciais de teste e produção

### **2. Credenciais necessárias:**
```
ACCESS_TOKEN_TEST=TEST-xxxxxxxx
ACCESS_TOKEN_PROD=APP_USR-xxxxxxxx
PUBLIC_KEY_TEST=TEST-xxxxxxxx  
PUBLIC_KEY_PROD=APP_USR-xxxxxxxx
```

---

## 💻 **IMPLEMENTAÇÃO:**

### **1. Edge Function para MercadoPago**

Criar: `supabase/functions/create-mercadopago-payment/index.ts`

```typescript
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

    // Verificar números reservados (mesmo processo do Stripe)
    const { data: reservedNumbers, error: checkError } = await supabaseClient
      .from('raffle_numbers')
      .select('numero, status, reserved_by')
      .in('numero', numeros);

    if (checkError) {
      throw new Error("Erro ao verificar números");
    }

    const invalidNumbers = reservedNumbers?.filter(n => 
      n.status !== 'reservado' || n.reserved_by !== user.id
    );

    if (invalidNumbers && invalidNumbers.length > 0) {
      throw new Error(`Números não reservados: ${invalidNumbers.map(n => n.numero).join(', ')}`);
    }

    // Calcular valores
    const quantidade = numeros.length;
    const precoBase = 100; // R$ 100,00
    let precoFinal = precoBase * quantidade;
    
    if (metodo_pagamento === 'cartao') {
      precoFinal = Math.round(precoFinal * 1.05); // +5% cartão
    }

    // Configurar MercadoPago
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const origin = req.headers.get("origin") || "http://localhost:8080";

    // Criar preferência de pagamento
    const preference = {
      items: [
        {
          title: `Rifa iPhone - ${quantidade} números`,
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
          [{ id: "credit_card" }, { id: "debit_card" }] : 
          [{ id: "pix" }],
        installments: metodo_pagamento === 'cartao' ? 12 : 1
      },
      back_urls: {
        success: `${origin}/success`,
        failure: `${origin}/`,
        pending: `${origin}/success`
      },
      auto_return: "approved",
      metadata: {
        user_id: user.id,
        numeros: JSON.stringify(numeros),
        metodo_pagamento,
        nome,
        email,
        telefone: telefone || ""
      }
    };

    // Fazer requisição para MercadoPago
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preference)
    });

    if (!mpResponse.ok) {
      throw new Error("Erro ao criar pagamento no MercadoPago");
    }

    const mpData = await mpResponse.json();

    // Criar transação no Supabase
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { error: transactionError } = await supabaseService
      .from('transactions')
      .insert({
        user_id: user.id,
        payment_id: mpData.id,
        numeros_comprados: numeros,
        valor_total: precoFinal,
        metodo_pagamento,
        status: 'pendente',
        nome,
        email,
        telefone: telefone || null,
      });

    if (transactionError) {
      console.error("Erro ao criar transação:", transactionError);
    }

    console.log("Preferência MercadoPago criada:", mpData.id);

    return new Response(JSON.stringify({ 
      url: mpData.init_point, // URL de pagamento
      payment_id: mpData.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

### **2. Webhook MercadoPago**

Criar: `supabase/functions/mercadopago-webhook/index.ts`

```typescript
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
    const body = await req.json();
    console.log("Webhook MercadoPago recebido:", body);

    // Verificar se é notificação de pagamento
    if (body.type !== "payment") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentId = body.data.id;
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    // Buscar dados do pagamento
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!paymentResponse.ok) {
      throw new Error("Erro ao buscar pagamento");
    }

    const payment = await paymentResponse.json();
    
    // Verificar se pagamento foi aprovado
    if (payment.status !== "approved") {
      console.log("Pagamento não aprovado:", payment.status);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar preferência para obter metadata
    const prefResponse = await fetch(`https://api.mercadopago.com/checkout/preferences/${payment.preference_id}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    const preference = await prefResponse.json();
    const metadata = preference.metadata;
    const numeros = JSON.parse(metadata.numeros);

    // Cliente Supabase com service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Atualizar transação
    const { error: updateError } = await supabaseService
      .from('transactions')
      .update({
        status: 'pago',
        data_pagamento: new Date().toISOString(),
        confirmacao_enviada: true,
        data_confirmacao: new Date().toISOString(),
      })
      .eq('payment_id', payment.preference_id);

    if (updateError) {
      console.error("Erro ao atualizar transação:", updateError);
    }

    // Finalizar venda dos números (usar mesma função)
    const { error: saleError } = await supabaseService.rpc('finalize_sale', {
      _user_id: metadata.user_id,
      _numeros: numeros,
      _transaction_id: payment.id
    });

    if (saleError) {
      console.error("Erro RPC, usando fallback:", saleError);
      
      // Fallback direto
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
        console.error("Erro no fallback:", updateError);
      }
    }

    console.log("Pagamento MercadoPago confirmado:", paymentId);
    console.log("Números vendidos:", numeros);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro no webhook MercadoPago:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
```

---

## 🔧 **CONFIGURAÇÃO NO SUPABASE:**

### **1. Environment Variables:**
```
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx (ou APP_USR-xxxx para produção)
MERCADOPAGO_PUBLIC_KEY=TEST-xxxx (ou APP_USR-xxxx para produção)
```

### **2. Configurar Webhook no MercadoPago:**
- Dashboard → Webhooks → Adicionar
- URL: `https://pwhicfgtakcpiedtdiqn.supabase.co/functions/v1/mercadopago-webhook`
- Eventos: `payment`

---

## 🎯 **MODIFICAÇÕES NO FRONTEND:**

### **1. Atualizar RaffleCheckout para detectar método:**

```typescript
// Se método = 'pix', usar MercadoPago
// Se método = 'cartao', escolher entre Stripe ou MercadoPago

const handleSubmit = async (e: React.FormEvent) => {
  // ... validações ...
  
  if (paymentMethod === 'pix') {
    // Usar MercadoPago
    const { data, error } = await supabase.functions.invoke('create-mercadopago-payment', {
      body: { numeros: selectedNumbers, metodo_pagamento: 'pix', nome, email, telefone }
    });
    
    if (data?.url) {
      window.location.href = data.url;
    }
  } else {
    // Usar Stripe (cartão)
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { numeros: selectedNumbers, metodo_pagamento: 'cartao', nome, email, telefone }
    });
    
    if (data?.url) {
      window.location.href = data.url;
    }
  }
};
```

---

## 📋 **VANTAGENS DESTA SOLUÇÃO:**

- ✅ **Pix instantâneo** (0% taxa)
- ✅ **Cartão via Stripe** (confiável)
- ✅ **Cartão via MercadoPago** (brasileiro)
- ✅ **Webhooks duplos** (máxima confiabilidade)
- ✅ **Experiência brasileira** para Pix
- ✅ **Internacional** para cartão

---

## 🚀 **DEPLOY:**

```bash
# 1. Deploy das funções
npx supabase functions deploy create-mercadopago-payment --project-ref pwhicfgtakcpiedtdiqn
npx supabase functions deploy mercadopago-webhook --project-ref pwhicfgtakcpiedtdiqn

# 2. Configurar variáveis no Supabase
# 3. Configurar webhook no MercadoPago
# 4. Testar com valores pequenos
```

---

## 🧪 **TESTES:**

### **Cartões de teste MercadoPago:**
- **Aprovado:** 5031 7557 3453 0604
- **Rejeitado:** 5031 7557 3453 0604
- **Pix:** Sempre aprovado em ambiente de teste

**Quer que eu implemente esta solução?** 🎯 