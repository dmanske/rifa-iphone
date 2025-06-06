# 🚀 Configurar Stripe para Produção

## 📋 **Passo a Passo:**

### **1. Obter Chaves da Stripe Live**
- Acesse: https://dashboard.stripe.com/apikeys
- Mude para **modo LIVE** (toggle no dashboard)
- Copie as chaves:
  - `pk_live_...` (Publishable Key)
  - `sk_live_...` (Secret Key)

### **2. Criar Produtos no Stripe Live**
- Dashboard → Products → Create Product
- **Produto 1 - Pix:**
  - Nome: "Rifa iPhone - Pix (sem taxa)"
  - Preço: R$ 100,00
  - Copiar Product ID: `prod_xxxxx`
  
- **Produto 2 - Cartão:**
  - Nome: "Rifa iPhone - Cartão (+5% taxa)"
  - Preço: R$ 105,00
  - Copiar Product ID: `prod_yyyyy`

### **3. Configurar Webhook Live**
- Dashboard → Webhooks → Add endpoint
- URL: `https://pwhicfgtakcpiedtdiqn.supabase.co/functions/v1/stripe-webhook`
- Eventos: 
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `payment_intent.succeeded`
- Copiar Webhook Secret: `whsec_xxxxx`

### **4. Atualizar Environment Variables no Supabase**
Dashboard Supabase → Settings → Edge Functions → Environment Variables:

```
STRIPE_SECRET_KEY=sk_live_XXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXX  
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXX
```

### **5. Atualizar Product IDs no Código**
Editar `supabase/functions/create-checkout-session/index.ts`:

```typescript
// Linha ~84-89
if (metodo_pagamento === 'cartao') {
  productId = "prod_NOVO_ID_CARTAO"; // ← Trocar aqui
  precoUnitario = Math.round(precoBase * 1.05);
} else {
  productId = "prod_NOVO_ID_PIX"; // ← Trocar aqui
}
```

### **6. Deploy das Funções**
```bash
npx supabase functions deploy --project-ref pwhicfgtakcpiedtdiqn
```

### **7. Testes em Produção**
- ✅ Pagamento Pix real
- ✅ Pagamento Cartão real  
- ✅ Webhook recebendo confirmações
- ✅ Números sendo bloqueados

## ⚠️ **IMPORTANTE:**
- **Sempre teste primeiro** com valores pequenos
- **Verifique** se todos os webhooks estão funcionando
- **Confirme** se os números estão sendo bloqueados
- **Mantenha backup** das chaves de teste para desenvolvimento

## 🔄 **Para Voltar ao Teste:**
- Simplesmente troque de volta para as chaves `sk_test_` e `pk_test_`
- Use os product IDs de teste
- Configure webhook de teste 