
import React, { useState, useEffect } from 'react';
import { AuthProvider } from '../hooks/useAuth';
import { NumbersProvider } from '../context/NumbersContext';
import Auth from '../components/Auth';
import RaffleMain from '../components/RaffleMain';
import PaymentSuccess from '../components/PaymentSuccess';

type ViewType = 'main' | 'auth' | 'success' | 'admin';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('main');

  // Check for success page or admin access on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    
    // Verificar se está na rota de sucesso ou tem session_id
    if (path === '/success' || urlParams.get('session_id')) {
      setCurrentView('success');
    } 
    // Verificar se está tentando acessar admin
    else if (urlParams.get('admin') === 'true') {
      setCurrentView('admin');
    }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'auth':
        return <Auth onBack={() => setCurrentView('main')} />;
      case 'admin':
        return <Auth onBack={() => setCurrentView('main')} />;
      case 'success':
        return <PaymentSuccess onGoHome={() => setCurrentView('main')} />;
      default:
        return <RaffleMain onShowAuth={() => setCurrentView('auth')} />;
    }
  };

  return (
    <AuthProvider>
      <NumbersProvider>
        {renderView()}
      </NumbersProvider>
    </AuthProvider>
  );
};

export default Index;
