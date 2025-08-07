import React from 'react';
import { Package, ArrowLeft } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-lg border-b-4 border-red-700">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* J&J Logo */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-700 to-red-800 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">J&J</span>
            </div>
            <div className="hidden sm:block">
              <h2 className="text-gray-600 text-sm font-medium">Johnson & Johnson</h2>
              <p className="text-gray-500 text-xs">Packaging Solutions</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center flex-1 max-w-2xl mx-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-700 to-blue-700 bg-clip-text text-transparent">
              Packaging Optimization Suite
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Advanced 3D Packing Solutions & Analytics
            </p>
          </div>

          {/* Icon */}
          <div className="flex items-center">
            <Package className="w-10 h-10 text-blue-700" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;