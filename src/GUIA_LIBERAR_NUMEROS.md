# 🔄 Guia Completo: Liberar Números da Rifa

## 📋 **Como funciona o sistema:**

1. **Pagamento confirmado** → `finalize_sale` atualiza `raffle_numbers` para `'vendido'`
2. **Interface mostra números vendidos** → baseado em `raffle_numbers.status = 'vendido'`
3. **Histórico de vendas** → armazenado na tabela `transactions`

## ⚠️ **IMPORTANTE:**
- **NÃO** delete apenas a tabela `transactions` → número continua bloqueado
- **SEMPRE** atualize a tabela `raffle_numbers` para liberar os números

---

## 🛠️ **PREPARAÇÃO: Execute as funções SQL**

Primeiro, execute estas funções no **SQL Editor do Supabase**:

### **Função 1: Liberar números + Deletar transações**
```sql
CREATE OR REPLACE FUNCTION liberar_numeros(
  _numeros integer[]
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count integer;
    deleted_count integer;
BEGIN
    -- 1. Atualizar números para disponível
    UPDATE raffle_numbers 
    SET 
        status = 'disponivel',
        sold_to = NULL,
        sold_at = NULL,
        reserved_by = NULL,
        reserved_at = NULL,
        reservation_expires_at = NULL,
        updated_at = NOW()
    WHERE numero = ANY(_numeros);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- 2. Deletar transações que contêm esses números
    DELETE FROM transactions 
    WHERE numeros_comprados && _numeros;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log para debug
    RAISE LOG 'liberar_numeros: Liberados % números, deletadas % transações', updated_count, deleted_count;
    RAISE LOG 'liberar_numeros: Números: %', _numeros;
    
    -- Retornar true se pelo menos um número foi liberado
    RETURN updated_count > 0;
END;
$$;

-- Dar permissões para a função
GRANT EXECUTE ON FUNCTION liberar_numeros(integer[]) TO service_role;
GRANT EXECUTE ON FUNCTION liberar_numeros(integer[]) TO authenticated;
```

### **Função 2: Liberar APENAS números específicos**
```sql
CREATE OR REPLACE FUNCTION liberar_numeros_especificos(
  _numeros integer[]
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count integer;
BEGIN
    -- APENAS liberar os números específicos (não deletar transações)
    UPDATE raffle_numbers 
    SET 
        status = 'disponivel',
        sold_to = NULL,
        sold_at = NULL,
        reserved_by = NULL,
        reserved_at = NULL,
        reservation_expires_at = NULL,
        updated_at = NOW()
    WHERE numero = ANY(_numeros);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log para debug
    RAISE LOG 'liberar_numeros_especificos: Liberados % números (transações mantidas)', updated_count;
    RAISE LOG 'liberar_numeros_especificos: Números: %', _numeros;
    
    -- Retornar true se pelo menos um número foi liberado
    RETURN updated_count > 0;
END;
$$;

-- Dar permissões para a função
GRANT EXECUTE ON FUNCTION liberar_numeros_especificos(integer[]) TO service_role;
GRANT EXECUTE ON FUNCTION liberar_numeros_especificos(integer[]) TO authenticated;
```

---

## 🎯 **CENÁRIOS DE USO:**

### **📋 Cenário 1: CANCELAMENTO COMPLETO**
**Situação:** Cliente pediu reembolso total, fraude, ou erro na compra

```sql
-- Libera números E deleta toda a transação
SELECT liberar_numeros(ARRAY[1, 15, 33]);
```

**Resultado:**
- ✅ Números 1, 15, 33 ficam disponíveis
- ✅ Transação é DELETADA da tabela `transactions`
- ✅ Histórico de compra é removido

---

### **📋 Cenário 2: REEMBOLSO PARCIAL**  
**Situação:** Cliente quer devolver apenas alguns números

```sql
-- Libera APENAS números específicos, mantém transação
SELECT liberar_numeros_especificos(ARRAY[1, 33]);
```

