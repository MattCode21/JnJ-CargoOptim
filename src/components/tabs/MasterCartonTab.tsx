import React, { useState } from 'react';
import { Upload, Play, RotateCw, Eye, MessageSquare, Package } from 'lucide-react';
import { CategoryType } from '../../App';
import ThreeDViewer from '../ThreeDViewer';
import { calculateMasterCartonPacking } from '../../utils/packingAlgorithms';

interface MasterCartonTabProps {
  category: CategoryType;
}

interface PackingData {
  unitDimensions: { length: number; width: number; height: number };
  unitWeight: number;
  masterCartonDimensions: { length: number; width: number; height: number };
  masterCartonMaxWeight: number;
  unit: string;
  productImage?: string;
}

interface PackingResult {
  maxUnits: number;
  totalWeight: number;
  spaceUtilization: number;
  weightUtilization: number;
  positions: Array<{ x: number; y: number; z: number; rotation: { x: number; y: number; z: number } }>;
}

const MasterCartonTab: React.FC<MasterCartonTabProps> = ({ category }) => {
  const [packingData, setPackingData] = useState<PackingData>({
    unitDimensions: { length: 0, width: 0, height: 0 },
    unitWeight: 0,
    masterCartonDimensions: { length: 0, width: 0, height: 0 },
    masterCartonMaxWeight: 0,
    unit: 'cm'
  });
  
  const [packingResult, setPackingResult] = useState<PackingResult | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPackingData(prev => ({
          ...prev,
          productImage: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculatePacking = async () => {
    if (!packingData.unitDimensions.length || !packingData.masterCartonDimensions.length) return;
    
    setIsProcessing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = calculateMasterCartonPacking(
      packingData.unitDimensions,
      packingData.unitWeight,
      packingData.masterCartonDimensions,
      packingData.masterCartonMaxWeight
    );
    
    setPackingResult(result);
    setShowViewer(true);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800">Product Configuration</h3>
          
          {/* Image Upload */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Product Image</h4>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {packingData.productImage && (
                <div className="mt-4">
                  <img
                    src={packingData.productImage}
                    alt="Product"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Unit Dimensions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Unit Carton Dimensions</h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                <input
                  type="number"
                  value={packingData.unitDimensions.length}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    unitDimensions: { ...prev.unitDimensions, length: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                <input
                  type="number"
                  value={packingData.unitDimensions.width}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    unitDimensions: { ...prev.unitDimensions, width: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                <input
                  type="number"
                  value={packingData.unitDimensions.height}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    unitDimensions: { ...prev.unitDimensions, height: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Weight</label>
                <input
                  type="number"
                  value={packingData.unitWeight}
                  onChange={(e) => setPackingData(prev => ({
                    ...prev,
                    unitWeight: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Measurement Unit</label>
                <select
                  value={packingData.unit}
                  onChange={(e) => setPackingData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cm">Centimeters (cm)</option>
                  <option value="mm">Millimeters (mm)</option>
                  <option value="in">Inches (in)</option>
                  <option value="m">Meters (m)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master Carton Dimensions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Master Carton Specifications</h4>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Weight (kg)</label>
              <input
                type="number"
                value={packingData.masterCartonMaxWeight}
                onChange={(e) => setPackingData(prev => ({
                  ...prev,
                  masterCartonMaxWeight: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={calculatePacking}
            disabled={isProcessing || !packingData.unitDimensions.length}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>{isProcessing ? 'Processing...' : 'Calculate Optimal Packing'}</span>
          </button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800">Packing Results</h3>
          
          {packingResult ? (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-700 mb-2">{packingResult.maxUnits}</div>
                  <div className="text-blue-600">Maximum Units</div>
                </div>
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="text-3xl font-bold text-green-700 mb-2">{packingResult.totalWeight.toFixed(1)} kg</div>
                  <div className="text-green-600">Total Weight</div>
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
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000"
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
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000"
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
                    <h4 className="text-lg font-semibold text-gray-800">3D Visualization</h4>
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                      <Eye className="w-5 h-5" />
                      <span>View Animation</span>
                    </button>
                  </div>
                  <div className="h-96 bg-gray-100 rounded-lg">
                    <ThreeDViewer
                      containerDimensions={packingData.masterCartonDimensions}
                      itemDimensions={packingData.unitDimensions}
                      positions={packingResult.positions}
                      containerType="carton"
                    />
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center space-x-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  <h4 className="text-lg font-semibold text-gray-800">AI Optimization Suggestions</h4>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-2">Dimensional Optimization</h5>
                    <p className="text-gray-600 text-sm">
                      Consider reducing the unit carton width by 5% to fit an additional layer, 
                      potentially increasing capacity by 15-20%.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-2">Weight Distribution</h5>
                    <p className="text-gray-600 text-sm">
                      Current weight utilization is {packingResult.weightUtilization.toFixed(1)}%. 
                      You can add {(packingData.masterCartonMaxWeight - packingResult.totalWeight).toFixed(1)} kg more weight.
                    </p>
                  </div>
                </div>
                
                <button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Ask AI More Questions</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-600 mb-2">No Results Yet</h4>
              <p className="text-gray-500">Enter your dimensions and click "Calculate Optimal Packing" to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterCartonTab;