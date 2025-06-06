
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
    
    // Verificar se está na rota de sucesso ou tem parâmetros de pagamento
    const hasStripeParams = urlParams.get('session_id'); // Stripe
    const hasMercadoPagoParams = urlParams.get('payment_id') && urlParams.get('preference_id'); // MercadoPago
    const hasPaymentSuccess = urlParams.get('payment_success') === 'true'; // 🔧 NOVO: Parâmetro de sucesso do MP
    const hasPaymentPending = urlParams.get('payment_pending') === 'true'; // 🔧 NOVO: Parâmetro de pendente do MP
    
    if (path === '/success' || hasStripeParams || hasMercadoPagoParams || hasPaymentSuccess || hasPaymentPending) {
      console.log('Setting view to success - Stripe:', !!hasStripeParams, 'MercadoPago:', !!hasMercadoPagoParams, 'MP Success:', hasPaymentSuccess, 'MP Pending:', hasPaymentPending);
      setCurrentView('success');
      
      // 🔧 MELHORAR: Construir URL de sucesso com todos os parâmetros necessários
      if (hasPaymentSuccess || hasPaymentPending) {
        // Para MercadoPago, construir URL de sucesso com parâmetros simulados
        const collection_id = urlParams.get('collection_id');
        const collection_status = urlParams.get('collection_status') || (hasPaymentSuccess ? 'approved' : 'pending');
        const payment_id = urlParams.get('payment_id');
        const status = urlParams.get('status') || (hasPaymentSuccess ? 'approved' : 'pending');
        const external_reference = urlParams.get('external_reference');
        const preference_id = urlParams.get('preference_id');
        
        // Construir nova URL com parâmetros do MercadoPago
        const newParams = new URLSearchParams();
        if (collection_id) newParams.set('collection_id', collection_id);
        if (payment_id) newParams.set('payment_id', payment_id);
        if (preference_id) newParams.set('preference_id', preference_id);
        if (external_reference) newParams.set('external_reference', external_reference);
        newParams.set('collection_status', collection_status);
        newParams.set('status', status);
        
        const newUrl = window.location.origin + '/success' + '?' + newParams.toString();
        window.history.replaceState({}, '', newUrl);
        console.log('🔧 URL atualizada para:', newUrl);
      }
      // Garantir que a URL está correta para outros casos
      else if (path !== '/success' && (hasStripeParams || hasMercadoPagoParams)) {
        const newUrl = window.location.origin + '/success' + '?' + urlParams.toString();
        window.history.replaceState({}, '', newUrl);
      }
    } 
    // Verificar se está tentando acessar admin
    else if (urlParams.get('admin') === 'true') {
      console.log('Setting view to admin');
      setCurrentView('admin');
    }
    // Se não há parâmetros especiais, garantir que está na view main
    else if (path === '/' && !urlParams.toString()) {
      console.log('Setting view to main');
      setCurrentView('main');
    }
    
    // Remover loading após processar a rota
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  const handleGoHome = () => {
    console.log('Going home');
    setCurrentView('main');
    // Limpar URL
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
