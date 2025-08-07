import React, { useState } from 'react';
import { Play, Container, Eye, MessageSquare } from 'lucide-react';
import { CategoryType } from '../../App';
import ThreeDViewer from '../ThreeDViewer';
import { calculateContainerPacking } from '../../utils/packingAlgorithms';

interface ContainerTabProps {
  category: CategoryType;
}

interface ContainerPackingData {
  palletDimensions: { length: number; width: number; height: number };
  palletWeight: number;
  containerType: '20ft' | '40ft';
  unit: string;
}

interface ContainerPackingResult {
  maxPallets: number;
  totalWeight: number;
  spaceUtilization: number;
  weightUtilization: number;
  positions: Array<{ x: number; y: number; z: number; rotation: { x: number; y: number; z: number } }>;
  arrangement: { rows: number; columns: number; layers: number };
}

const CONTAINER_SPECS = {
  '20ft': {
    internal: { length: 589, width: 235, height: 239 }, // cm
    maxWeight: 28200 // kg
  },
  '40ft': {
    internal: { length: 1203, width: 235, height: 239 }, // cm
    maxWeight: 26700 // kg
  }
};

const ContainerTab: React.FC<ContainerTabProps> = ({ category }) => {
  const [packingData, setPackingData] = useState<ContainerPackingData>({
    palletDimensions: { length: 120, width: 100, height: 150 },
    palletWeight: 800,
    containerType: '20ft',
    unit: 'cm'
  });
  
  const [packingResult, setPackingResult] = useState<ContainerPackingResult | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const calculatePacking = async () => {
    if (!packingData.palletDimensions.length) return;
    
    setIsProcessing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const containerDims = CONTAINER_SPECS[packingData.containerType].internal;
    const containerMaxWeight = CONTAINER_SPECS[packingData.containerType].maxWeight;
    
    const result = calculateContainerPacking(
      packingData.palletDimensions,
      packingData.palletWeight,
      containerDims,
      containerMaxWeight
    );
    
    setPackingResult(result);
    setShowViewer(true);
    setIsProcessing(false);
  };

  const currentContainer = CONTAINER_SPECS[packingData.containerType];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800">Container Configuration</h3>
          
          {/* Container Type Selection */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Container Type</h4>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPackingData(prev => ({ ...prev, containerType: '20ft' }))}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  packingData.containerType === '20ft'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">20ft</div>
                  <div className="text-sm text-gray-600">Standard Container</div>
                  <div className="text-xs text-gray-500 mt-1">5.9×2.35×2.39 m</div>
                  <div className="text-xs text-gray-500">Max: 28.2 tons</div>
                </div>
              </button>
              <button
                onClick={() => setPackingData(prev => ({ ...prev, containerType: '40ft' }))}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  packingData.containerType === '40ft'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">40ft</div>
                  <div className="text-sm text-gray-600">High Cube Container</div>
                  <div className="text-xs text-gray-500 mt-1">12×2.35×2.39 m</div>
                  <div className="text-xs text-gray-500">Max: 26.7 tons</div>
                </div>
              </button>
            </div>
          </div>

          {/* Pallet Dimensions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Pallet Specifications</h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                <input
                  type="number"
                  value={packingData.palletDimensions.length}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    palletDimensions: { ...prev.palletDimensions, length: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                <input
                  type="number"
                  value={packingData.palletDimensions.width}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    palletDimensions: { ...prev.palletDimensions, width: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                <input
                  type="number"
                  value={packingData.palletDimensions.height}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    palletDimensions: { ...prev.palletDimensions, height: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pallet Weight (kg)</label>
                <input
                  type="number"
                  value={packingData.palletWeight}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    palletWeight: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Measurement Unit</label>
                <select
                  value={packingData.unit}
                  onChange={(e) => setPackingData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="cm">Centimeters (cm)</option>
                  <option value="mm">Millimeters (mm)</option>
                  <option value="in">Inches (in)</option>
                  <option value="m">Meters (m)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Container Specifications Display */}
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <h4 className="text-lg font-semibold text-purple-800 mb-4">
              {packingData.containerType} Container Specifications
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-purple-600 font-medium">Internal Dimensions</div>
                <div className="text-purple-800">
                  {currentContainer.internal.length} × {currentContainer.internal.width} × {currentContainer.internal.height} cm
                </div>
              </div>
              <div>
                <div className="text-purple-600 font-medium">Maximum Weight</div>
                <div className="text-purple-800">{currentContainer.maxWeight.toLocaleString()} kg</div>
              </div>
              <div>
                <div className="text-purple-600 font-medium">Internal Volume</div>
                <div className="text-purple-800">
                  {((currentContainer.internal.length * currentContainer.internal.width * currentContainer.internal.height) / 1000000).toFixed(1)} m³
                </div>
              </div>
              <div>
                <div className="text-purple-600 font-medium">Container Type</div>
                <div className="text-purple-800">{packingData.containerType === '20ft' ? 'Standard' : 'High Cube'}</div>
              </div>
            </div>
          </div>

          <button
            onClick={calculatePacking}
            disabled={isProcessing || !packingData.palletDimensions.length}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>{isProcessing ? 'Processing...' : 'Calculate Container Loading'}</span>
          </button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800">Container Loading Results</h3>
          
          {packingResult ? (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <div className="text-3xl font-bold text-purple-700 mb-2">{packingResult.maxPallets}</div>
                  <div className="text-purple-600">Pallets</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-700 mb-2">{packingResult.totalWeight.toFixed(1)} kg</div>
                  <div className="text-blue-600">Total Weight</div>
                </div>
              </div>

              {/* Arrangement Details */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Loading Arrangement</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-700">{packingResult.arrangement.rows}</div>
                    <div className="text-sm text-gray-600">Rows</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-700">{packingResult.arrangement.columns}</div>
                    <div className="text-sm text-gray-600">Columns</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-700">{packingResult.arrangement.layers}</div>
                    <div className="text-sm text-gray-600">Layers</div>
                  </div>
                </div>
              </div>

              {/* Utilization Bars */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Utilization Analysis</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Space Utilization</span>
                      <span>{packingResult.spaceUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${packingResult.spaceUtilization}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Weight Utilization</span>
                      <span>{packingResult.weightUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${packingResult.weightUtilization}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3D Viewer */}
              {showViewer && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">3D Container Visualization</h4>
                    <button className="flex items-center space-x-2 text-purple-600 hover:text-purple-700">
                      <Eye className="w-5 h-5" />
                      <span>View Loading Animation</span>
                    </button>
                  </div>
                  <div className="h-96 bg-gray-100 rounded-lg">
                    <ThreeDViewer
                      containerDimensions={currentContainer.internal}
                      itemDimensions={packingData.palletDimensions}
                      positions={packingResult.positions}
                      containerType="container"
                    />
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center space-x-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  <h4 className="text-lg font-semibold text-gray-800">AI Optimization Suggestions</h4>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-2">Container Utilization</h5>
                    <p className="text-gray-600 text-sm">
                      Current space utilization is {packingResult.spaceUtilization.toFixed(1)}%. 
                      {packingResult.spaceUtilization < 85 
                        ? "Consider optimizing pallet dimensions to improve container efficiency."
                        : "Excellent space utilization achieved!"
                      }
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-2">Alternative Container</h5>
                    <p className="text-gray-600 text-sm">
                      {packingData.containerType === '20ft' 
                        ? `A 40ft container could potentially hold ${Math.floor(packingResult.maxPallets * 2.04)} pallets, improving cost efficiency for larger shipments.`
                        : `A 20ft container might be more cost-effective for smaller shipments, holding approximately ${Math.floor(packingResult.maxPallets * 0.49)} pallets.`
                      }
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-2">Weight Optimization</h5>
                    <p className="text-gray-600 text-sm">
                      Weight utilization is {packingResult.weightUtilization.toFixed(1)}%. 
                      {packingResult.weightUtilization < 90
                        ? `You can add approximately ${(currentContainer.maxWeight - packingResult.totalWeight).toFixed(0)} kg more weight.`
                        : "Weight capacity is well utilized."
                      }
                    </p>
                  </div>
                </div>
                
                <button className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Ask AI for More Insights</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <Container className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-600 mb-2">No Results Yet</h4>
              <p className="text-gray-500">Configure your pallet dimensions and container type to see loading optimization</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContainerTab;