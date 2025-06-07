
import React from 'react';
import { Shuffle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface NumberGridControlsProps {
  onSelectRandom: (count: number) => void;
  onClearSelection: () => void;
  isMobile?: boolean;
}

const NumberGridControls: React.FC<NumberGridControlsProps> = ({
  onSelectRandom,
  onClearSelection,
  isMobile = false
}) => {
  const { user } = useAuth();

  if (!user) return null;

  if (isMobile) {
    return (
      <div className="px-4 pb-4 bg-white">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => onSelectRandom(1)}
            className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-2 rounded-full text-xs font-medium"
          >
            <Shuffle className="w-3 h-3" />
            <span>+1</span>
          </button>
          <button
            onClick={() => onSelectRandom(5)}
            className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-2 rounded-full text-xs font-medium"
          >
            <Shuffle className="w-3 h-3" />
            <span>+5</span>
          </button>
          <button
            onClick={() => onSelectRandom(10)}
            className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-2 rounded-full text-xs font-medium"
          >
            <Shuffle className="w-3 h-3" />
            <span>+10</span>
          </button>
          <button
            onClick={onClearSelection}
            className="bg-gray-200 text-gray-700 px-3 py-2 rounded-full text-xs font-medium"
          >
            Limpar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6 justify-center">
      <button
        onClick={() => onSelectRandom(1)}
        className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
      >
        <Shuffle className="w-3 h-3" />
        <span>+1 Aleatório</span>
      </button>
      <button
        onClick={() => onSelectRandom(5)}
        className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
      >
        <Shuffle className="w-3 h-3" />
        <span>+5 Aleatórios</span>
      </button>
      <button
        onClick={() => onSelectRandom(10)}
        className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
      >
        <Shuffle className="w-3 h-3" />
        <span>+10 Aleatórios</span>
      </button>
      <button
        onClick={onClearSelection}
        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
      >
        Limpar
      </button>
    </div>
  );
};

export default NumberGridControls;
