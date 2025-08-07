import React, { useState } from 'react';
import { ArrowLeft, Upload, Search, Package } from 'lucide-react';
import { CategoryType } from '../App';
import ExcelUpload from './ExcelUpload';
import OptimumCombination from './OptimumCombination';
import PackingAlgorithm from './PackingAlgorithm';

interface ProductCategoryProps {
  category: CategoryType;
  onBack: () => void;
}

type OptionType = 'excel' | 'combination' | 'packing';

const ProductCategory: React.FC<ProductCategoryProps> = ({ category, onBack }) => {
  const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);

  const options = [
    {
      id: 'excel' as OptionType,
      title: 'Upload Excel Sheet',
      icon: Upload,
      description: 'Upload product data and get optimized packing calculations',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'combination' as OptionType,
      title: 'Choose Optimum Combination',
      icon: Search,
      description: 'Find the best product combination for your master carton',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'packing' as OptionType,
      title: 'Optimum Packing Algorithm',
      icon: Package,
      description: '3D visualization of optimal packing configurations',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const handleOptionSelect = (option: OptionType) => {
    setSelectedOption(option);
  };

  const handleBackToOptions = () => {
    setSelectedOption(null);
  };

  if (selectedOption) {
    return (
      <div className="max-w-7xl mx-auto">
        <button
          onClick={handleBackToOptions}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Options</span>
        </button>

        {selectedOption === 'excel' && <ExcelUpload category={category} />}
        {selectedOption === 'combination' && <OptimumCombination category={category} />}
        {selectedOption === 'packing' && <PackingAlgorithm category={category} />}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Categories</span>
        </button>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {category === 'CUSTOM' ? 'Custom Category' : category.replace('_', ' ')}
        </h2>
        <p className="text-gray-600 text-lg">Choose an optimization method</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => handleOptionSelect(option.id)}
            className={`${option.bgColor} ${option.borderColor} border-2 rounded-2xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-xl transition-all duration-300 group`}
          >
            <div className="text-center">
              <div className={`w-20 h-20 bg-gradient-to-br ${option.color} rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:rotate-6 transition-transform duration-300`}>
                <option.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{option.title}</h3>
              <p className="text-gray-600">{option.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCategory;