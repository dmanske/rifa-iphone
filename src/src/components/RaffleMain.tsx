
import React, { useState } from 'react';
import { Gift, Users, Clock, Shield, User, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNumbers } from '../context/NumbersContext';
import NumberGrid from './NumberGrid';
import RaffleCheckout from './RaffleCheckout';
import OrganizerPanel from './OrganizerPanel';

interface RaffleMainProps {
  onShowAuth: () => void;
}

const RaffleMain: React.FC<RaffleMainProps> = ({ onShowAuth }) => {
  const { user, signOut, isOrganizer } = useAuth();
  const { reservedNumbers } = useNumbers();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrganizerPanel, setShowOrganizerPanel] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const handleNumbersSelected = (numbers: number[]) => {
    setSelectedNumbers(numbers);
  };

  const handleShowCheckout = () => {
    if (selectedNumbers.length > 0 || reservedNumbers.length > 0) {
      setShowCheckout(true);
    }
  };

  if (showOrganizerPanel) {
    return <OrganizerPanel onBack={() => setShowOrganizerPanel(false)} />;
  }

  if (showCheckout) {
    return (
      <RaffleCheckout 
        onBack={() => setShowCheckout(false)}
        selectedNumbers={selectedNumbers.length > 0 ? selectedNumbers : reservedNumbers}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Rifa iPhone 16 Pro Max
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  {isOrganizer && (
                    <button
                      onClick={() => setShowOrganizerPanel(true)}
                      className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Painel</span>
                    </button>
                  )}
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <a
                    href="/?admin=true"
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Admin
                  </a>
                  <button
                    onClick={onShowAuth}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Login / Cadastro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Concorra ao iPhone 16 Pro Max 256GB
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Apenas R$ 100,00 por número • 130 números disponíveis
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white bg-opacity-20 rounded-xl p-6">
              <Gift className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Prêmio Premium</h3>
              <p className="text-sm text-blue-100">iPhone 16 Pro Max 256GB Titânio Natural</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-6">
              <Shield className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">100% Seguro</h3>
              <p className="text-sm text-blue-100">Pagamento via Stripe, totalmente seguro</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-6">
              <Clock className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Sorteio em Breve</h3>
              <p className="text-sm text-blue-100">Assim que todos os números forem vendidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Numbers Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Escolha seus números da sorte
              </h3>
              <NumberGrid onNumbersSelected={handleNumbersSelected} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            {(selectedNumbers.length > 0 || reservedNumbers.length > 0) && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h4 className="font-bold text-gray-900 mb-4">Finalizar Compra</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Números selecionados:</span>
                    <span className="font-medium">
                      {selectedNumbers.length > 0 ? selectedNumbers.length : reservedNumbers.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Valor por número:</span>
                    <span className="font-medium">R$ 100,00</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">
                      R$ {((selectedNumbers.length > 0 ? selectedNumbers.length : reservedNumbers.length) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    onClick={handleShowCheckout}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    Finalizar Compra
                  </button>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold text-gray-900 mb-4">Como Funciona</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <p>Escolha seus números favoritos no grid acima</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <p>Números ficam reservados por 10 minutos para você</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <p>Faça o pagamento via Pix ou cartão de crédito</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <p>Aguarde o sorteio quando todos os números forem vendidos</p>
                </div>
              </div>
            </div>

            {/* Prize Info */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold mb-4">Prêmio</h4>
              
              {/* Espaço para foto do iPhone */}
              <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4">
                <div className="aspect-square bg-white bg-opacity-30 rounded-lg flex items-center justify-center">
                  <span className="text-sm opacity-75">Foto do iPhone 16 Pro Max</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <p><strong>iPhone 16 Pro Max</strong></p>
                <p>• 256GB de armazenamento</p>
                <p>• Cor: Titânio Natural</p>
                <p>• Totalmente novo e lacrado</p>
                <p>• Garantia Apple de 1 ano</p>
              </div>
              <div className="mt-4 text-xs opacity-90">
                Valor aproximado: R$ 10.499,00
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Rifa iPhone 16 Pro Max. Todos os direitos reservados.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Rifa autorizada e segura • Pagamentos processados via Stripe
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RaffleMain;
