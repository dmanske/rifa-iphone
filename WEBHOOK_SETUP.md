# Configuração do Webhook Stripe

## Problemas Corrigidos

Este documento explica as correções implementadas para resolver:

1. **Tela branca após pagamento**: Melhorado o tratamento de redirecionamento e estados de loading
2. **Confirmação manual de reservas**: Implementado webhook automático do Stripe

## Configuração do Webhook Stripe

### 1. Configurar Webhook no Dashboard Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá em **Developers** > **Webhooks**
3. Clique em **Add endpoint**
4. Configure:
   - **Endpoint URL**: `https://SEU_PROJETO.supabase.co/functions/v1/stripe-webhook`
   - **Events to send**: Selecione `checkout.session.completed`

### 2. Configurar Variáveis de Ambiente

No Supabase, adicione as seguintes variáveis de ambiente:

```bash
# No painel do Supabase: Settings > Edge Functions > Environment Variables
STRIPE_SECRET_KEY=sk_test_... # ou sk_live_... para produção
STRIPE_WEBHOOK_SECRET=whsec_... # Obtido do webhook criado no passo 1
```

### 3. Deploy das Funções

Execute os comandos para fazer deploy das funções:

```bash
# Deploy da nova função webhook
supabase functions deploy stripe-webhook

# Redeploy das funções existentes (se necessário)
supabase functions deploy create-checkout-session
supabase functions deploy confirm-payment
```

### 4. Testar o Webhook

1. Faça um pagamento de teste
2. Verifique nos logs do Supabase se o webhook foi recebido
3. Confirme se a transação foi marcada como "pago" automaticamente

## Como Funciona Agora

### Fluxo Automático (com webhook)
1. Usuário faz pagamento no Stripe
2. Stripe envia webhook para `/stripe-webhook`
3. Webhook confirma automaticamente o pagamento
4. Números são marcados como vendidos
5. Usuário é redirecionado para página de sucesso
6. Página de sucesso confirma que o pagamento já foi processado

### Fluxo Manual (fallback)
1. Se o webhook falhar ou demorar
2. Página de sucesso tenta confirmar manualmente
3. Se falhar na primeira tentativa, tenta novamente após 3 segundos
4. Mostra mensagem apropriada ao usuário

## Melhorias Implementadas

### 1. Página de Sucesso
- ✅ Aguarda 2 segundos antes de tentar confirmar (dá tempo para webhook)
- ✅ Retry automático se pagamento não foi confirmado
- ✅ Mensagens de erro mais amigáveis
- ✅ Tratamento para casos onde webhook já processou

### 2. Roteamento
- ✅ Loading state para evitar tela branca
- ✅ Melhor tratamento de URLs
- ✅ Fallback para página principal em caso de erro

### 3. Webhook Stripe
- ✅ Confirmação automática de pagamentos
- ✅ Verificação de assinatura para segurança
- ✅ Prevenção de processamento duplo
- ✅ Logs detalhados para debug

## Monitoramento

### Logs para Verificar
1. **Supabase Functions Logs**: Para ver se webhook está sendo recebido
2. **Stripe Dashboard**: Para ver se webhooks estão sendo enviados
3. **Tabela `payment_logs`**: Para histórico de processamento

### Queries Úteis
```sql
-- Verificar pagamentos recentes
SELECT * FROM transactions 
WHERE created_at > NOW() - INTERVAL '1 day' 
ORDER BY created_at DESC;

-- Verificar logs de webhook
SELECT * FROM payment_logs 
WHERE fonte = 'stripe_webhook' 
ORDER BY data_recebimento DESC;

-- Verificar números vendidos hoje
SELECT * FROM raffle_numbers 
WHERE status = 'vendido' 
AND sold_at > CURRENT_DATE;
```

## Troubleshooting

### Webhook não está funcionando
1. Verifique se a URL do webhook está correta
2. Confirme se `STRIPE_WEBHOOK_SECRET` está configurado
3. Verifique logs do Supabase para erros

### Pagamentos não confirmam automaticamente
1. Verifique se o evento `checkout.session.completed` está configurado
2. Confirme se a função `finalize_sale` existe no banco
3. Verifique se as permissões RLS estão corretas

### Tela branca após pagamento
1. Verifique se a rota `/success` está configurada no App.tsx
2. Confirme se o `session_id` está sendo passado na URL
3. Verifique console do navegador para erros JavaScript 