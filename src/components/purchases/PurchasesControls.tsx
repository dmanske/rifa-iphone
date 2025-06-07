
import React from 'react';
import { Search, Eye, EyeOff, FileText } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface PurchasesControlsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showSensitiveData: boolean;
  onToggleSensitiveData: () => void;
  onGeneratePDF: () => void;
}

const PurchasesControls: React.FC<PurchasesControlsProps> = ({
  searchTerm,
  onSearchChange,
  showSensitiveData,
  onToggleSensitiveData,
  onGeneratePDF
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar por nome, email, telefone, números, status..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onToggleSensitiveData}
          className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showSensitiveData ? 'Ocultar' : 'Mostrar'} Dados</span>
        </button>
        
        <button
          onClick={onGeneratePDF}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <FileText className="w-4 h-4" />
          <span>PDF Moderno</span>
        </button>
      </div>
    </div>
  );
};

export default PurchasesControls;
