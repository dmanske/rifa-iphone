
import React from 'react';

interface NumberGridLegendProps {
  isMobile?: boolean;
}

const NumberGridLegend: React.FC<NumberGridLegendProps> = ({ isMobile = false }) => {
  const textSize = isMobile ? "text-xs" : "text-xs md:text-sm";
  const gap = isMobile ? "gap-4" : "gap-4 md:gap-6";

  return (
    <div className={`flex justify-center ${gap} ${textSize}`}>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded shadow-sm"></div>
        <span className="text-gray-600 font-medium">Disponível</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded shadow-sm"></div>
        <span className="text-gray-600 font-medium">Selecionado</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-red-500 rounded shadow-sm"></div>
        <span className="text-gray-600 font-medium">Vendido</span>
      </div>
    </div>
  );
};

export default NumberGridLegend;
