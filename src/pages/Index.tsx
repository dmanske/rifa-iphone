
import React, { useState, useEffect } from 'react';
import { AuthProvider } from '../hooks/useAuth';
import { NumbersProvider } from '../context/NumbersContext';
import { CartProvider } from '../context/CartContext';
import Auth from '../components/Auth';
import RaffleMain from '../components/RaffleMain';
import OrganizerPanel from '../components/OrganizerPanel';

type ViewType = 'main' | 'auth' | 'admin';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [isLoading, setIsLoading] = useState(true);

  // Check for admin access on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('Index useEffect - checking URL params');
    
    // Verificar se está tentando acessar admin
    if (urlParams.get('admin') === 'true') {
      console.log('Setting view to admin');
      setCurrentView('admin');
    }
    // DEFAULT: Ir para main e limpar qualquer parâmetro
    else {
      console.log('Setting view to main');
      setCurrentView('main');
      // Limpar URL se tiver parâmetros que não sejam admin
      if (urlParams.toString() && !urlParams.get('admin')) {
        window.history.replaceState({}, '', '/');
        console.log('🧹 URL limpa, voltando para /');
      }
    }
    
    // Remover loading após processar a rota
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  const handleGoHome = () => {
    console.log('Going home - clearing all URL params');
    setCurrentView('main');
    // SEMPRE limpar URL completamente
    window.history.replaceState({}, '', '/');
  };

  const renderView = () => {
    console.log('Rendering view:', currentView);
    
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full mx-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Carregando...
            </h2>
            <p className="text-gray-600">
              Aguarde um momento.
            </p>
          </div>
        </div>
      );
    }
    
    switch (currentView) {
      case 'auth':
        return <Auth onBack={() => setCurrentView('main')} />;
      case 'admin':
        return <OrganizerPanel onBack={() => setCurrentView('main')} />;
      default:
        return <RaffleMain onShowAuth={() => setCurrentView('auth')} />;
    }
  };

  return (
    <AuthProvider>
      <NumbersProvider>
        <CartProvider>
        {renderView()}
        </CartProvider>
      </NumbersProvider>
    </AuthProvider>
  );
};

export default Index;
