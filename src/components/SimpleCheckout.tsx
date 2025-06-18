
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNumbers } from '../context/NumbersContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check } from 'lucide-react';

interface SimpleCheckoutProps {
  selectedNumbers: number[];
  onBack: () => void;
  onSuccess: () => void;
}

const SimpleCheckout: React.FC<SimpleCheckoutProps> = ({
  selectedNumbers,
  onBack,
  onSuccess
}) => {
  const { user } = useAuth();
  const { refreshNumbers } = useNumbers();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: user?.email || ''
  });
  const [copied, setCopied] = useState(false);

  const pixKey = "47 9 8833-6386";
  const valorTotal = selectedNumbers.length * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast({
      title: "PIX copiado!",
      description: "Chave PIX copiada para a área de transferência",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para continuar",
        variant: "destructive"
      });
      return;
    }

    if (!formData.nome.trim() || !formData.telefone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e telefone para continuar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Reservar números
      const { data: reserveResult, error: reserveError } = await supabase.rpc('reserve_numbers', {
        _user_id: user.id,
        _numeros: selectedNumbers,
        _minutes_to_expire: 60 // 1 hora para fazer o pagamento
      });

      if (reserveError) {
        throw reserveError;
      }

      if (!reserveResult[0]?.success) {
        throw new Error(reserveResult[0]?.message || 'Erro ao reservar números');
      }

      // 2. Criar transação pendente
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          numeros_comprados: selectedNumbers,
          valor_total: valorTotal,
          metodo_pagamento: 'pix_manual',
          status: 'pendente',
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone
        });

      if (transactionError) {
        throw transactionError;
      }

      console.log('✅ Números reservados com sucesso:', selectedNumbers);
      
      // Atualizar números
      await refreshNumbers();

      toast({
        title: "Números reservados!",
        description: `${selectedNumbers.length} números foram reservados. Faça o PIX para confirmar.`,
      });

      onSuccess();

    } catch (error) {
      console.error('❌ Erro ao reservar números:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reservar os números. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Finalizar Reserva
          </h2>
          <p className="text-gray-600">
            Reserve seus números e faça o PIX
          </p>
        </div>

        {/* Números Selecionados */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Números Selecionados:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedNumbers.map(numero => (
              <span
                key={numero}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg font-medium"
              >
                {numero.toString().padStart(3, '0')}
              </span>
            ))}
          </div>
          <div className="mt-3 text-center">
            <span className="text-lg font-bold text-blue-800">
              Total: R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              placeholder="seu@email.com"
              readOnly
            />
          </div>

          {/* PIX */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2">Dados para PIX:</h3>
            <div className="flex items-center justify-between bg-white border rounded-lg p-3">
              <span className="font-mono text-green-800">{pixKey}</span>
              <button
                type="button"
                onClick={handleCopyPix}
                className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Faça o PIX no valor de <strong>R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </p>
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Reservando...' : 'Reservar Números'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>
            Após fazer o PIX, seus números ficarão reservados.
            <br />
            O organizador confirmará o pagamento em breve.
          </p>
        </div>

      </div>
    </div>
  );
};

export default SimpleCheckout;
