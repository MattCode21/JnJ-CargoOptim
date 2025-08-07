import React, { useState } from 'react';
import { Play, Layers, Eye, MessageSquare } from 'lucide-react';
import { CategoryType } from '../../App';
import ThreeDViewer from '../ThreeDViewer';
import { apiService, PackingResult } from '../../services/api';

interface PalletTabProps {
  category: CategoryType;
}

interface PalletPackingData {
  masterCartonDimensions: { length: number; width: number; height: number };
  masterCartonWeight: number;
  palletDimensions: { length: number; width: number; height: number };
  palletMaxWeight: number;
  unit: string;
}

const PalletTab: React.FC<PalletTabProps> = ({ category }) => {
  const [packingData, setPackingData] = useState<PalletPackingData>({
    masterCartonDimensions: { length: 0, width: 0, height: 0 },
    masterCartonWeight: 0,
    palletDimensions: { length: 120, width: 100, height: 150 }, // Standard pallet size
    palletMaxWeight: 1000,
    unit: 'cm'
  });
  
  const [packingResult, setPackingResult] = useState<PackingResult | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const calculatePacking = async () => {
    if (!packingData.masterCartonDimensions.length || !packingData.palletDimensions.length) return;
    
    setIsProcessing(true);
    
    try {
      const result = await apiService.calculatePacking(
        category,
        'pallet',
        packingData.masterCartonDimensions,
        packingData.masterCartonWeight,
        packingData.palletDimensions,
        packingData.palletMaxWeight
      );
      
      setPackingResult(result);
      setShowViewer(true);
    } catch (error) {
      console.error('Packing calculation error:', error);
      alert('Error calculating packing. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800">Pallet Configuration</h3>
          
          {/* Master Carton Dimensions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Master Carton Dimensions</h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                <input
                  type="number"
                  value={packingData.masterCartonDimensions.length}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    masterCartonDimensions: { ...prev.masterCartonDimensions, length: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                <input
                  type="number"
                  value={packingData.masterCartonDimensions.width}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    masterCartonDimensions: { ...prev.masterCartonDimensions, width: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                <input
                  type="number"
                  value={packingData.masterCartonDimensions.height}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    masterCartonDimensions: { ...prev.masterCartonDimensions, height: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Master Carton Weight (kg)</label>
              <input
                type="number"
                value={packingData.masterCartonWeight}
                onChange={(e) => setPackingData(prev => ({
                  ...prev,
                  masterCartonWeight: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Pallet Specifications */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Weight (kg)</label>
                <input
                  type="number"
                  value={packingData.palletMaxWeight}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    palletMaxWeight: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Measurement Unit</label>
                <select
                  value={packingData.unit}
                  onChange={(e) => setPackingData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="cm">Centimeters (cm)</option>
                  <option value="mm">Millimeters (mm)</option>
                  <option value="in">Inches (in)</option>
                  <option value="m">Meters (m)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Standard Pallet Presets */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Standard Pallet Presets</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPackingData(prev => ({
                  ...prev,
                  palletDimensions: { length: 120, width: 100, height: 150 },
                  palletMaxWeight: 1000
                }))}
                className="p-3 text-left bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="font-semibold text-green-800">Euro Pallet</div>
                <div className="text-sm text-green-600">120×100×150 cm</div>
              </button>
              <button
                onClick={() => setPackingData(prev => ({
                  ...prev,
                  palletDimensions: { length: 120, width: 120, height: 150 },
                  palletMaxWeight: 1200
                }))}
                className="p-3 text-left bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="font-semibold text-green-800">Standard Pallet</div>
                <div className="text-sm text-green-600">120×120×150 cm</div>
              </button>
            </div>
          </div>

          <button
            onClick={calculatePacking}
            disabled={isProcessing || !packingData.masterCartonDimensions.length}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>{isProcessing ? 'Processing...' : 'Calculate Pallet Loading'}</span>
          </button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800">Pallet Loading Results</h3>
          
          {packingResult ? (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="text-3xl font-bold text-green-700 mb-2">{packingResult.maxUnits}</div>
                  <div className="text-green-600">Master Cartons</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-700 mb-2">{Math.ceil(packingResult.maxUnits / 4)}</div>
                  <div className="text-blue-600">Layers</div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-700 mb-2">{packingResult.totalWeight.toFixed(1)} kg</div>
                <div className="text-yellow-600">Total Weight</div>
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
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000"
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
                    <h4 className="text-lg font-semibold text-gray-800">3D Pallet Visualization</h4>
                    <button className="flex items-center space-x-2 text-green-600 hover:text-green-700">
                      <Eye className="w-5 h-5" />
                      <span>View Loading Sequence</span>
                    </button>
                  </div>
                  <div className="h-96 bg-gray-100 rounded-lg">
                    <ThreeDViewer
                      containerDimensions={packingData.palletDimensions}
                      itemDimensions={packingData.masterCartonDimensions}
                      positions={packingResult.positions}
                      containerType="pallet"
                    />
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center space-x-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                  <h4 className="text-lg font-semibold text-gray-800">AI Optimization Suggestions</h4>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-2">Layer Optimization</h5>
                    <p className="text-gray-600 text-sm">
                      Current configuration uses {packingResult.layers} layers. Consider slightly reducing carton height 
                      to fit an additional layer and increase capacity by {Math.floor(packingResult.maxCartons * 0.15)} units.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-2">Weight Distribution</h5>
                    <p className="text-gray-600 text-sm">
                      Weight utilization is {packingResult.weightUtilization.toFixed(1)}%. 
                      Consider adding {(packingData.palletMaxWeight - packingResult.totalWeight).toFixed(1)} kg more product weight for better efficiency.
                    </p>
                  </div>
                </div>
                
                <button className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Get More AI Insights</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-600 mb-2">No Results Yet</h4>
              <p className="text-gray-500">Enter your carton and pallet dimensions to see loading optimization</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PalletTab;