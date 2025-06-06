-- Função para liberar APENAS números específicos (sem deletar transação inteira)
-- Execute no SQL Editor do Supabase

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

-- Exemplo de uso:
-- SELECT liberar_numeros_especificos(ARRAY[1]); -- Só libera número 1, mantém transação 