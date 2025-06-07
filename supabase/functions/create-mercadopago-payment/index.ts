
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { validatePaymentRequest, validateMercadoPagoToken } from "./validation.ts";
import { createTransaction, updateTransactionPaymentId } from "./database.ts";
import { calculatePrice, generateUrls, createPreference, createMercadoPagoPreference } from "./mercadopago.ts";
import { corsHeaders, createErrorResponse, createSuccessResponse } from "./response.ts";

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
      return createErrorResponse(
        "Token MercadoPago não configurado",
        "MERCADOPAGO_ACCESS_TOKEN não encontrado"
      );
    }

    // 2. Ler e validar body
    const bodyText = await req.text();
    console.log("Body recebido:", bodyText.substring(0, 100) + "...");
    
    if (!bodyText) {
      return createErrorResponse("Body vazio", "Requisição sem dados");
    }

    const body = JSON.parse(bodyText);
    const validation = validatePaymentRequest(body);
    
    if (!validation.isValid) {
      return createErrorResponse(
        validation.error!,
        `Dados inválidos: ${JSON.stringify(body)}`
      );
    }

    const { numeros, metodo_pagamento, nome, email, telefone, user_id } = validation.data!;
    console.log("✅ Validações passaram");

    // 3. Validar token MercadoPago
    console.log("🧪 Testando API MercadoPago...");
    const userInfo = await validateMercadoPagoToken(accessToken);

    // 4. Calcular valores
    const precoFinal = calculatePrice(numeros, metodo_pagamento);

    // 5. Gerar URLs
    const origin = req.headers.get("origin") || "https://rifaiphonecursor.vercel.app";
    const urls = generateUrls(origin);

    // 6. Salvar transação no banco
    console.log("💾 Salvando transação no banco...");
    const transaction = await createTransaction({
      user_id,
      numeros,
      valor_total: precoFinal,
      metodo_pagamento,
      nome,
      email,
      telefone: telefone || ''
    });

    // 7. Criar preferência MercadoPago
    const preference = createPreference(
      {
        numeros,
        quantidade: numeros.length,
        precoFinal,
        nome,
        email,
        telefone: telefone || '',
        metodo_pagamento,
        user_id,
        transaction_id: transaction.id
      },
      urls
    );

    const mpData = await createMercadoPagoPreference(preference, accessToken);

    // 8. Atualizar payment_id na transação
    await updateTransactionPaymentId(transaction.id, mpData.id);

    // 9. Retornar sucesso
    const response = { 
      url: mpData.init_point,
      payment_id: mpData.id,
      transaction_id: transaction.id,
      success: true,
      debug: "✅ Preferência e transação criadas com sucesso!",
      user_id: userInfo.id,
      quantidade: numeros.length,
      preco: precoFinal
    };
    
    console.log("✅ Retornando sucesso");
    return createSuccessResponse(response);

  } catch (error) {
    console.error("❌ ERRO:", error.message);
    console.error("Stack:", error.stack);
    
    return createErrorResponse(
      error.message,
      "Erro inesperado na função",
      500
    );
  }
});
