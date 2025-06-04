import React, { useState } from 'react';
import { Smartphone, Trophy, Users, Shield, Star, ChevronRight, LogIn, Settings } from 'lucide-react';
import NumberSelection from '../components/NumberSelection';
import AdminPanel from '../components/AdminPanel';
import OrganizerPanel from '../components/OrganizerPanel';
import PaymentSuccess from '../components/PaymentSuccess';
import Auth from '../components/Auth';
import { CartProvider } from '../context/CartContext';
import { AuthProvider, useAuth } from '../hooks/useAuth';

const IndexContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'numbers' | 'admin' | 'organizer' | 'auth' | 'success'>('home');
  const { user, signOut, isOrganizer } = useAuth();

  // Check for success page on load
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session_id')) {
      setCurrentView('success');
    }
  }, []);

  const handleViewChange = (view: 'home' | 'numbers' | 'admin' | 'organizer' | 'auth' | 'success') => {
    setCurrentView(view);
  };

  const handleAuthRequired = () => {
    setCurrentView('auth');
  };

  const handleNumbersAccess = () => {
    if (!user) {
      handleAuthRequired();
      return;
    }
    setCurrentView('numbers');
  };

  const handleGoHome = () => {
    // Clear URL parameters and go home
    window.history.replaceState({}, document.title, "/");
    setCurrentView('home');
  };

  if (currentView === 'auth') {
    return <Auth onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'success') {
    return <PaymentSuccess onGoHome={handleGoHome} />;
  }

  if (currentView === 'numbers') {
    return (
      <NumberSelection 
        onBack={() => setCurrentView('home')} 
        onAuthRequired={handleAuthRequired}
      />
    );
  }

  if (currentView === 'admin') {
    return <AdminPanel onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'organizer') {
    return <OrganizerPanel onBack={() => setCurrentView('home')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Rifa iPhone 16 Pro Max</h1>
              <p className="text-sm text-gray-600">Concorra ao último lançamento da Apple</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Olá, {user.user_metadata?.full_name || user.email}
                </span>
                {isOrganizer && (
                  <button
                    onClick={() => handleViewChange('organizer')}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Painel</span>
                  </button>
                )}
                <button
                  onClick={signOut}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleViewChange('auth')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
              <Smartphone className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Concorra ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">iPhone 16 Pro Max</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              O mais novo lançamento da Apple pode ser seu! Escolha seus números da sorte por apenas R$ 100,00 cada.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={handleNumbersAccess}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Escolher Números</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {!user && (
              <button
                onClick={() => handleViewChange('auth')}
                className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Fazer Login</span>
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">130</div>
              <div className="text-gray-700">Números Disponíveis</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">R$ 100</div>
              <div className="text-gray-700">Preço por Número</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">1</div>
              <div className="text-gray-700">Ganhador</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Por que participar?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Prêmio Incrível</h3>
              <p className="text-gray-600">
                iPhone 16 Pro Max 256GB, o mais novo e avançado smartphone da Apple, completamente novo e lacrado.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Totalmente Seguro</h3>
              <p className="text-gray-600">
                Pagamento seguro via Pix ou cartão de crédito. Todos os dados protegidos e sorteio transparente.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Chances Reais</h3>
              <p className="text-gray-600">
                Apenas 130 números disponíveis. Suas chances de ganhar são muito maiores que uma loteria tradicional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Como funciona?
          </h2>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Faça login ou crie sua conta</h3>
                <p className="text-gray-600">Cadastre-se gratuitamente ou faça login para acessar os números disponíveis.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Escolha seus números</h3>
                <p className="text-gray-600">Selecione de 1 a 10 números da sorte entre 001 e 130. Cada número custa R$ 100,00.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Faça o pagamento</h3>
                <p className="text-gray-600">Pague via Pix (sem taxa) ou cartão de crédito (taxa de 5%). Pagamento 100% seguro.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Receba seu prêmio</h3>
                <p className="text-gray-600">O ganhador será contactado imediatamente e receberá seu iPhone 16 Pro Max novo e lacrado!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Não perca esta oportunidade!
          </h2>
          <p className="text-xl mb-8 opacity-90">
            O iPhone 16 Pro Max pode ser seu. Escolha seus números da sorte agora mesmo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleNumbersAccess}
              className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Participar Agora
            </button>
            
            {!user && (
              <button
                onClick={() => handleViewChange('auth')}
                className="bg-transparent hover:bg-white hover:bg-opacity-10 text-white border-2 border-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105"
              >
                Criar Conta
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Smartphone className="w-6 h-6" />
            <span className="text-lg font-semibold">Rifa iPhone 16 Pro Max</span>
          </div>
          <p className="text-gray-400 mb-6">
            Rifa autorizada e regulamentada. Sorteio transparente e seguro.
          </p>
          
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <span>© 2024 Rifa iPhone. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <IndexContent />
      </CartProvider>
    </AuthProvider>
  );
};

export default Index;
