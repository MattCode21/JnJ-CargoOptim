import React, { useState } from 'react';
import Header from './components/Header';
import MainMenu from './components/MainMenu';
import ProductCategory from './components/ProductCategory';
import './index.css';

export type CategoryType = 'TILES' | 'STRIKING_TOOLS' | 'CUSTOM';

function App() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const handleCategorySelect = (category: CategoryType | string) => {
    if (typeof category === 'string') {
      setSelectedCategory('CUSTOM');
    } else {
      setSelectedCategory(category);
    }
  };

  const handleAddCustomCategory = (categoryName: string) => {
    setCustomCategories(prev => [...prev, categoryName]);
  };

  const handleBackToMenu = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {!selectedCategory ? (
          <MainMenu 
            onCategorySelect={handleCategorySelect}
            onAddCustomCategory={handleAddCustomCategory}
            customCategories={customCategories}
          />
        ) : (
          <ProductCategory 
            category={selectedCategory}
            onBack={handleBackToMenu}
          />
        )}
      </main>
    </div>
  );
}

export default App;