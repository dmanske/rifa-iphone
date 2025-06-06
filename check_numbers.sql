-- Script básico para verificar status da rifa

-- 1. Ver números vendidos
SELECT 
    numero,
    status,
    sold_to,
    sold_at
FROM raffle_numbers 
WHERE status = 'vendido'
ORDER BY numero;

-- 2. Estatísticas gerais dos números
SELECT 
    status,
    COUNT(*) as quantidade
FROM raffle_numbers 
GROUP BY status;

-- 3. Ver todas as transações
SELECT 
    id,
    payment_id,
    numeros_comprados,
    valor_total,
    status
FROM transactions 
ORDER BY id DESC;

-- 4. Verificar se existe tabela payment_logs
SELECT COUNT(*) as total_logs FROM payment_logs; 