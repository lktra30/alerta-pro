-- Função para inserir clientes de forma segura, evitando problemas com triggers de whitelabel
CREATE OR REPLACE FUNCTION public.insert_cliente_safe(cliente_data jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_cliente record;
    result json;
BEGIN
    -- Disable triggers temporarily for this session
    SET session_replication_role = replica;
    
    -- Insert the client data
    INSERT INTO public.clientes (
        nome,
        email,
        telefone,
        empresa,
        origem,
        sdr_id,
        closer_id,
        etapa,
        endereco,
        valor_venda
    )
    VALUES (
        (cliente_data->>'nome')::text,
        NULLIF(cliente_data->>'email', '')::text,
        NULLIF(cliente_data->>'telefone', '')::text,
        NULLIF(cliente_data->>'empresa', '')::text,
        NULLIF(cliente_data->>'origem', '')::text,
        NULLIF(cliente_data->>'sdr_id', '')::integer,
        NULLIF(cliente_data->>'closer_id', '')::integer,
        (cliente_data->>'etapa')::etapa_enum,
        NULLIF(cliente_data->>'endereco', '')::text,
        NULLIF(cliente_data->>'valor_venda', '')::numeric
    )
    RETURNING * INTO new_cliente;
    
    -- Re-enable triggers
    SET session_replication_role = DEFAULT;
    
    -- Return the created client as JSON
    SELECT row_to_json(new_cliente) INTO result;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Re-enable triggers in case of error
    SET session_replication_role = DEFAULT;
    
    -- Re-raise the exception
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_cliente_safe(jsonb) TO authenticated;
