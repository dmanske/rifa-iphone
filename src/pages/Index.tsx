
import React, { useState, useEffect } from 'react';
import { AuthProvider } from '../hooks/useAuth';
import { NumbersProvider } from '../context/NumbersContext';
import { CartProvider } from '../context/CartContext';
import Auth from '../components/Auth';
import RaffleMain from '../components/RaffleMain';
import PaymentSuccess from '../components/PaymentSuccess';

type ViewType = 'main' | 'auth' | 'success' | 'admin';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [isLoading, setIsLoading] = useState(true);

  // Check for success page or admin access on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    
    console.log('Index useEffect - path:', path, 'params:', urlParams.toString());
    
    // 🔧 MELHORAR: Verificação mais rigorosa para tela de sucesso
    const hasStripeParams = urlParams.get('session_id'); // Stripe
    const hasMercadoPagoParams = (urlParams.get('payment_id') && urlParams.get('preference_id')) || 
                                 (urlParams.get('payment_id') && urlParams.get('status')); // MercadoPago
    const hasPaymentSuccess = urlParams.get('payment_success') === 'true';
    const hasPaymentPending = urlParams.get('payment_pending') === 'true';
    
    // Só ir para success se tiver parâmetros válidos de pagamento
    if (path === '/success' || hasStripeParams || hasMercadoPagoParams || hasPaymentSuccess || hasPaymentPending) {
      console.log('Setting view to success - Stripe:', !!hasStripeParams, 'MercadoPago:', !!hasMercadoPagoParams, 'MP Success:', hasPaymentSuccess, 'MP Pending:', hasPaymentPending);
      setCurrentView('success');
      
      // Garantir que está na rota /success com parâmetros
      if (path !== '/success') {
        const newUrl = window.location.origin + '/success' + '?' + urlParams.toString();
        window.history.replaceState({}, '', newUrl);
        console.log('🔧 URL atualizada para:', newUrl);
      }
    } 
    // Verificar se está tentando acessar admin
    else if (urlParams.get('admin') === 'true') {
      console.log('Setting view to admin');
      setCurrentView('admin');
    }
    // 🔧 DEFAULT: Ir para main e limpar qualquer parâmetro inválido
    else {
      console.log('Setting view to main');
      setCurrentView('main');
      // Limpar URL se tiver parâmetros inválidos
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
    // 🔧 SEMPRE limpar URL completamente
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
        return <Auth onBack={() => setCurrentView('main')} />;
      case 'success':
        return <PaymentSuccess onGoHome={handleGoHome} />;
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
