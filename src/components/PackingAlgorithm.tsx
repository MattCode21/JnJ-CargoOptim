import React, { useState } from 'react';
import { Package, Layers, Container } from 'lucide-react';
import { CategoryType } from '../App';
import MasterCartonTab from './tabs/MasterCartonTab';
import PalletTab from './tabs/PalletTab';
import ContainerTab from './tabs/ContainerTab';

interface PackingAlgorithmProps {
  category: CategoryType;
}

type TabType = 'carton' | 'pallet' | 'container';

const PackingAlgorithm: React.FC<PackingAlgorithmProps> = ({ category }) => {
  const [activeTab, setActiveTab] = useState<TabType>('carton');

  const tabs = [
    {
      id: 'carton' as TabType,
      title: 'Master Carton Loading',
      icon: Package,
      description: 'Optimize unit carton placement in master cartons',
      color: 'from-blue-500 to-blue-600',
      activeColor: 'border-blue-500 bg-blue-50 text-blue-700'
    },
    {
      id: 'pallet' as TabType,
      title: 'Pallet Loading',
      icon: Layers,
      description: 'Optimize master carton placement on pallets',
      color: 'from-green-500 to-green-600',
      activeColor: 'border-green-500 bg-green-50 text-green-700'
    },
    {
      id: 'container' as TabType,
      title: 'Container Loading',
      icon: Container,
      description: 'Optimize pallet placement in shipping containers',
      color: 'from-purple-500 to-purple-600',
      activeColor: 'border-purple-500 bg-purple-50 text-purple-700'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">3D Packing Algorithm</h2>
          <p className="text-gray-600">Visualize and optimize your packing configurations</p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                activeTab === tab.id
                  ? tab.activeColor
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-4 mb-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${tab.color} rounded-xl flex items-center justify-center`}>
                  <tab.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold">{tab.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{tab.description}</p>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-50 rounded-2xl p-8">
          {activeTab === 'carton' && <MasterCartonTab category={category} />}
          {activeTab === 'pallet' && <PalletTab category={category} />}
          {activeTab === 'container' && <ContainerTab category={category} />}
        </div>
      </div>
    </div>
  );
};

export default PackingAlgorithm;