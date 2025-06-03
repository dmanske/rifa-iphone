
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  number: number;
  price: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (number: number) => void;
  removeFromCart: (number: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalWithFee: (feePercentage: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const PRICE_PER_NUMBER = 100;

  const addToCart = (number: number) => {
    const existingItem = cartItems.find(item => item.number === number);
    if (!existingItem) {
      setCartItems(prev => [...prev, { number, price: PRICE_PER_NUMBER }]);
    }
  };

  const removeFromCart = (number: number) => {
    setCartItems(prev => prev.filter(item => item.number !== number));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  const getTotalWithFee = (feePercentage: number) => {
    const baseTotal = getTotalPrice();
    return baseTotal + (baseTotal * feePercentage / 100);
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalWithFee,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
