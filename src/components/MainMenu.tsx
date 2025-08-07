import React, { useState } from 'react';
import { Grid3x3, Hammer, Plus, Package } from 'lucide-react';
import { CategoryType } from '../App';

interface MainMenuProps {
  onCategorySelect: (category: CategoryType | string) => void;
  onAddCustomCategory: (categoryName: string) => void;
  customCategories: string[];
}

const MainMenu: React.FC<MainMenuProps> = ({ onCategorySelect, onAddCustomCategory, customCategories }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCustomCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddForm(false);
    }
  };

  const categories = [
    {
      id: 'TILES' as CategoryType,
      title: 'TILES',
      icon: Grid3x3,
      description: 'Optimize tile packaging and loading configurations',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'STRIKING_TOOLS' as CategoryType,
      title: 'STRIKING TOOLS',
      icon: Hammer,
      description: 'Optimize tool packaging and container loading',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Select Product Category</h2>
        <p className="text-gray-600 text-lg">Choose a category to begin optimizing your packaging solutions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`${category.bgColor} ${category.borderColor} border-2 rounded-2xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-xl transition-all duration-300 group`}
          >
            <div className="text-center">
              <div className={`w-20 h-20 bg-gradient-to-br ${category.color} rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:rotate-6 transition-transform duration-300`}>
                <category.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{category.title}</h3>
              <p className="text-gray-600">{category.description}</p>
            </div>
          </div>
        ))}

        {/* Add New Category Button */}
        <div
          onClick={() => setShowAddForm(true)}
          className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-xl transition-all duration-300 group hover:border-gray-400"
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
              <Plus className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">ADD NEW CATEGORY</h3>
            <p className="text-gray-600">Create a custom product category</p>
          </div>
        </div>
      </div>

      {/* Custom Categories */}
      {customCategories.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Custom Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customCategories.map((category, index) => (
              <div
                key={index}
                onClick={() => onCategorySelect(category)}
                className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 cursor-pointer transform hover:scale-105 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{category}</h4>
                  <p className="text-gray-600 text-sm">Custom category</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Category Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add New Category</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter category name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleAddCategory}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                Add Category
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewCategoryName('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-400 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;