-- Função para liberar números e remover transações
-- Execute no SQL Editor do Supabase

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

-- Exemplo de uso:
-- SELECT liberar_numeros(ARRAY[1, 2, 3]); -- Libera números 1, 2 e 3 