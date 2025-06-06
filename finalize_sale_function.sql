-- Script para criar a função finalize_sale no Supabase
-- Execute este código no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION finalize_sale(
  _user_id text,
  _numeros integer[],
  _transaction_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count integer;
BEGIN
    -- Atualizar os números para vendido
    UPDATE raffle_numbers 
    SET 
        status = 'vendido',
        sold_to = _user_id,
        sold_at = NOW(),
        reserved_by = NULL,
        reserved_at = NULL,
        reservation_expires_at = NULL,
        updated_at = NOW()
    WHERE numero = ANY(_numeros)
      AND status IN ('reservado', 'disponivel');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log para debug
    RAISE LOG 'finalize_sale: Updated % numbers for transaction %', updated_count, _transaction_id;
    RAISE LOG 'finalize_sale: Numbers: %', _numeros;
    
    -- Retornar true se pelo menos um número foi atualizado
    RETURN updated_count > 0;
END;
$$;

-- Dar permissões para a função
GRANT EXECUTE ON FUNCTION finalize_sale(text, integer[], text) TO service_role;
GRANT EXECUTE ON FUNCTION finalize_sale(text, integer[], text) TO anon;
GRANT EXECUTE ON FUNCTION finalize_sale(text, integer[], text) TO authenticated;

-- Teste da função (opcional)
-- SELECT finalize_sale('test-user-id', ARRAY[1, 2, 3], 'test-transaction-id'); 