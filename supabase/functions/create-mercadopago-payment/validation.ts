
export interface PaymentRequest {
  numeros: number[];
  metodo_pagamento: 'pix' | 'cartao';
  nome: string;
  email: string;
  telefone?: string;
  user_id: string;
}

export function validatePaymentRequest(body: any): { isValid: boolean; error?: string; data?: PaymentRequest } {
  const { numeros, metodo_pagamento, nome, email, telefone, user_id } = body;

  if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
    return {
      isValid: false,
      error: "Números inválidos",
      data: undefined
    };
  }

  if (!metodo_pagamento || !['pix', 'cartao'].includes(metodo_pagamento)) {
    return {
      isValid: false,
      error: "Método de pagamento inválido",
      data: undefined
    };
  }

  if (!nome || !email) {
    return {
      isValid: false,
      error: "Nome ou email faltando",
      data: undefined
    };
  }

  if (!user_id) {
    return {
      isValid: false,
      error: "User ID obrigatório",
      data: undefined
    };
  }

  return {
    isValid: true,
    data: { numeros, metodo_pagamento, nome, email, telefone, user_id }
  };
}

export async function validateMercadoPagoToken(accessToken: string) {
  const testResponse = await fetch("https://api.mercadopago.com/users/me", {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });

  if (!testResponse.ok) {
    const errorText = await testResponse.text();
    throw new Error(`Token MercadoPago inválido - API retornou ${testResponse.status}: ${errorText}`);
  }

  const userInfo = await testResponse.json();
  console.log("✅ API MercadoPago OK, User ID:", userInfo.id);
  return userInfo;
}
