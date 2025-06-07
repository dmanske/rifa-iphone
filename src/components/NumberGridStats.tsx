
import React from 'react';

interface NumberGridStatsProps {
  availableCount: number;
  soldCount: number;
  isMobile?: boolean;
}

const NumberGridStats: React.FC<NumberGridStatsProps> = ({
  availableCount,
  soldCount,
  isMobile = false
}) => {
  const gridCols = isMobile ? "grid-cols-3" : "grid-cols-3";
  const textSize = isMobile ? "text-lg" : "text-xl md:text-2xl";
  const labelSize = isMobile ? "text-xs" : "text-xs md:text-sm";

  return (
    <div className={`grid ${gridCols} gap-${isMobile ? '3' : '4'} ${isMobile ? 'p-4' : 'mb-6'} bg-white`}>
      <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-${isMobile ? '3' : '4'}">
        <div className={`${textSize} font-bold text-blue-600`}>{availableCount}</div>
        <div className={`${labelSize} text-blue-600 font-medium`}>Disponíveis</div>
      </div>
      <div className="text-center bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-${isMobile ? '3' : '4'}">
        <div className={`${textSize} font-bold text-red-600`}>{soldCount}</div>
        <div className={`${labelSize} text-red-600 font-medium`}>Vendidos</div>
      </div>
      <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-${isMobile ? '3' : '4'}">
        <div className={`${textSize} font-bold text-green-600`}>R$ 100</div>
        <div className={`${labelSize} text-green-600 font-medium`}>Por número</div>
      </div>
    </div>
  );
};

export default NumberGridStats;