**Resultado:**
- ✅ Números 1, 33 ficam disponíveis
- ✅ Transação é MANTIDA na tabela `transactions`
- ✅ Histórico de compra preservado (número 15 ainda consta como vendido)

---

### **📋 Cenário 3: ERRO ADMINISTRATIVO**
**Situação:** Marcou número errado como vendido

```sql
-- Libera número específico sem afetar transações
SELECT liberar_numeros_especificos(ARRAY[42]);
```

---

## 🔍 **COMANDOS ÚTEIS PARA CONSULTA:**

### **Ver números vendidos:**
```sql
SELECT numero, sold_to, sold_at 
FROM raffle_numbers 
WHERE status = 'vendido' 
ORDER BY numero;
```

### **Ver transações de um usuário:**
```sql
SELECT id, nome, numeros_comprados, valor_total, status, data_transacao
FROM transactions 
WHERE user_id = 'USER_ID_AQUI'
ORDER BY data_transacao DESC;
```

### **Verificar se números foram liberados:**
```sql
SELECT numero, status, sold_to 
FROM raffle_numbers 
WHERE numero IN (1, 15, 33);
```

### **Ver histórico completo de um número:**
```sql
SELECT numero, status, sold_to, sold_at, reserved_by, updated_at
FROM raffle_numbers 
WHERE numero = 15;
```

---

## 📝 **EXEMPLOS PRÁTICOS:**

### **Liberar um número:**
```sql
SELECT liberar_numeros_especificos(ARRAY[15]);
```

### **Liberar vários números:**
```sql
SELECT liberar_numeros_especificos(ARRAY[1, 15, 33, 42]);
```

### **Cancelar compra completa:**
```sql
SELECT liberar_numeros(ARRAY[1, 15, 33]);
```

### **Liberar todos os números de um usuário:**
```sql
-- 1. Primeiro veja quais números o usuário tem
SELECT numero FROM raffle_numbers WHERE sold_to = 'USER_ID_AQUI';

-- 2. Depois libere todos (substitua pelos números reais)
SELECT liberar_numeros(ARRAY[1, 5, 10, 25]);
```

---

## 🚨 **CUIDADOS IMPORTANTES:**

### **❌ NÃO FAÇA:**
- Deletar apenas a tabela `transactions` → números continuam bloqueados
- Usar `liberar_numeros()` para reembolso parcial → deleta transação inteira

### **✅ SEMPRE FAÇA:**
- Use `liberar_numeros_especificos()` para reembolsos parciais
- Use `liberar_numeros()` apenas para cancelamentos completos
- Verifique o resultado na interface após executar
- Mantenha backup antes de operações em massa

---

## 🔄 **PROCESSO RECOMENDADO:**

1. **Identifique o problema:**
   - Cancelamento total? Use `liberar_numeros()`
   - Reembolso parcial? Use `liberar_numeros_especificos()`

2. **Execute a consulta apropriada**

3. **Verifique o resultado:**
   ```sql
   SELECT numero, status FROM raffle_numbers WHERE numero IN (1, 33);
   ```

4. **Teste na interface:**
   - Números devem aparecer como disponíveis (brancos)
   - Usuários devem conseguir selecionar novamente

5. **Confirme com o cliente** (se aplicável)

---

## 📞 **CASOS ESPECIAIS:**

### **Liberar todos os números vendidos (RESET COMPLETO):**
```sql
-- ⚠️ CUIDADO: Isso libera TODOS os números!
UPDATE raffle_numbers 
SET 
    status = 'disponivel',
    sold_to = NULL,
    sold_at = NULL,
    reserved_by = NULL,
    reserved_at = NULL,
    reservation_expires_at = NULL,
    updated_at = NOW()
WHERE status = 'vendido';

-- E deletar todas as transações:
DELETE FROM transactions;
```

### **Ver estatísticas atuais:**
```sql
SELECT 
    status,
    COUNT(*) as quantidade
FROM raffle_numbers 
GROUP BY status;
``` 