import React, { useState, useCallback } from 'react';
import { Upload, Search, Package, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CategoryType } from '../App';
import { apiService, CombinationResult } from '../services/api';

interface OptimumCombinationProps {
  category: CategoryType;
}

interface Product {
  productName: string;
  unitWeight: number;
  unitCartonDimensions: string;
  length: number;
  width: number;
  height: number;
  volume: number;
}

const OptimumCombination: React.FC<OptimumCombinationProps> = ({ category }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [masterCartonDims, setMasterCartonDims] = useState({ length: 0, width: 0, height: 0 });
  const [maxWeight, setMaxWeight] = useState<number>(0);
  const [result, setResult] = useState<CombinationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const processedProducts: Product[] = jsonData.map((row: any) => {
          const dimensions = parseDimensions(row['unit carton dimensions'] || '');
          return {
            productName: row['product name'] || '',
            unitWeight: parseFloat(row['unit weight']) || 0,
            unitCartonDimensions: row['unit carton dimensions'] || '',
            length: dimensions.length,
            width: dimensions.width,
            height: dimensions.height,
            volume: dimensions.length * dimensions.width * dimensions.height,
          };
        });
        
        setProducts(processedProducts);
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const parseDimensions = (dimString: string) => {
    const matches = dimString.match(/(\d+(?:\.\d+)?)/g);
    if (matches && matches.length >= 3) {
      return {
        length: parseFloat(matches[0]),
        width: parseFloat(matches[1]),
        height: parseFloat(matches[2])
      };
    }
    return { length: 0, width: 0, height: 0 };
  };

  const calculateOptimalCombination = async () => {
    if (products.length === 0 || maxWeight <= 0) return;
    
    setIsProcessing(true);
    
    try {
      const combination = await apiService.calculateOptimalCombination(
        products,
        masterCartonDims,
        maxWeight
      );
      setResult(combination);
    } catch (error) {
      console.error('Calculation error:', error);
      alert('Error calculating optimal combination. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    const exportData = result.map(item => ({
      'Product Name': item.product.productName,
      'Quantity': item.quantity,
      'Unit Weight': item.product.unitWeight,
      'Total Weight': item.totalWeight,
      'Unit Dimensions': item.product.unitCartonDimensions,
      'Total Volume': item.totalVolume,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Optimal Combination');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `optimal_combination_${category}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Optimum Product Combination</h2>
          <p className="text-gray-600">Find the best combination of products for your master carton</p>
        </div>

        {/* File Upload */}
        {!products.length ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {isDragActive ? 'Drop your Excel file here' : 'Upload Product Data'}
            </h3>
            <p className="text-gray-500 mb-4">
              Upload Excel file with product data
            </p>
            <div className="bg-gray-100 rounded-xl p-4 max-w-2xl mx-auto">
              <h4 className="font-semibold text-gray-700 mb-2">Required Format:</h4>
              <p className="text-sm text-gray-600">
                product name, unit weight, unit carton dimensions
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Master Carton Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Master Carton Dimensions</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                    <input
                      type="number"
                      value={masterCartonDims.length}
                      onChange={(e) => setMasterCartonDims(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                    <input
                      type="number"
                      value={masterCartonDims.width}
                      onChange={(e) => setMasterCartonDims(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                    <input
                      type="number"
                      value={masterCartonDims.height}
                      onChange={(e) => setMasterCartonDims(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Weight Constraint</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Weight (kg)</label>
                  <input
                    type="number"
                    value={maxWeight}
                    onChange={(e) => setMaxWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={calculateOptimalCombination}
                  disabled={isProcessing || !products.length || !maxWeight}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Search className="w-5 h-5" />
                  <span>{isProcessing ? 'Calculating...' : 'Find Optimal Combination'}</span>
                </button>
              </div>
            </div>

            {/* Products Preview */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Available Products ({products.length})</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Product Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Weight</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Dimensions</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 5).map((product, index) => (
                      <tr key={index} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-3 border border-gray-200">{product.productName}</td>
                        <td className="px-4 py-3 border border-gray-200">{product.unitWeight} kg</td>
                        <td className="px-4 py-3 border border-gray-200">{product.unitCartonDimensions}</td>
                        <td className="px-4 py-3 border border-gray-200">{product.volume.toFixed(2)} cm³</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length > 5 && (
                  <p className="text-gray-500 text-center mt-4">... and {products.length - 5} more products</p>
                )}
              </div>
            </div>

            {/* Results */}
            {result.length > 0 && (
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold text-gray-800">Optimal Combination Result</h4>
                  <button
                    onClick={downloadResult}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Result</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-green-300">
                    <div className="text-2xl font-bold text-green-700">{result.length}</div>
                    <div className="text-green-600">Different Products</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-300">
                    <div className="text-2xl font-bold text-green-700">
                      {result.reduce((sum, item) => sum + item.totalWeight, 0).toFixed(2)} kg
                    </div>
                    <div className="text-green-600">Total Weight</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-300">
                    <div className="text-2xl font-bold text-green-700">
                      {result.reduce((sum, item) => sum + item.totalVolume, 0).toFixed(2)} cm³
                    </div>
                    <div className="text-green-600">Total Volume</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Product</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Quantity</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Unit Weight</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Total Weight</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Total Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.map((item, index) => (
                        <tr key={index} className="bg-white hover:bg-green-50">
                          <td className="px-4 py-3 border border-gray-200 font-medium">{item.product.productName}</td>
                          <td className="px-4 py-3 border border-gray-200 text-center font-bold text-green-700">{item.quantity}</td>
                          <td className="px-4 py-3 border border-gray-200">{item.product.unitWeight} kg</td>
                          <td className="px-4 py-3 border border-gray-200 font-semibold">{item.totalWeight.toFixed(2)} kg</td>
                          <td className="px-4 py-3 border border-gray-200">{item.totalVolume.toFixed(2)} cm³</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimumCombination;