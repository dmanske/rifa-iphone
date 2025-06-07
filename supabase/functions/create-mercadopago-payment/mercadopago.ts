
export function calculatePrice(numeros: number[], metodo_pagamento: string) {
  const quantidade = numeros.length;
  const precoBase = 1; // VALOR DE TESTE R$ 1,00
  let precoFinal = precoBase * quantidade;
  
  if (metodo_pagamento === 'cartao') {
    precoFinal = Math.round(precoFinal * 1.05);
  }

  console.log(`💰 Valor calculado: ${quantidade} números x R$ ${precoBase} = R$ ${precoFinal}`);
  return precoFinal;
}

export function generateUrls(origin: string) {
  const successUrl = `${origin}/success?payment_success=true&source=mercadopago`;
  const failureUrl = `${origin}/?payment_failed=true&source=mercadopago`;
  const pendingUrl = `${origin}/success?payment_pending=true&source=mercadopago`;
  
  console.log("URLs configuradas:", { origin, successUrl, failureUrl, pendingUrl });
  console.log("📍 Ambiente detectado:", origin.includes('localhost') ? 'DESENVOLVIMENTO' : 'PRODUÇÃO');
  
  return { successUrl, failureUrl, pendingUrl };
}

export function createPreference(
  paymentData: {
    numeros: number[];
    quantidade: number;
    precoFinal: number;
    nome: string;
    email: string;
    telefone: string;
    metodo_pagamento: string;
    user_id: string;
    transaction_id: string;
  },
  urls: { successUrl: string; failureUrl: string; pendingUrl: string }
) {
  return {
    items: [
      {
        title: `Rifa iPhone - ${paymentData.quantidade} número${paymentData.quantidade > 1 ? 's' : ''} (TESTE)`,
        description: `Números: ${paymentData.numeros.join(', ')} - VALOR DE TESTE`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: paymentData.precoFinal
      }
    ],
    payer: {
      name: paymentData.nome,
      email: paymentData.email,
      phone: {
        number: paymentData.telefone || ""
      }
    },
    payment_methods: {
      excluded_payment_types: paymentData.metodo_pagamento === 'pix' ? 
        [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }] : 
        [{ id: "pix" }, { id: "ticket" }]
    },
    back_urls: {
      success: urls.successUrl,
      failure: urls.failureUrl,
      pending: urls.pendingUrl
    },
    auto_return: "approved",
    external_reference: paymentData.transaction_id,
    metadata: {
      numeros: JSON.stringify(paymentData.numeros),
      metodo_pagamento: paymentData.metodo_pagamento,
      nome: paymentData.nome,
      email: paymentData.email,
      telefone: paymentData.telefone || "",
      user_id: paymentData.user_id,
      transaction_id: paymentData.transaction_id
    },
    notification_url: `https://pwhicfgtakcpiedtdiqn.supabase.co/functions/v1/mercadopago-webhook`
  };
}

export async function createMercadoPagoPreference(preference: any, accessToken: string) {
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
    throw new Error(`Erro ao criar preferência - MercadoPago retornou ${mpResponse.status}: ${errorText}`);
  }

  const mpData = await mpResponse.json();
  console.log("✅ Preferência criada:", mpData.id);

  if (!mpData.init_point) {
    throw new Error("URL de pagamento não criada - MercadoPago não retornou init_point");
  }

  return mpData;
}
