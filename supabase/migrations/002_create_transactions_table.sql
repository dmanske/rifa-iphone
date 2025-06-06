-- Migration para criar a tabela transactions para MercadoPago
-- Esta tabela armazena informações sobre transações de pagamento

CREATE TABLE IF NOT EXISTS transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id text NOT NULL UNIQUE, -- ID da preferência ou pagamento do MercadoPago
  user_id uuid REFERENCES auth.users(id),
  numeros integer[] NOT NULL,
  metodo_pagamento text NOT NULL CHECK (metodo_pagamento IN ('pix', 'cartao')),
  valor_total integer NOT NULL, -- valor em centavos
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'falhado')),
  provider text NOT NULL DEFAULT 'mercadopago' CHECK (provider IN ('stripe', 'mercadopago')),
  
  -- Dados do usuário
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  data_pagamento timestamptz,
  confirmacao_enviada boolean DEFAULT false,
  data_confirmacao timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_provider ON transactions(provider);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at_trigger
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias transações
CREATE POLICY "users_can_view_own_transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Apenas service_role pode inserir transações (via Edge Functions)
CREATE POLICY "service_role_can_insert_transactions" ON transactions
  FOR INSERT WITH CHECK (true);

-- Apenas service_role pode atualizar transações (via Edge Functions)  
CREATE POLICY "service_role_can_update_transactions" ON transactions
  FOR UPDATE USING (true);

-- Permissões para roles
GRANT SELECT, INSERT, UPDATE ON transactions TO service_role;
GRANT SELECT ON transactions TO authenticated;
GRANT SELECT ON transactions TO anon; 