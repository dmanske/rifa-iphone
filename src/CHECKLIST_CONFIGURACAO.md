# ✅ CHECKLIST DE CONFIGURAÇÃO - WEBHOOK STRIPE

## 📋 **ETAPAS PARA COMPLETAR A CONFIGURAÇÃO**

### **ETAPA 1: Instalar Docker Desktop**
- [ ] Baixar Docker Desktop em: https://www.docker.com/products/docker-desktop/
- [ ] Executar o instalador
- [ ] Iniciar Docker Desktop
- [ ] Aguardar aparecer "Docker Desktop is running" na bandeja do sistema
- [ ] Testar comando: `docker --version`

### **ETAPA 2: Configurar Webhook no Stripe Dashboard**
- [ ] Acessar: https://dashboard.stripe.com
- [ ] Ir em **Developers** → **Webhooks**
- [ ] Clicar em **"Add endpoint"**
- [ ] Configurar:
  - **URL**: `https://pwhicfgtakcpiedtdiqn.supabase.co/functions/v1/stripe-webhook`
  - **Eventos**: `checkout.session.completed`
- [ ] Salvar e copiar o **Signing Secret** (começa com `whsec_...`)

### **ETAPA 3: Configurar Webhook Secret no Supabase**
- [ ] Executar comando (substitua SEU_SECRET):
```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_SEU_SECRET_AQUI --project-ref pwhicfgtakcpiedtdiqn
```

### **ETAPA 4: Deploy da Função Webhook**
- [ ] Executar o script: `deploy-webhook.bat`
- [ ] OU executar manualmente:
```bash
npx supabase functions deploy stripe-webhook --project-ref pwhicfgtakcpiedtdiqn
```

### **ETAPA 5: Testar a Configuração**
- [ ] Fazer um pagamento de teste
- [ ] Verificar se o webhook foi recebido no Stripe Dashboard
- [ ] Verificar se o pagamento foi confirmado automaticamente
- [ ] Verificar se a página de sucesso funciona corretamente

## 🔧 **COMANDOS ÚTEIS**

### Verificar secrets configurados:
```bash
npx supabase secrets list --project-ref pwhicfgtakcpiedtdiqn
```

### Verificar funções deployadas:
```bash
npx supabase functions list --project-ref pwhicfgtakcpiedtdiqn
```

### Ver logs da função webhook:
```bash
npx supabase functions logs stripe-webhook --project-ref pwhicfgtakcpiedtdiqn
```

## 🐛 **TROUBLESHOOTING**

### Docker não funciona:
- Reiniciar Docker Desktop
- Verificar se está rodando como administrador
- Verificar se WSL2 está instalado (Windows)

### Webhook não recebe eventos:
- Verificar URL no Stripe Dashboard
- Verificar se STRIPE_WEBHOOK_SECRET está correto
- Verificar logs da função no Supabase

### Pagamentos não confirmam:
- Verificar se evento `checkout.session.completed` está configurado
- Verificar logs de erro no Supabase
- Testar com pagamento real (não apenas checkout)

## ✅ **CONFIGURAÇÕES JÁ FEITAS**

- ✅ STRIPE_SECRET_KEY configurada
- ✅ Funções create-checkout-session e confirm-payment deployadas
- ✅ Produtos Stripe configurados (Pix e Cartão)
- ✅ Código da aplicação corrigido para evitar tela branca
- ✅ Sistema de retry automático implementado

## 🎯 **RESULTADO ESPERADO**

Após completar todas as etapas:

1. **Pagamento por cartão**: Stripe → Webhook automático → Confirmação → Página de sucesso
2. **Fallback manual**: Se webhook falhar → Confirmação manual → Retry → Mensagem apropriada
3. **Sem tela branca**: Loading states e tratamento de erros implementados 