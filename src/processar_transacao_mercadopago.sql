-- SCRIPT MANUAL PARA PROCESSAR TRANSAÇÕES MERCADOPAGO PENDENTES
-- Execute no SQL Editor do Supabase

-- 🔍 PRIMEIRO: Vamos criar uma transação teste para simular o que deveria ter acontecido
-- (Use os dados do seu pagamento PIX)

INSERT INTO transactions (
    user_id,
    payment_id, 
    numeros_comprados,
    valor_total,
    metodo_pagamento,
    status,
    nome,
    email,
    telefone,
    data_transacao,
    confirmacao_enviada,
    tentativas_pagamento
) VALUES (
    'b367ad78-2816-4c29-a0b5-51b17c0d0f9c', -- Mesmo user_id do número 19
    'MP-TESTE-PIX-' || EXTRACT(EPOCH FROM NOW()), -- ID único para teste
    ARRAY[25], -- SUBSTITUA PELO NÚMERO QUE VOCÊ COMPROU
    1.00, -- Valor que você pagou
    'pix',
    'pendente',
    'Daniel', -- SEU NOME
    'daniel@teste.com', -- SEU EMAIL
    '', -- TELEFONE
    NOW(),
    false,
    0
);

-- 🎯 PROCESSAR A TRANSAÇÃO: Simular o que o webhook deveria fazer
DO $$
DECLARE
    transacao_id uuid;
    numeros_para_vender integer[];
    user_id_transacao uuid;
BEGIN
    -- Buscar a transação recém criada
    SELECT id, numeros_comprados, user_id 
    INTO transacao_id, numeros_para_vender, user_id_transacao
    FROM transactions 
    WHERE metodo_pagamento = 'pix' 
      AND status = 'pendente'
    ORDER BY data_transacao DESC 
    LIMIT 1;
    
    -- Verificar se encontrou
    IF transacao_id IS NULL THEN
        RAISE NOTICE 'Nenhuma transação PIX pendente encontrada';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Processando transação: % com números: %', transacao_id, numeros_para_vender;
    
    -- 1. Atualizar transação para PAGO
    UPDATE transactions 
    SET 
        status = 'pago',
        data_pagamento = NOW(),
        confirmacao_enviada = true,
        data_confirmacao = NOW()
    WHERE id = transacao_id;
    
    -- 2. Marcar números como VENDIDOS
    UPDATE raffle_numbers 
    SET 
        status = 'vendido',
        sold_to = user_id_transacao,
        sold_at = NOW(),
        reserved_by = NULL,
        reserved_at = NULL,
        reservation_expires_at = NULL,
        updated_at = NOW()
    WHERE numero = ANY(numeros_para_vender)
      AND status IN ('disponivel', 'reservado');
    
    RAISE NOTICE '✅ Transação processada com sucesso!';
    RAISE NOTICE '✅ Números % marcados como vendidos', numeros_para_vender;
    
END $$;

-- 🔍 VERIFICAR RESULTADO
SELECT 'TRANSAÇÃO PROCESSADA:' as resultado;
SELECT 
    id,
    payment_id,
    numeros_comprados,
    status,
    data_pagamento
FROM transactions 
WHERE metodo_pagamento = 'pix'
ORDER BY data_transacao DESC;

SELECT 'NÚMEROS VENDIDOS:' as resultado;
SELECT 
    numero,
    status,
    sold_to,
    sold_at
FROM raffle_numbers 
WHERE status = 'vendido'
ORDER BY numero; 