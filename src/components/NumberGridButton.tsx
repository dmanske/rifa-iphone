
import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface NumberGridButtonProps {
  numero: number;
  status: 'available' | 'selected' | 'sold';
  onClick: () => void;
  isMobile: boolean;
  disabled: boolean;
}

const NumberGridButton: React.FC<NumberGridButtonProps> = ({
  numero,
  status,
  onClick,
  isMobile,
  disabled
}) => {
  const { user } = useAuth();

  const getButtonClasses = () => {
    if (isMobile) {
      const baseClasses = "aspect-square rounded-xl font-bold text-base transition-all duration-300 border-2 flex items-center justify-center relative overflow-hidden min-h-[60px] touch-manipulation";
      
      switch (status) {
        case 'selected':
          return `${baseClasses} bg-gradient-to-br from-purple-600 to-blue-600 text-white border-purple-600 shadow-lg scale-105 cursor-pointer`;
        case 'sold':
          return `${baseClasses} bg-red-500 text-white border-red-600 cursor-not-allowed opacity-80`;
        default:
          return `${baseClasses} bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer shadow-md ${!user ? 'opacity-60' : ''}`;
      }
    } else {
      const baseClasses = "aspect-square rounded-xl font-bold text-sm transition-all duration-300 border-2 flex items-center justify-center relative overflow-hidden min-h-[50px] touch-manipulation";
      
      switch (status) {
        case 'selected':
          return `${baseClasses} bg-gradient-to-br from-purple-600 to-blue-600 text-white border-purple-600 shadow-lg scale-105 animate-pulse cursor-pointer`;
        case 'sold':
          return `${baseClasses} bg-red-500 text-white border-red-600 cursor-not-allowed opacity-80`;
        default:
          return `${baseClasses} bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:scale-105 active:scale-95 cursor-pointer shadow-md hover:shadow-lg ${!user ? 'opacity-60' : ''}`;
      }
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={getButtonClasses()}
      style={{ animationDelay: `${(numero % 50) * 20}ms` }}
    >
      {numero.toString().padStart(3, '0')}
      {status === 'sold' && (
        <span className="absolute top-1 right-1 text-xs">✗</span>
      )}
    </button>
  );
};

export default NumberGridButton;
