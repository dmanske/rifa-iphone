
import React, { useState } from 'react';
import { Smartphone, Trophy, Users, CheckCircle } from 'lucide-react';
import NumberSelection from '../components/NumberSelection';
import Cart from '../components/Cart';
import Checkout from '../components/Checkout';
import AdminPanel from '../components/AdminPanel';
import { CartProvider } from '../context/CartContext';

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'selection' | 'admin'>('home');

  const HeroSection = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Trophy className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-800">RifaApp</span>
        </div>
        <button
          onClick={() => setCurrentView('admin')}
          className="px-4 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          Painel Organizador
        </button>
      </nav>

      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-2" />
                Rifa Oficial
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Concorra ao
                <span className="block text-blue-600">iPhone 16 Pro Max</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                256GB • Titânio Natural • Última geração da Apple
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">130</div>
                <div className="text-sm text-gray-600">Números Total</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">R$ 100</div>
                <div className="text-sm text-gray-600">Por Número</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  <Users className="w-8 h-8 mx-auto" />
                </div>
                <div className="text-sm text-gray-600">Participantes</div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="space-y-4">
              <button
                onClick={() => setCurrentView('selection')}
                className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Escolher Meus Números
              </button>
              <p className="text-sm text-gray-500">
                ✓ Pagamento seguro via Pix ou Cartão • ✓ Confirmação instantânea
              </p>
            </div>
          </div>

          {/* Right Column - Product Image */}
          <div className="relative">
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <Smartphone className="w-32 h-32 text-gray-400" />
              </div>
              
              {/* Floating Price Tag */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg">
                <div className="text-lg font-bold">Prêmio</div>
                <div className="text-sm opacity-90">R$ 8.999</div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-200 rounded-full opacity-20"></div>
            <div className="absolute -top-6 -left-12 w-16 h-16 bg-purple-200 rounded-full opacity-20"></div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Transparente</h3>
            <p className="text-gray-600">Acompanhe todos os números vendidos em tempo real</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Sorteio Justo</h3>
            <p className="text-gray-600">Sistema randomizado e público para garantir a imparcialidade</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Seguro</h3>
            <p className="text-gray-600">Pagamentos protegidos e confirmação automática</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <CartProvider>
      <div className="min-h-screen">
        {currentView === 'home' && <HeroSection />}
        {currentView === 'selection' && (
          <NumberSelection onBack={() => setCurrentView('home')} />
        )}
        {currentView === 'admin' && (
          <AdminPanel onBack={() => setCurrentView('home')} />
        )}
      </div>
    </CartProvider>
  );
};

export default Index;
